import { getDb } from "./db";
import { leads, attendance, students } from "../drizzle/schema";
import { eq, and, lt, gte, lte, count } from "drizzle-orm";

export interface Alert {
  id: string;
  type: "lead_followup_overdue" | "at_risk_students";
  severity: "info" | "warn" | "critical";
  title: string;
  description: string;
  count: number;
  link: string;
}

export async function getDashboardAlerts(organizationId: number): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];

  const alerts: Alert[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Alert 1: Lead follow-up overdue (no contact in 7+ days)
  const overdueLeads = await db
    .select({ count: count() })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        lt(leads.lastContactDate, sevenDaysAgo.toISOString())
      )
    );

  if ((overdueLeads[0]?.count || 0) > 0) {
    alerts.push({
      id: "lead_followup_overdue",
      type: "lead_followup_overdue",
      severity: "warn",
      title: "Lead Follow-up Overdue",
      description: `${overdueLeads[0]?.count || 0} leads haven't been contacted in 7+ days`,
      count: overdueLeads[0]?.count || 0,
      link: "/leads?filter=no_contact_7d",
    });
  }

  // Alert 2: At-risk students (no attendance in 14+ days OR missed 2+ classes in 7 days)
  const now_str = now.toISOString();
  const sevenDaysAgo_str = sevenDaysAgo.toISOString();
  const fourteenDaysAgo_str = fourteenDaysAgo.toISOString();

  // Students with no attendance in 14 days
  const inactiveStudents = await db
    .select({ studentId: attendance.studentId })
    .from(attendance)
    .where(
      and(
        gte(attendance.checkInTime, fourteenDaysAgo_str),
        lte(attendance.checkInTime, now_str)
      )
    );

  const inactiveStudentIds = new Set(inactiveStudents.map((a) => a.studentId));

  const allActiveStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.organizationId, organizationId),
        eq(students.status, "Active")
      )
    );

  const atRiskCount = allActiveStudents.filter((s) => !inactiveStudentIds.has(s.id)).length;

  if (atRiskCount > 0) {
    alerts.push({
      id: "at_risk_students",
      type: "at_risk_students",
      severity: "critical",
      title: "At-Risk Students",
      description: `${atRiskCount} active students have no attendance in 14+ days`,
      count: atRiskCount,
      link: "/students?filter=at_risk",
    });
  }

  return alerts;
}
