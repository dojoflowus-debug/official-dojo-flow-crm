/**
 * Kai Context Loader
 * Builds a rich structured context snapshot for every Kai chat request.
 * Injects school profile, stats, programs, schedule, staff, and recent leads
 * into the system prompt so Kai never asks for info the system already has.
 */

import { eq, and, desc, gte, or, sql } from 'drizzle-orm';

export interface KaiPageContext {
  activePage?: string;
  activeEntityType?: 'lead' | 'student' | 'class' | 'program' | null;
  activeEntityId?: number | null;
  activeEntityName?: string | null;
  userRole?: string;
  userName?: string;
}

export interface KaiContext {
  school: {
    name: string;
    displayName?: string;
    tagline?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    timezone?: string;
    about?: string;
  } | null;
  stats: {
    activeStudents: number;
    inactiveStudents: number;
    totalLeads: number;
    newLeadsToday: number;
    classesToday: number;
    atRiskCount: number;
    billingIssuesCount: number;
  };
  programs: Array<{
    id: number;
    name: string;
    description?: string | null;
    ageRange?: string | null;
    price?: number | null;
    billing?: string | null;
  }>;
  todayClasses: Array<{
    id: number;
    name: string;
    dayOfWeek?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    instructor?: string | null;
    enrolled: number;
    capacity: number;
  }>;
  staff: Array<{
    id: number;
    name: string;
    role?: string | null;
    email?: string | null;
  }>;
  recentLeads: Array<{
    id: number;
    name: string;
    status?: string | null;
    phone?: string | null;
    email?: string | null;
    interestedProgram?: string | null;
  }>;
  page: KaiPageContext;
}

function getTodayName(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    new Date().getDay()
  ];
}

export async function loadKaiContext(
  orgId: number,
  db: any,
  pageCtx: KaiPageContext = {}
): Promise<KaiContext> {
  const today = getTodayName();
  const todayDate = new Date().toISOString().split('T')[0];

  const {
    schoolProfiles,
    organizations,
    students,
    leads,
    classes,
    programs,
    teamMembers,
  } = await import('../../drizzle/schema');

  const [
    schoolProfileRows,
    orgRows,
    studentCountRows,
    leadCountRows,
    newLeadRows,
    programRows,
    todayClassRows,
    staffRows,
    recentLeadRows,
    atRiskRows,
    billingRows,
  ] = await Promise.allSettled([
    db.select().from(schoolProfiles).where(eq(schoolProfiles.organizationId, orgId)).limit(1),
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
    db.select({ status: students.status, count: sql`count(*)` })
      .from(students).where(eq(students.organizationId, orgId)).groupBy(students.status),
    db.select({ count: sql`count(*)` }).from(leads)
      .where(and(eq(leads.organizationId, orgId), sql`${leads.status} != 'Enrolled'`)),
    db.select({ count: sql`count(*)` }).from(leads)
      .where(and(eq(leads.organizationId, orgId), gte(leads.createdAt, todayDate))),
    db.select().from(programs)
      .where(and(eq(programs.organizationId, orgId), eq(programs.isActive, 1))).limit(20),
    db.select().from(classes)
      .where(and(eq(classes.organizationId, orgId), eq(classes.isActive, 1), eq(classes.dayOfWeek, today)))
      .limit(20),
    db.select({ id: teamMembers.id, name: teamMembers.name, role: teamMembers.role, email: teamMembers.email })
      .from(teamMembers).where(and(eq(teamMembers.organizationId, orgId), eq(teamMembers.isActive, 1))).limit(20),
    db.select({ id: leads.id, firstName: leads.firstName, lastName: leads.lastName, status: leads.status,
      phone: leads.phone, email: leads.email, interestedProgram: leads.interestedProgram })
      .from(leads).where(eq(leads.organizationId, orgId)).orderBy(desc(leads.createdAt)).limit(10),
    db.select({ count: sql`count(*)` }).from(students)
      .where(and(eq(students.organizationId, orgId), eq(students.status, 'Inactive'))),
    db.select({ count: sql`count(*)` }).from(students)
      .where(and(eq(students.organizationId, orgId), eq(students.billingStatus, 'past_due'))),
  ]);

  const schoolProfile = schoolProfileRows.status === 'fulfilled' ? schoolProfileRows.value[0] : null;
  const org = orgRows.status === 'fulfilled' ? orgRows.value[0] : null;

  let activeStudents = 0, inactiveStudents = 0;
  if (studentCountRows.status === 'fulfilled') {
    for (const row of studentCountRows.value as any[]) {
      // DB enum values are 'Active', 'Inactive', 'On Hold' (capital first letter)
      const s = String(row.status || '');
      if (s === 'Active' || s.toLowerCase() === 'active') activeStudents = Number(row.count);
      else if (s === 'Inactive' || s.toLowerCase() === 'inactive') inactiveStudents = Number(row.count);
    }
  }

  const totalLeads = leadCountRows.status === 'fulfilled' ? Number((leadCountRows.value as any)[0]?.count ?? 0) : 0;
  const newLeadsToday = newLeadRows.status === 'fulfilled' ? Number((newLeadRows.value as any)[0]?.count ?? 0) : 0;
  const atRiskCount = atRiskRows.status === 'fulfilled' ? Number((atRiskRows.value as any)[0]?.count ?? 0) : 0;
  const billingIssuesCount = billingRows.status === 'fulfilled' ? Number((billingRows.value as any)[0]?.count ?? 0) : 0;

  const programList = programRows.status === 'fulfilled' ? programRows.value as any[] : [];
  const todayClassList = todayClassRows.status === 'fulfilled' ? todayClassRows.value as any[] : [];
  const staffList = staffRows.status === 'fulfilled' ? staffRows.value as any[] : [];
  const recentLeadList = recentLeadRows.status === 'fulfilled' ? recentLeadRows.value as any[] : [];

  const school = schoolProfile ? {
    name: schoolProfile.schoolName || org?.name || 'My School',
    displayName: schoolProfile.displayName ?? undefined,
    tagline: schoolProfile.tagline ?? undefined,
    phone: schoolProfile.phone ?? undefined,
    email: schoolProfile.email ?? undefined,
    website: schoolProfile.website ?? undefined,
    address: [schoolProfile.addressStreet, schoolProfile.addressCity, schoolProfile.addressState, schoolProfile.addressPostal]
      .filter(Boolean).join(', ') || undefined,
    timezone: schoolProfile.timezone ?? undefined,
    about: (schoolProfile as any).about ?? undefined,
  } : org ? { name: org.name } : null;

  return {
    school,
    stats: { activeStudents, inactiveStudents, totalLeads, newLeadsToday, classesToday: todayClassList.length, atRiskCount, billingIssuesCount },
    programs: programList.map(p => ({
      id: p.id, name: p.name, description: p.description ?? null,
      ageRange: p.ageRange ?? null,
      price: p.price ? p.price / 100 : null,
      billing: p.billing ?? null,
    })),
    todayClasses: todayClassList.map(c => ({
      id: c.id, name: c.name, dayOfWeek: c.dayOfWeek ?? null,
      startTime: c.startTime ?? null, endTime: c.endTime ?? null,
      instructor: c.instructor ?? null,
      enrolled: c.enrolled ?? 0, capacity: c.capacity ?? 20,
    })),
    staff: staffList.map(s => ({ id: s.id, name: s.name || 'Unknown', role: s.role ?? null, email: s.email ?? null })),
    recentLeads: recentLeadList.map(l => ({
      id: l.id, name: [l.firstName, l.lastName].filter(Boolean).join(' '),
      status: l.status ?? null, phone: l.phone ?? null, email: l.email ?? null,
      interestedProgram: l.interestedProgram ?? null,
    })),
    page: pageCtx,
  };
}

export function buildContextBlock(ctx: KaiContext): string {
  const lines: string[] = [];
  lines.push('## LIVE SYSTEM CONTEXT (loaded at request time — use this, never ask the user)');
  lines.push('');

  if (ctx.school) {
    lines.push('### School Profile');
    lines.push(`- Name: ${ctx.school.name}${ctx.school.displayName && ctx.school.displayName !== ctx.school.name ? ` (aka ${ctx.school.displayName})` : ''}`);
    if (ctx.school.tagline) lines.push(`- Tagline: "${ctx.school.tagline}"`);
    if (ctx.school.phone) lines.push(`- Phone: ${ctx.school.phone}`);
    if (ctx.school.email) lines.push(`- Email: ${ctx.school.email}`);
    if (ctx.school.website) lines.push(`- Website: ${ctx.school.website}`);
    if (ctx.school.address) lines.push(`- Address: ${ctx.school.address}`);
    if (ctx.school.timezone) lines.push(`- Timezone: ${ctx.school.timezone}`);
    if (ctx.school.about) lines.push(`- About: ${ctx.school.about.substring(0, 300)}`);
    lines.push('');
  }

  lines.push('### Live Stats');
  lines.push(`- Active students: ${ctx.stats.activeStudents}`);
  lines.push(`- Inactive students: ${ctx.stats.inactiveStudents}`);
  lines.push(`- Open leads: ${ctx.stats.totalLeads} (${ctx.stats.newLeadsToday} new today)`);
  lines.push(`- Classes today: ${ctx.stats.classesToday}`);
  if (ctx.stats.atRiskCount > 0) lines.push(`- At-risk (inactive): ${ctx.stats.atRiskCount}`);
  if (ctx.stats.billingIssuesCount > 0) lines.push(`- Billing issues (past due): ${ctx.stats.billingIssuesCount}`);
  lines.push('');

  if (ctx.programs.length > 0) {
    lines.push('### Programs & Pricing');
    for (const p of ctx.programs) {
      const price = p.price != null ? `$${p.price}${p.billing ? '/' + p.billing : ''}` : 'price not set';
      const age = p.ageRange ? ` | Ages: ${p.ageRange}` : '';
      lines.push(`- ${p.name} — ${price}${age}`);
    }
    lines.push('');
  }

  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  if (ctx.todayClasses.length > 0) {
    lines.push(`### Today's Schedule (${todayName})`);
    for (const c of ctx.todayClasses) {
      const time = c.startTime ? `${c.startTime}${c.endTime ? '\u2013' + c.endTime : ''}` : 'time TBD';
      const instr = c.instructor ? ` | ${c.instructor}` : '';
      lines.push(`- ${c.name} @ ${time}${instr} (${c.enrolled}/${c.capacity} enrolled)`);
    }
  } else {
    lines.push(`### Today's Schedule (${todayName})`);
    lines.push(`- No classes are scheduled for ${todayName}. Use the list_classes tool to show the full weekly schedule if the user asks about other days or the overall schedule.`);
    lines.push('');
    lines.push('');
  }

  if (ctx.staff.length > 0) {
    lines.push('### Staff');
    for (const s of ctx.staff) {
      lines.push(`- ${s.name}${s.role ? ` (${s.role})` : ''}`);
    }
    lines.push('');
  }

  if (ctx.recentLeads.length > 0) {
    lines.push('### Recent Leads (last 10)');
    for (const l of ctx.recentLeads) {
      const prog = l.interestedProgram ? ` | ${l.interestedProgram}` : '';
      lines.push(`- ${l.name} [${l.status || 'New'}]${prog} | ID: ${l.id}`);
    }
    lines.push('');
  }

  if (ctx.page.activePage || ctx.page.activeEntityType) {
    lines.push('### Current Session');
    if (ctx.page.userName) lines.push(`- User: ${ctx.page.userName} (${ctx.page.userRole || 'owner'})`);
    if (ctx.page.activePage) lines.push(`- Active page: ${ctx.page.activePage}`);
    if (ctx.page.activeEntityType && ctx.page.activeEntityId) {
      lines.push(`- Viewing: ${ctx.page.activeEntityType} #${ctx.page.activeEntityId}${ctx.page.activeEntityName ? ` (${ctx.page.activeEntityName})` : ''}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('CRITICAL: Answer questions using the data above. Never fabricate pricing, schedules, or contact details. Never ask for info already listed above.');
  lines.push('');
  return lines.join('\n');
}
