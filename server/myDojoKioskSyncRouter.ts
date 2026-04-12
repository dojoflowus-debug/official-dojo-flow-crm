/**
 * MyDojo Kiosk Sync API — Public REST endpoints
 *
 * Allows the MyDojo website to stay in sync with the DojoFlow kiosk:
 *   - Pull class schedules, programs, and branding to display on the website
 *   - Push check-ins from the MyDojo member portal into DojoFlow attendance
 *
 * Auth: x-api-key header (widgetApiKey from organizations table)
 *
 * Endpoints:
 *   GET  /api/mydojo/sync/status      — connection health + org info
 *   GET  /api/mydojo/sync/schedule    — weekly class schedule
 *   GET  /api/mydojo/sync/programs    — programs available for enrollment
 *   GET  /api/mydojo/sync/kiosk       — branding/settings for MyDojo site
 *   GET  /api/mydojo/sync/checkins    — today's check-ins (member portal)
 *   POST /api/mydojo/sync/checkin     — record a check-in from MyDojo website
 */

import { Router, Request, Response } from "express";
import { getDb } from "./db";

const router = Router();

// ── Auth helper ───────────────────────────────────────────────────────────────
async function resolveOrg(req: Request, res: Response): Promise<{ orgId: number; orgName: string } | null> {
  const apiKey = (req.headers["x-api-key"] as string) || (req.query.api_key as string);
  if (!apiKey) {
    res.status(401).json({ error: "Missing x-api-key header" });
    return null;
  }
  const db = await getDb();
  if (!db) {
    res.status(500).json({ error: "Database unavailable" });
    return null;
  }
  const { organizations } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.widgetApiKey, apiKey))
    .limit(1);
  if (!rows.length) {
    res.status(401).json({ error: "Invalid API key" });
    return null;
  }
  return { orgId: rows[0].id, orgName: rows[0].name };
}

// ── GET /api/mydojo/sync/status ───────────────────────────────────────────────
router.get("/api/mydojo/sync/status", async (req: Request, res: Response) => {
  const org = await resolveOrg(req, res);
  if (!org) return;
  res.json({
    connected: true,
    organization: org.orgName,
    organizationId: org.orgId,
    timestamp: new Date().toISOString(),
    version: "1.0",
    endpoints: {
      schedule: "GET /api/mydojo/sync/schedule",
      programs: "GET /api/mydojo/sync/programs",
      kiosk: "GET /api/mydojo/sync/kiosk",
      checkins: "GET /api/mydojo/sync/checkins",
      checkin: "POST /api/mydojo/sync/checkin",
    },
  });
});

// ── GET /api/mydojo/sync/schedule ─────────────────────────────────────────────
router.get("/api/mydojo/sync/schedule", async (req: Request, res: Response) => {
  const org = await resolveOrg(req, res);
  if (!org) return;
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { classes } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const schedule = await db
      .select({
        id: classes.id,
        name: classes.name,
        dayOfWeek: classes.dayOfWeek,
        startTime: classes.startTime,
        endTime: classes.endTime,
        time: classes.time,
        program: classes.program,
        level: classes.level,
        instructor: classes.instructor,
        capacity: classes.capacity,
        enrolled: classes.enrolled,
        room: classes.room,
      })
      .from(classes)
      .where(and(eq(classes.organizationId, org.orgId), eq(classes.isActive, 1)))
      .orderBy(classes.dayOfWeek, classes.time);

    // Group by day of week
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const byDay: Record<string, typeof schedule> = {};
    for (const day of dayOrder) byDay[day] = [];
    for (const cls of schedule) {
      const day = cls.dayOfWeek || "Monday";
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(cls);
    }

    res.json({
      organizationId: org.orgId,
      totalClasses: schedule.length,
      schedule,
      byDay,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[MyDojo Kiosk Sync] schedule error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mydojo/sync/programs ─────────────────────────────────────────────
router.get("/api/mydojo/sync/programs", async (req: Request, res: Response) => {
  const org = await resolveOrg(req, res);
  if (!org) return;
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { programs } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const allPrograms = await db
      .select({
        id: programs.id,
        name: programs.name,
        description: programs.description,
        type: programs.type,
        ageRange: programs.ageRange,
        price: programs.price,
        trialType: programs.trialType,
        trialLengthDays: programs.trialLengthDays,
        trialPrice: programs.trialPrice,
        showOnKiosk: programs.showOnKiosk,
        isActive: programs.isActive,
        sortOrder: programs.sortOrder,
        isCoreProgram: programs.isCoreProgram,
      })
      .from(programs)
      .where(and(eq(programs.organizationId, org.orgId), eq(programs.isActive, 1)))
      .orderBy(programs.sortOrder, programs.name);

    // Prefer programs marked showOnKiosk; fall back to all active
    const publicPrograms = allPrograms.filter(p => p.showOnKiosk === 1 || p.showOnKiosk === true);
    const result = publicPrograms.length > 0 ? publicPrograms : allPrograms;

    res.json({
      organizationId: org.orgId,
      programs: result,
      totalPrograms: result.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[MyDojo Kiosk Sync] programs error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mydojo/sync/kiosk ────────────────────────────────────────────────
router.get("/api/mydojo/sync/kiosk", async (req: Request, res: Response) => {
  const org = await resolveOrg(req, res);
  if (!org) return;
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { dojoSettings } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select({
        businessName: dojoSettings.businessName,
        schoolName: dojoSettings.schoolName,
        logoSquare: dojoSettings.logoSquare,
        logoHorizontal: dojoSettings.logoHorizontal,
        logoDarkUrl: dojoSettings.logoDarkUrl,
        logoLightUrl: dojoSettings.logoLightUrl,
        primaryColor: dojoSettings.primaryColor,
        secondaryColor: dojoSettings.secondaryColor,
        contactEmail: dojoSettings.contactEmail,
        contactPhone: dojoSettings.contactPhone,
        website: dojoSettings.website,
        addressLine1: dojoSettings.addressLine1,
        city: dojoSettings.city,
        state: dojoSettings.state,
        zipCode: dojoSettings.zipCode,
        martialArtsStyle: dojoSettings.martialArtsStyle,
        bookingLink: dojoSettings.bookingLink,
      })
      .from(dojoSettings)
      .where(eq(dojoSettings.organizationId, org.orgId))
      .limit(1);

    const s = (rows[0] || {}) as any;
    res.json({
      organizationId: org.orgId,
      branding: {
        name: s.schoolName || s.businessName || org.orgName,
        logoSquare: s.logoSquare || null,
        logoHorizontal: s.logoHorizontal || null,
        logoDark: s.logoDarkUrl || null,
        logoLight: s.logoLightUrl || null,
        primaryColor: s.primaryColor || "#ef4444",
        secondaryColor: s.secondaryColor || "#1f2937",
      },
      contact: {
        email: s.contactEmail || null,
        phone: s.contactPhone || null,
        website: s.website || null,
        address: s.addressLine1 || null,
        city: s.city || null,
        state: s.state || null,
        zip: s.zipCode || null,
      },
      booking: {
        link: s.bookingLink || null,
        style: s.martialArtsStyle || null,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[MyDojo Kiosk Sync] kiosk error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/mydojo/sync/checkins ─────────────────────────────────────────────
router.get("/api/mydojo/sync/checkins", async (req: Request, res: Response) => {
  const org = await resolveOrg(req, res);
  if (!org) return;
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { studentAttendance, students } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      .toISOString().slice(0, 10);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      .toISOString().slice(0, 10);

    const records = await db
      .select({
        id: studentAttendance.id,
        studentId: studentAttendance.studentId,
        classDate: studentAttendance.classDate,
        status: studentAttendance.status,
        checkInTime: studentAttendance.checkInTime,
      })
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.organizationId, org.orgId),
          gte(studentAttendance.classDate, todayStart),
          lte(studentAttendance.classDate, todayEnd)
        )
      )
      .limit(200);

    // Enrich with student names (batch)
    const studentIds = [...new Set(records.map(r => r.studentId).filter(Boolean))] as number[];
    const studentMap: Record<number, string> = {};
    if (studentIds.length > 0) {
      for (const sid of studentIds) {
        const sRows = await db
          .select({ firstName: students.firstName, lastName: students.lastName })
          .from(students)
          .where(eq(students.id, sid))
          .limit(1);
        if (sRows[0]) {
          studentMap[sid] = `${sRows[0].firstName} ${sRows[0].lastName}`.trim();
        }
      }
    }

    const enriched = records.map(r => ({
      ...r,
      studentName: r.studentId ? (studentMap[r.studentId] || "Unknown") : "Unknown",
    }));

    res.json({
      organizationId: org.orgId,
      date: todayStart,
      totalCheckIns: enriched.filter(r => r.status === "attended").length,
      checkins: enriched,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[MyDojo Kiosk Sync] checkins error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/mydojo/sync/checkin ─────────────────────────────────────────────
router.post("/api/mydojo/sync/checkin", async (req: Request, res: Response) => {
  const org = await resolveOrg(req, res);
  if (!org) return;
  try {
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });
    const { studentAttendance, students } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const { studentId, email, classDate, classId, notes } = req.body || {};

    // Resolve student by ID or email
    let resolvedStudentId: number | null = studentId ? Number(studentId) : null;
    if (!resolvedStudentId && email) {
      const sRows = await db
        .select({ id: students.id })
        .from(students)
        .where(and(eq(students.email, email.trim().toLowerCase()), eq(students.organizationId, org.orgId)))
        .limit(1);
      resolvedStudentId = sRows[0]?.id || null;
    }

    if (!resolvedStudentId) {
      return res.status(400).json({ error: "Student not found. Provide studentId or a valid email." });
    }

    const checkDate = classDate || new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Dedup check
    const existing = await db
      .select({ id: studentAttendance.id })
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.studentId, resolvedStudentId),
          eq(studentAttendance.classDate, checkDate),
          eq(studentAttendance.organizationId, org.orgId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.json({
        success: true,
        action: "already_checked_in",
        attendanceId: existing[0].id,
        message: "Student already checked in for today.",
      });
    }

    const insertResult = await db.insert(studentAttendance).values({
      studentId: resolvedStudentId,
      classDate: checkDate,
      classId: classId ? Number(classId) : null,
      status: "attended",
      checkInTime: now,
      notes: notes || "Checked in via MyDojo website",
      organizationId: org.orgId,
      createdAt: now,
      updatedAt: now,
    });

    const attendanceId = (insertResult as any).insertId ?? 0;
    console.log(`[MyDojo Kiosk Sync] Check-in: student #${resolvedStudentId} on ${checkDate} (org=${org.orgId})`);

    res.status(201).json({
      success: true,
      action: "checked_in",
      attendanceId,
      message: "Check-in recorded successfully.",
    });
  } catch (err: any) {
    console.error("[MyDojo Kiosk Sync] checkin POST error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
