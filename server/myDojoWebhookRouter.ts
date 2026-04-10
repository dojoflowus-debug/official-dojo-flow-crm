/**
 * MyDojo Webhook Router
 * Receives real-time intro appointment events from mydojoma.com
 * and creates/updates leads in DojoFlow CRM.
 *
 * Endpoint: POST /api/webhooks/mydojo
 * Auth:     x-webhook-secret header must match MYDOJO_WEBHOOK_SECRET env var
 *           (same secret configured in mydojoma.com webhook settings)
 */

import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { leads } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";

const router = Router();

// The shared secret — must match MYDOJO_WEBHOOK_SECRET on both sides
const WEBHOOK_SECRET = process.env.MYDOJO_WEBHOOK_SECRET || "dojo-flow-mydojo-sync-2026";

// Default org ID for vincent.holmes00@gmail.com (MyDojo)
const MYDOJO_ORG_ID = 210001;

router.post("/api/webhooks/mydojo", async (req: Request, res: Response) => {
  try {
    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const incomingSecret =
      req.headers["x-webhook-secret"] ||
      req.headers["x-api-key"] ||
      req.query.secret;

    if (incomingSecret !== WEBHOOK_SECRET) {
      console.warn("[MyDojo Webhook] Unauthorized request — bad secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ── 2. Parse payload ─────────────────────────────────────────────────────
    const payload = req.body as {
      event?: string;          // e.g. "intro_appointment.created"
      appointment?: {
        id?: number | string;
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
        phone?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        program?: string;
        notes?: string;
        source?: string;
        childName?: string;
        childAge?: number | string;
        parentName?: string;
      };
      // Flat format (some webhook senders flatten the object)
      firstName?: string;
      lastName?: string;
      name?: string;
      email?: string;
      phone?: string;
      appointmentDate?: string;
      program?: string;
      notes?: string;
    };

    // Support both nested and flat payload formats
    const appt = payload.appointment || payload;
    const event = payload.event || "intro_appointment.created";

    console.log(`[MyDojo Webhook] Received event: ${event}`, JSON.stringify(appt, null, 2));

    // ── 3. Extract fields ────────────────────────────────────────────────────
    let firstName: string;
    let lastName: string;

    if (appt.firstName || appt.lastName) {
      firstName = (appt.firstName || "").trim();
      lastName = (appt.lastName || "").trim();
    } else if (appt.name) {
      const parts = appt.name.trim().split(/\s+/);
      firstName = parts[0] || "Unknown";
      lastName = parts.slice(1).join(" ") || firstName;
    } else {
      return res.status(400).json({ error: "Missing name fields" });
    }

    const email = appt.email?.trim() || undefined;
    const phone = appt.phone?.replace(/\D/g, "").replace(/^(\d{10})$/, "($1)").trim() || undefined;

    if (!email && !phone) {
      return res.status(400).json({ error: "Either email or phone is required" });
    }

    const source = appt.source || "MyDojo Website";
    const program = appt.program || undefined;
    const notes = [
      appt.notes,
      appt.appointmentDate ? `Appointment: ${appt.appointmentDate}` : null,
      appt.childName ? `Child: ${appt.childName}` : null,
      appt.childAge ? `Age: ${appt.childAge}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || undefined;

    // ── 4. Upsert lead ───────────────────────────────────────────────────────
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Check for existing lead by email or phone
    let existingLead: { id: number } | undefined;
    if (email) {
      const rows = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.email, email), eq(leads.organizationId, MYDOJO_ORG_ID)))
        .limit(1);
      existingLead = rows[0];
    }
    if (!existingLead && phone) {
      const rows = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.phone, phone), eq(leads.organizationId, MYDOJO_ORG_ID)))
        .limit(1);
      existingLead = rows[0];
    }

    if (existingLead) {
      // Update existing lead — bump status to Intro Scheduled
      await db
        .update(leads)
        .set({
          firstName,
          lastName,
          email: email || undefined,
          phone: phone || undefined,
          source,
          interestedProgram: program,
          notes,
          status: "Intro Scheduled",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(leads.id, existingLead.id));

      console.log(`[MyDojo Webhook] Updated lead #${existingLead.id} (${firstName} ${lastName})`);
      return res.json({
        success: true,
        action: "updated",
        lead_id: existingLead.id,
        message: `Lead updated: ${firstName} ${lastName}`,
      });
    }

    // Create new lead
    const insertResult = await db
      .insert(leads)
      .values({
        firstName,
        lastName,
        email,
        phone,
        source,
        interestedProgram: program,
        notes,
        status: "Intro Scheduled",
        stage: "appointment_set",
        organizationId: MYDOJO_ORG_ID,
        leadScore: 70, // Intro appointments are warm leads
      });

    // insertId is available on the raw result for MySQL
    const newLeadId: number = (insertResult as any).insertId ?? (insertResult as any)[0]?.insertId ?? 0;
    console.log(`[MyDojo Webhook] Created lead #${newLeadId} (${firstName} ${lastName})`);

    // Fire notification asynchronously
    try {
      const { notifyNewLead } = await import("./services/notifications.js");
      notifyNewLead({
        id: newLeadId,
        firstName,
        lastName,
        email,
        phone,
        source,
      }).catch(() => {});
    } catch {}

    return res.json({
      success: true,
      action: "created",
      lead_id: newLeadId,
      message: `Lead created: ${firstName} ${lastName}`,
    });
  } catch (err: any) {
    console.error("[MyDojo Webhook] Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Health check for the webhook endpoint
router.get("/api/webhooks/mydojo/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    endpoint: "POST /api/webhooks/mydojo",
    auth: "x-webhook-secret header",
    timestamp: new Date().toISOString(),
  });
});

export default router;
