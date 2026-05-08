/**
 * MyDojo Sync Router
 *
 * Pulls intro appointments and students from the mydojoma.com site
 * and imports them into the DojoFlow CRM leads / students tables.
 *
 * tRPC paths:
 *   myDojoSync.preview   – fetch data from mydojoma.com without saving
 *   myDojoSync.sync      – fetch + upsert into DojoFlow DB
 *   myDojoSync.getStatus – return last-sync metadata stored in dojo_settings
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { leads, students } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const MYDOJO_SYNC_URL = "https://mydojoma.com/api/sync-export";
const MYDOJO_API_KEY = "man-zone-outdoor";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Split a full name into first + last */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

/** Map mydojoma pipelineStage → DojoFlow lead status */
function mapStatus(
  pipelineStage: string,
  status: string
): "New Lead" | "Attempting Contact" | "Contact Made" | "Intro Scheduled" | "Offer Presented" | "Enrolled" | "Nurture" | "Lost/Winback" {
  const stage = (pipelineStage || status || "").toLowerCase();
  if (stage.includes("enrolled") || stage.includes("won")) return "Enrolled";
  if (stage.includes("intro") || stage.includes("scheduled") || stage.includes("trial")) return "Intro Scheduled";
  if (stage.includes("offer") || stage.includes("proposal")) return "Offer Presented";
  if (stage.includes("contact_made") || stage.includes("contacted")) return "Contact Made";
  if (stage.includes("attempting") || stage.includes("attempt")) return "Attempting Contact";
  if (stage.includes("nurture") || stage.includes("cold")) return "Nurture";
  if (stage.includes("lost") || stage.includes("winback")) return "Lost/Winback";
  return "New Lead";
}

/** Fetch the raw export data from mydojoma.com */
async function fetchMyDojoData() {
  const res = await fetch(MYDOJO_SYNC_URL, {
    headers: {
      "x-api-key": MYDOJO_API_KEY,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`mydojoma.com sync-export returned HTTP ${res.status}`);
  }

  const text = await res.text();
  // Guard against HTML fallback (SPA 200 with HTML body)
  if (text.trim().startsWith("<")) {
    throw new Error(
      "mydojoma.com returned HTML instead of JSON — the endpoint may not be deployed yet."
    );
  }

  return JSON.parse(text) as {
    exportedAt: string;
    counts: { introAppointments: number; students: number; classAppointments: number };
    introAppointments: any[];
    students: any[];
    classAppointments: any[];
  };
}

// ── router ────────────────────────────────────────────────────────────────────

export const myDojoSyncRouter = router({
  /**
   * Preview: fetch data from mydojoma.com without writing to DB.
   * Returns counts + first 5 records of each type for the UI preview.
   */
  preview: protectedProcedure.query(async () => {
    const data = await fetchMyDojoData();
    return {
      exportedAt: data.exportedAt,
      counts: data.counts,
      sampleLeads: data.introAppointments.slice(0, 5).map((a) => ({
        name: a.name,
        email: a.email,
        phone: a.phone,
        program: a.program,
        status: a.pipelineStage || a.status,
        source: a.source,
        createdAt: a.createdAt,
      })),
      sampleStudents: data.students.slice(0, 5).map((s) => ({
        name: s.studentName || s.customerName,
        email: s.customerEmail,
        phone: s.customerPhone,
        beltRank: s.beltRank,
        status: s.status,
        packageName: s.packageName,
        startDate: s.startDate,
      })),
    };
  }),

  /**
   * Sync: pull all data from mydojoma.com and upsert into DojoFlow.
   * Deduplication key for leads: email (per org).
   * Deduplication key for students: email (per org).
   */
  sync: protectedProcedure
    .input(
      z.object({
        importLeads: z.boolean().default(true),
        importStudents: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const orgId = ctx.currentOrganizationId;
      if (!orgId) throw new Error("No organization context");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const data = await fetchMyDojoData();

      let leadsCreated = 0;
      let leadsUpdated = 0;
      let leadsSkipped = 0;
      let studentsCreated = 0;
      let studentsUpdated = 0;
      let studentsSkipped = 0;
      const errors: string[] = [];

      // ── Import intro appointments as leads ──────────────────────────────
      if (input.importLeads) {
        for (const appt of data.introAppointments) {
          try {
            const { firstName, lastName } = splitName(appt.name || "");
            const email = (appt.email || "").trim().toLowerCase() || null;
            const phone = (appt.phone || "").replace(/[^0-9+]/g, "") || null;
            const leadStatus = mapStatus(appt.pipelineStage, appt.status);
            const source = appt.source
              ? appt.source.replace(/_/g, " ").replace(/^ghl:/, "GHL: ")
              : "MyDojo Website";

            // Dedup by email within this org
            let existingLeadId: number | null = null;
            if (email) {
              const [found] = await db
                .select({ id: leads.id })
                .from(leads)
                .where(and(eq(leads.organizationId, orgId), eq(leads.email, email)));
              if (found) existingLeadId = found.id;
            }

            if (existingLeadId !== null) {
              // Update status/notes if changed
              await db
                .update(leads)
                .set({
                  status: leadStatus,
                  notes: appt.notes || undefined,
                  lastContactDate: appt.lastContactedAt || undefined,
                  updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
                })
                .where(eq(leads.id, existingLeadId));
              leadsUpdated++;
            } else {
              await db.insert(leads).values({
                firstName,
                lastName,
                email,
                phone,
                status: leadStatus,
                source,
                interestedProgram: appt.program || null,
                notes: appt.notes || null,
                lastContactDate: appt.lastContactedAt || null,
                organizationId: orgId,
                createdAt: appt.createdAt
                  ? new Date(appt.createdAt).toISOString().slice(0, 19).replace("T", " ")
                  : new Date().toISOString().slice(0, 19).replace("T", " "),
                updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
              });
              leadsCreated++;
            }
          } catch (err: any) {
            errors.push(`Lead "${appt.name}": ${err.message}`);
            leadsSkipped++;
          }
        }
      }

      // ── Import students ─────────────────────────────────────────────────
      if (input.importStudents) {
        for (const s of data.students) {
          try {
            const fullName = s.studentName || s.customerName || "";
            const { firstName, lastName } = splitName(fullName);
            const email = (s.customerEmail || "").trim().toLowerCase() || null;
            const phone = (s.customerPhone || "").replace(/[^0-9+]/g, "") || null;
            const beltRank = s.beltRank || null;
            const studentStatus: "Active" | "Inactive" | "On Hold" =
              s.status === "active" ? "Active" : s.status === "frozen" ? "On Hold" : "Inactive";

            // Dedup by email within this org; fall back to phone+name when email is missing
            let existingStudentId: number | null = null;
            if (email) {
              const [found] = await db
                .select({ id: students.id })
                .from(students)
                .where(
                  and(eq(students.organizationId, orgId), eq(students.email, email))
                );
              if (found) existingStudentId = found.id;
            }
            // Secondary dedup: match by phone + firstName + lastName when no email
            if (existingStudentId === null && phone && firstName && lastName) {
              const [found] = await db
                .select({ id: students.id })
                .from(students)
                .where(
                  and(
                    eq(students.organizationId, orgId),
                    eq(students.phone, phone),
                    eq(students.firstName, firstName),
                    eq(students.lastName, lastName)
                  )
                );
              if (found) existingStudentId = found.id;
            }

            if (existingStudentId !== null) {
              await db
                .update(students)
                .set({
                  beltRank,
                  status: studentStatus,
                  membershipStatus: s.packageName || undefined,
                  updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
                })
                .where(eq(students.id, existingStudentId));
              studentsUpdated++;
            } else {
              await db.insert(students).values({
                firstName,
                lastName,
                email,
                phone,
                beltRank,
                status: studentStatus,
                membershipStatus: s.packageName || null,
                program: s.packageName || null,
                organizationId: orgId,
                createdAt: s.createdAt
                  ? new Date(s.createdAt).toISOString().slice(0, 19).replace("T", " ")
                  : new Date().toISOString().slice(0, 19).replace("T", " "),
                updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
              });
              studentsCreated++;
            }
          } catch (err: any) {
            errors.push(`Student "${s.studentName || s.customerName}": ${err.message}`);
            studentsSkipped++;
          }
        }
      }

      // ── Persist last-sync timestamp in dojo_settings ────────────────────
      try {
        const rawDb = db as any;
        await rawDb.execute(
          `UPDATE dojo_settings SET lastMyDojoSync = ? WHERE organizationId = ?`,
          [new Date().toISOString(), orgId]
        );
      } catch {
        // Non-fatal — column may not exist yet
      }

      return {
        success: true,
        syncedAt: new Date().toISOString(),
        leads: { created: leadsCreated, updated: leadsUpdated, skipped: leadsSkipped },
        students: { created: studentsCreated, updated: studentsUpdated, skipped: studentsSkipped },
        errors: errors.slice(0, 20),
      };
    }),

  /** Return the last sync timestamp from dojo_settings */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.currentOrganizationId;
    if (!orgId) return { lastSyncAt: null };

    try {
      const db = await getDb();
      if (!db) return { lastSyncAt: null };
      const rawDb = db as any;
      const [rows] = await rawDb.execute(
        `SELECT lastMyDojoSync FROM dojo_settings WHERE organizationId = ? LIMIT 1`,
        [orgId]
      );
      const lastSyncAt = Array.isArray(rows) && rows[0] ? (rows[0] as any).lastMyDojoSync : null;
      return { lastSyncAt };
    } catch {
      return { lastSyncAt: null };
    }
  }),
});
