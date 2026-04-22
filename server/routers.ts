import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { setupWizardRouter } from "./setupWizardRouter";
import { billingRouter } from "./billingRouter";
import { tuitionBillingRouter } from "./tuitionBillingRouter";
import { webhookRouter } from "./webhookRouter";
import { campaignsRouter } from "./campaignsRouter";
import { automationRouter } from "./automationRouter";
import { conversationsRouter } from "./conversationsRouter";
import { authRouter } from "./authRouter";
import { smsReminderRouter } from "./smsReminderRouter";
import { kioskDirectRouter } from "./kioskDirectRouter";
import { kioskRouter } from "./kioskRouter";
import { membershipPlansRouter } from "./membershipPlansRouter";
import { classEntitlementsRouter } from "./classEntitlementsRouter";
import { oneTimeFeesRouter } from "./oneTimeFeesRouter";
import { discountsRouter } from "./discountsRouter";
import { addOnsRouter } from "./addOnsRouter";
import { merchandiseRouter } from "./merchandiseRouter";
import { kaiDataRouter } from "./kaiDataRouter";
import { navBadgesRouter } from "./navBadgesRouter";

import { ownerAuthRouter } from "./ownerAuthRouter";
import { onboardingRouter } from "./onboardingRouter";
import { staffAuthRouter } from "./staffAuthRouter";
import { studentAuthRouter } from "./studentAuthRouter";
import { googleAuthRouter } from "./googleAuthRouter";
import { kaiOnboardingRouter } from "./kaiOnboardingRouter";
import { kaiProfileOnboardingRouter } from "./kaiProfileOnboardingRouter";
import { kaiOnboardingStateMachineRouter } from "./kaiOnboardingStateMachine";
import { setupModeRouter } from "./setupModeRouter";
import { subscriptionRouter } from "./subscriptionRouter";
import { welcomeMessageRouter } from "./welcomeMessageRouter";
import { creditRouter } from "./creditRouter";
import { userRouter } from "./userRouter";
import { platformRouter } from "./platformRouter";
import { platformAdminAuthRouter } from "./platformAdminAuth";
import { masterDashboardRouter } from "./masterDashboardRouter";
import { ownerProfileRouter } from "./ownerProfileRouter";
import { kaiCommandRouter } from "./kaiCommandRouter";
import { kaiStudentsRouter } from "./kaiStudentsRouter";
import { kioskDesignerRouter } from './kioskDesignerRouter';
import { kioskSettingsRouter } from './kioskSettingsRouter';
import { kioskStudioRouter } from './kioskStudioRouter';
import { kioskDeviceRouter } from './kioskDeviceRouter';
import { kioskManagerRouter } from './kioskManagerRouter';
import { paymentProviderRouter } from './paymentProviderRouter';
import { schoolProfileRouter } from './schoolProfileRouter';
import { pcBankCardRouter } from './pcBankCardRouter';
import { messagingRouter } from './routers/messaging';
import { emailTemplatesRouter } from './emailTemplatesRouter';
import { organizationsRouter } from './routers/organizations';
import { classesRouter } from './classesRouter';
import { publicLeadRouter } from './publicLeadRouter';
import { myDojoSyncRouter } from './myDojoSyncRouter';
import { waiverRouter } from './waiverRouter';
import { tutorialRouter } from './tutorialRouter';
import { kaiCreativeRouter } from './kaiCreativeRouter';
import { kaiReviewRouter } from './kaiReviewRouter';
import { brandDnaRouter } from './brandDnaRouter';
import { fluidPayRouter } from './fluidPayRouter';
import { publicProcedure, protectedProcedure, orgScopedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { getActiveStaffPins, updateStaffPinLastUsed, createStaffPin, getAllStaffPins, updateStaffPin, toggleStaffPinActive, deleteStaffPin, getDb } from "./db";
import { organizationUsers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Helper functions for CRM queries
async function executeCRMFunction(name: string, args: any, ctx?: any) {
  const { getDashboardStats, searchStudents, getKioskCheckIns, getKioskVisitors, getKioskWaivers, getStudentCardForKai } = await import("./db");
  
  switch (name) {
    case 'get_dashboard_stats':
      console.log('[executeCRMFunction] get_dashboard_stats called', {
        locationId: args.locationId,
        includeInactive: args.includeInactive,
        userId: ctx?.userId,
        orgId: ctx?.currentOrganizationId,
      });
      
      // Call the dashboard.getStats endpoint directly
      const { getDb: getDbForStats } = await import("./db");
      const { students: studentsForStats, leads: leadsForStats, studentAttendance: attendanceForStats } = await import("../drizzle/schema");
      const { eq: eqForStats, and: andForStats, count: countForStats, gte: gteForStats } = await import("drizzle-orm");
      
      const dbForStats = await getDbForStats();
      if (!dbForStats) return { error: 'Database not available' };
      
      const orgId = ctx?.currentOrganizationId;
      if (!orgId) {
        return {
          activeStudents: 0,
          totalStudents: 0,
          activeLeads: 0,
          totalLeads: 0,
          attendanceToday: 0,
          atRiskStudents: 0,
        };
      }
      
      // Build base conditions
      const studentBaseCondition = args.locationId
        ? andForStats(eqForStats(studentsForStats.organizationId, orgId))
        : eqForStats(studentsForStats.organizationId, orgId);
      
      const leadBaseCondition = args.locationId
        ? andForStats(eqForStats(leadsForStats.organizationId, orgId), eqForStats(leadsForStats.locationId, args.locationId))
        : eqForStats(leadsForStats.organizationId, orgId);
      
      // Count active students
      const activeStudentsResult = await dbForStats.select({ count: countForStats() })
        .from(studentsForStats)
        .where(andForStats(
          studentBaseCondition,
          eqForStats(studentsForStats.status, 'Active')
        ));
      
      // Count total students
      const totalStudentsResult = await dbForStats.select({ count: countForStats() })
        .from(studentsForStats)
        .where(studentBaseCondition);
      
      // Count active leads
      const activeLeadsResult = await dbForStats.select({ count: countForStats() })
        .from(leadsForStats)
        .where(leadBaseCondition);
      
      // Count total leads
      const totalLeadsResult = await dbForStats.select({ count: countForStats() })
        .from(leadsForStats)
        .where(leadBaseCondition);
      
      // Today's attendance
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayAttendanceResult = await dbForStats.select({ count: countForStats() })
        .from(attendanceForStats)
        .where(andForStats(
          gteForStats(attendanceForStats.checkedInAt, todayStart.toISOString()),
          eqForStats(attendanceForStats.status, 'attended')
        ));
      
      // At-risk students (inactive status)
      const atRiskStudentsResult = await dbForStats.select({ count: countForStats() })
        .from(studentsForStats)
        .where(andForStats(
          studentBaseCondition,
          eqForStats(studentsForStats.status, 'Inactive')
        ));
      
      const result = {
        activeStudents: activeStudentsResult[0]?.count || 0,
        totalStudents: totalStudentsResult[0]?.count || 0,
        activeLeads: activeLeadsResult[0]?.count || 0,
        totalLeads: totalLeadsResult[0]?.count || 0,
        attendanceToday: todayAttendanceResult[0]?.count || 0,
        atRiskStudents: atRiskStudentsResult[0]?.count || 0,
      };
      
      console.log('[executeCRMFunction] get_dashboard_stats result', result);
      return result;
    
    case 'get_student_count':
      const stats = await getDashboardStats();
      return { count: stats?.total_students || 0, status: args.status || 'all' };
    
    case 'find_student':
      console.log('[executeCRMFunction] find_student called', { query: args.query, orgId: ctx?.currentOrganizationId });
      
      if (!ctx?.currentOrganizationId) {
        console.error('[executeCRMFunction] find_student - no organizationId in context');
        return { error: 'Organization context missing' };
      }
      
      const students = await searchStudents(args.query, ctx.currentOrganizationId);
      console.log('[executeCRMFunction] find_student - searchStudents returned', students?.length || 0, 'results');
      
      if (students && students.length > 0) {
        const student = students[0];
        
        if (!student || !student.id) {
          console.error('[executeCRMFunction] find_student - student object invalid', student);
          return { error: 'Invalid student data' };
        }
        
        console.log('[executeCRMFunction] find_student found student', { id: student.id, name: `${student.firstName} ${student.lastName}` });
        
        // Get rich card data
        try {
          const cardData = await getStudentCardForKai(student.id, ctx.currentOrganizationId, null);
          console.log('[executeCRMFunction] find_student - getStudentCardForKai returned', cardData ? 'data' : 'null');
          
          if (cardData) {
            console.log('[executeCRMFunction] find_student returning student_card', { studentId: student.id, fullName: cardData.fullName });
            return {
              type: 'student_card',
              student: cardData
            };
          } else {
            console.error('[executeCRMFunction] find_student - cardData is null');
            return { error: 'Could not load student card data' };
          }
        } catch (err) {
          console.error('[executeCRMFunction] find_student - error getting card data', err);
          return { error: 'Error loading student data' };
        }
      }
      
      console.log('[executeCRMFunction] find_student - no student found');
      return { error: 'Student not found' };
    
    case 'get_revenue': {
      // Pull live data from FluidPay if connected
      try {
        const { getDb: getDbRevenue } = await import('./db');
        const { dojoSettings: dojoSettingsRev, organizationUsers: orgUsersRev } = await import('../drizzle/schema');
        const { eq: eqRev } = await import('drizzle-orm');
        const { getMonthlyRevenue: getMonthlyRevenueFP, getRecentTransactions: getRecentTxns } = await import('./services/fluidpay');
        const dbRev = await getDbRevenue();
        // Resolve org ID: use session org, fall back to user's first org membership
        let resolvedOrgId = ctx.currentOrganizationId;
        if (!resolvedOrgId && ctx.user && dbRev) {
          const memberships = await dbRev.select({ organizationId: orgUsersRev.organizationId })
            .from(orgUsersRev)
            .where(eqRev(orgUsersRev.userId, ctx.user.id))
            .limit(1);
          if (memberships.length > 0) resolvedOrgId = memberships[0].organizationId;
        }
        if (dbRev) {
          // Try resolved org first, then scan ALL settings rows for any FluidPay key
          let fpKey: string | undefined;
          if (resolvedOrgId) {
            const settingsRev = await dbRev.select().from(dojoSettingsRev).where(eqRev(dojoSettingsRev.organizationId, resolvedOrgId)).limit(1);
            fpKey = (settingsRev[0] as any)?.fluidpayApiKey;
          }
          // Scan ALL rows if still no key found — bypasses org/user resolution issues
          if (!fpKey) {
            console.log('[get_revenue] Scanning ALL dojo_settings for FluidPay key');
            const allSettings = await dbRev.select().from(dojoSettingsRev).limit(50);
            for (const row of allSettings) {
              const key = (row as any)?.fluidpayApiKey;
              if (key && key.length > 10) {
                console.log('[get_revenue] Found FluidPay key in org', (row as any).organizationId);
                fpKey = key;
                break;
              }
            }
          }
          if (fpKey) {
            const now = new Date();
            const rev = await getMonthlyRevenueFP(fpKey, now.getUTCFullYear(), now.getUTCMonth() + 1);
            const recentTxns = await getRecentTxns(fpKey, 5);
            return {
              source: 'fluidpay',
              period: args.period || 'month',
              month: rev.month,
              year: rev.year,
              totalCollected: rev.totalDollars,
              settled: rev.settledDollars,
              pending: rev.pendingDollars,
              refunds: rev.refundDollars,
              transactionCount: rev.transactionCount,
              recentTransactions: recentTxns.slice(0, 5).map(t => ({
                date: t.created_at?.slice(0, 10),
                amount: (t.amount / 100).toFixed(2),
                type: t.type,
                status: t.status,
                name: (() => {
                  if (t.billing) {
                    const n = `${t.billing.first_name || ''} ${t.billing.last_name || ''}`.trim();
                    if (n) return n;
                  }
                  if (t.description && t.description.trim()) return t.description.trim();
                  if (t.order_id && t.order_id.trim()) return `Order ${t.order_id.trim()}`;
                  if (t.customer_id && t.customer_id.trim()) return `Customer ${t.customer_id.trim()}`;
                  if (t.processor_id && t.processor_id.trim()) return `Tx ${t.processor_id.trim()}`;
                  return `Txn ${(t.id || '').slice(-6)}`;
                })(),
              }))
            };
          }
        }
      } catch (fpErr: any) {
        console.error('[get_revenue] FluidPay error:', fpErr.message);
      }
      // Fallback to internal tuition records
      const revenueStats = await getDashboardStats(ctx?.currentOrganizationId);
      const revenueAmount = revenueStats?.monthly_revenue || 0;
      return { 
        source: 'internal', 
        revenue: revenueAmount, 
        period: args.period || 'month',
        message: revenueAmount === 0 
          ? 'No paid tuition records found for this month. If you use FluidPay, connect it to see payment data.'
          : `$${revenueAmount.toFixed ? revenueAmount.toFixed(2) : revenueAmount} collected this month from tuition records.`
      };
    }
    
    case 'get_leads':
      const leadStats = await getDashboardStats();
      return { count: leadStats?.total_leads || 0, status: args.status || 'all' };
    
    case 'search_students':
      console.log('[executeCRMFunction] search_students called with query:', args.query);
      const searchedStudents = await searchStudents(args.query, ctx.currentOrganizationId);
      console.log('[executeCRMFunction] search_students found:', searchedStudents.length, 'students');
      
      // If single student found, return full card data
      if (searchedStudents.length === 1) {
        const student = searchedStudents[0];
        try {
          const cardData = await getStudentCardForKai(student.id, ctx.currentOrganizationId, null);
          if (cardData) {
            console.log('[executeCRMFunction] search_students returning full card for:', cardData.fullName);
            return {
              type: 'student_card',
              student: cardData
            };
          }
        } catch (err) {
          console.error('[executeCRMFunction] search_students - error getting card data', err);
        }
      }
      
      // Multiple students or error - return list format
      return {
        students: searchedStudents.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          beltRank: s.beltRank,
          program: s.program,
          status: s.status
        }))
      };
    
    case 'get_student':
      const { getDb: getDbForStudent } = await import("./db");
      const { students: studentsTable } = await import("../drizzle/schema");
      const { eq: eqStudent } = await import("drizzle-orm");
      
      const dbStudent = await getDbForStudent();
      if (!dbStudent) return { error: 'Database not available' };
      
      const studentResult = await dbStudent.select().from(studentsTable)
        .where(eqStudent(studentsTable.id, args.studentId))
        .limit(1);
      
      if (studentResult.length > 0) {
        const s = studentResult[0];
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          phone: s.phone,
          beltRank: s.beltRank,
          program: s.program,
          status: s.status,
          membershipStatus: s.membershipStatus,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone
        };
      }
      return { error: 'Student not found' };
    
    case 'list_at_risk_students':
      const { getDb: getDbForAtRisk } = await import("./db");
      const { students: studentsAtRisk } = await import("../drizzle/schema");
      const { or: orAtRisk, eq: eqAtRisk } = await import("drizzle-orm");
      
      const dbAtRisk = await getDbForAtRisk();
      if (!dbAtRisk) return { error: 'Database not available' };
      
      const atRiskStudents = await dbAtRisk.select().from(studentsAtRisk)
        .where(
          orAtRisk(
            eqAtRisk(studentsAtRisk.status, 'inactive'),
            eqAtRisk(studentsAtRisk.status, 'on_hold')
          )
        )
        .limit(50);
      
      return {
        students: atRiskStudents.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          status: s.status,
          beltRank: s.beltRank,
          program: s.program
        }))
      };
    
    case 'list_late_payments':
      // For now, return empty list - payment tracking to be implemented
      return { students: [] };
    
    case 'search_leads':
      const { getDb: getDbForLeads } = await import("./db");
      const { leads: leadsTable } = await import("../drizzle/schema");
      const { like: likeLeads, or: orLeads } = await import("drizzle-orm");
      
      const dbLeads = await getDbForLeads();
      if (!dbLeads) return { error: 'Database not available' };
      
      const searchedLeads = await dbLeads.select().from(leadsTable)
        .where(
          orLeads(
            likeLeads(leadsTable.firstName, `%${args.query}%`),
            likeLeads(leadsTable.lastName, `%${args.query}%`),
            likeLeads(leadsTable.email, `%${args.query}%`),
            likeLeads(leadsTable.phone, `%${args.query}%`)
          )
        )
        .limit(20);
      
      return {
        leads: searchedLeads.map(l => ({
          id: l.id,
          name: `${l.firstName} ${l.lastName}`,
          email: l.email,
          phone: l.phone,
          status: l.status,
          source: l.source
        }))
      };
    
    case 'get_lead':
      const { getDb: getDbForLead } = await import("./db");
      const { leads: leadsTableSingle } = await import("../drizzle/schema");
      const { eq: eqLead } = await import("drizzle-orm");
      
      const dbLead = await getDbForLead();
      if (!dbLead) return { error: 'Database not available' };
      
      const leadResult = await dbLead.select().from(leadsTableSingle)
        .where(eqLead(leadsTableSingle.id, args.leadId))
        .limit(1);
      
      if (leadResult.length > 0) {
        const l = leadResult[0];
        return {
          id: l.id,
          name: `${l.firstName} ${l.lastName}`,
          email: l.email,
          phone: l.phone,
          status: l.status,
          source: l.source,
          message: l.message,
          notes: l.notes
        };
      }
      return { error: 'Lead not found' };
    
    case 'find_lead':
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      const { like, or } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) return { error: 'Database not available' };
      
      // Search leads by name
      const searchResults = await db.select().from(leads)
        .where(
          or(
            like(leads.firstName, `%${args.query}%`),
            like(leads.lastName, `%${args.query}%`)
          )
        )
        .limit(1);
      
      if (searchResults.length > 0) {
        const lead = searchResults[0];
        return {
          type: 'lead_lookup',
          lead: {
            first_name: lead.firstName,
            last_name: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            status: lead.status,
            source: lead.source,
            notes: lead.notes,
          }
        };
      }
      return { error: 'Lead not found' };
    
    case 'get_checkins':
      const checkIns = await getKioskCheckIns();
      return { count: checkIns?.length || 0, period: args.period || 'today' };
    
    case 'get_classes': {
      const orgIdForClasses = ctx?.currentOrganizationId;
      if (!orgIdForClasses) return { classes: [], totalToday: 0, date: 'today' };

      const { classes: classesTable } = await import('../drizzle/schema');
      const { eq: eqCls, and: andCls, count: countCls } = await import('drizzle-orm');
      const dbForClasses = await getDb();
      if (!dbForClasses) return { classes: [], totalToday: 0, date: 'today' };

      // Get today's day-of-week name (e.g. "Monday")
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const todayName = dayNames[new Date().getDay()];
      const targetDay = (args.date && args.date !== 'today') ? args.date : todayName;

      const todayClasses = await dbForClasses
        .select({
          id: classesTable.id,
          name: classesTable.name,
          time: classesTable.time,
          startTime: classesTable.startTime,
          endTime: classesTable.endTime,
          instructor: classesTable.instructor,
          enrolled: classesTable.enrolled,
          capacity: classesTable.capacity,
          program: classesTable.program,
          level: classesTable.level,
        })
        .from(classesTable)
        .where(andCls(
          eqCls(classesTable.organizationId, orgIdForClasses),
          eqCls(classesTable.dayOfWeek, targetDay),
          eqCls(classesTable.isActive, 1)
        ))
        .orderBy(classesTable.time);

      return {
        classes: todayClasses,
        totalToday: todayClasses.length,
        date: targetDay,
      };
    }
    
    case 'get_inactive_students':
      // TODO: Implement actual inactive student query
      return { count: 0, days: args.days, message: 'Feature coming soon' };

    // ── Action cases (write/modify data) ───────────────────────────────────────────
    case 'remove_student': {
      const { checkKaiPermission, getUserRole } = await import('./staffPermissions');
      const userRole = await getUserRole(ctx);
      const perm = checkKaiPermission(userRole, 'remove_student');
      if (!perm.allowed) return { error: perm.reason, permissionDenied: true };
      const { getDb: getDbA } = await import('./db');
      const { students: studentsA } = await import('../drizzle/schema');
      const { eq: eqA, and: andA } = await import('drizzle-orm');
      const dbA = await getDbA();
      if (!dbA) return { error: 'Database not available' };
      const orgIdA = ctx?.currentOrganizationId || ctx?.user?.organizationId;
      const [existingA] = await dbA.select({ id: studentsA.id, firstName: studentsA.firstName, lastName: studentsA.lastName })
        .from(studentsA).where(andA(eqA(studentsA.id, args.studentId), eqA(studentsA.organizationId, orgIdA))).limit(1);
      if (!existingA) return { error: `Student "${args.studentName}" not found.` };
      await dbA.update(studentsA).set({ status: 'Inactive', updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }).where(eqA(studentsA.id, args.studentId));
      return { success: true, action: 'student_archived', message: `✅ **${existingA.firstName} ${existingA.lastName}** has been archived.${args.reason ? ` Reason: ${args.reason}` : ''}` };
    }

    case 'add_lead': {
      const { checkKaiPermission, getUserRole } = await import('./staffPermissions');
      const userRole = await getUserRole(ctx);
      const perm = checkKaiPermission(userRole, 'add_lead');
      if (!perm.allowed) return { error: perm.reason, permissionDenied: true };
      const { getDb: getDbB } = await import('./db');
      const { leads: leadsB } = await import('../drizzle/schema');
      const dbB = await getDbB();
      if (!dbB) return { error: 'Database not available' };
      const orgIdB = ctx?.currentOrganizationId || ctx?.user?.organizationId;
      const nowB = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await dbB.insert(leadsB).values({ firstName: args.firstName, lastName: args.lastName || '', email: args.email?.toLowerCase() || null, phone: args.phone?.replace(/[^0-9+]/g, '') || null, status: 'New Lead', source: args.source || 'Kai', interestedProgram: args.interestedProgram || null, notes: args.notes || null, organizationId: orgIdB, createdAt: nowB, updatedAt: nowB });
      const fullNameB = `${args.firstName} ${args.lastName || ''}`.trim();
      return { success: true, action: 'lead_added', message: `✅ New lead **${fullNameB}** added.${args.email ? ` Email: ${args.email}` : ''}${args.phone ? ` Phone: ${args.phone}` : ''}` };
    }

    case 'update_lead_status': {
      const { checkKaiPermission, getUserRole } = await import('./staffPermissions');
      const userRole = await getUserRole(ctx);
      const perm = checkKaiPermission(userRole, 'update_lead_status');
      if (!perm.allowed) return { error: perm.reason, permissionDenied: true };
      const { getDb: getDbC } = await import('./db');
      const { leads: leadsC } = await import('../drizzle/schema');
      const { eq: eqC, and: andC } = await import('drizzle-orm');
      const dbC = await getDbC();
      if (!dbC) return { error: 'Database not available' };
      const orgIdC = ctx?.currentOrganizationId || ctx?.user?.organizationId;
      const [existingC] = await dbC.select({ id: leadsC.id, firstName: leadsC.firstName, lastName: leadsC.lastName, status: leadsC.status })
        .from(leadsC).where(andC(eqC(leadsC.id, args.leadId), eqC(leadsC.organizationId, orgIdC))).limit(1);
      if (!existingC) return { error: `Lead "${args.leadName}" not found.` };
      await dbC.update(leadsC).set({ status: args.status, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }).where(eqC(leadsC.id, args.leadId));
      return { success: true, action: 'lead_status_updated', message: `✅ **${existingC.firstName} ${existingC.lastName || ''}** stage: **${existingC.status}** → **${args.status}**.` };
    }

    case 'mark_attendance': {
      const { checkKaiPermission, getUserRole } = await import('./staffPermissions');
      const userRole = await getUserRole(ctx);
      const perm = checkKaiPermission(userRole, 'mark_attendance');
      if (!perm.allowed) return { error: perm.reason, permissionDenied: true };
      const { getDb: getDbD } = await import('./db');
      const { studentAttendance, students: studentsD } = await import('../drizzle/schema');
      const { eq: eqD, and: andD } = await import('drizzle-orm');
      const dbD = await getDbD();
      if (!dbD) return { error: 'Database not available' };
      const orgIdD = ctx?.currentOrganizationId || ctx?.user?.organizationId;
      const [existingD] = await dbD.select({ id: studentsD.id, firstName: studentsD.firstName, lastName: studentsD.lastName })
        .from(studentsD).where(andD(eqD(studentsD.id, args.studentId), eqD(studentsD.organizationId, orgIdD))).limit(1);
      if (!existingD) return { error: `Student "${args.studentName}" not found.` };
      const attendanceDateD = args.date || new Date().toISOString().slice(0, 10);
      const nowD = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await dbD.insert(studentAttendance).values({ studentId: args.studentId, classId: args.classId || null, date: attendanceDateD, status: args.status, organizationId: orgIdD, createdAt: nowD, updatedAt: nowD } as any);
      const emojiD = args.status === 'present' ? '✅' : args.status === 'late' ? '⏰' : '❌';
      return { success: true, action: 'attendance_marked', message: `${emojiD} **${existingD.firstName} ${existingD.lastName || ''}** marked **${args.status}** for ${attendanceDateD}.` };
    }
    
    case 'invite_staff': {
      const { checkKaiPermission, getUserRole } = await import('./staffPermissions');
      const userRole = await getUserRole(ctx);
      const perm = checkKaiPermission(userRole, 'invite_staff');
      if (!perm.allowed) return { error: perm.reason, permissionDenied: true };
      const { executeInviteStaff } = await import('./kai-tools');
      const inviteResult = await executeInviteStaff(args, ctx);
      // executeInviteStaff returns a JSON string; parse it so formatFunctionResults can handle it
      try { return typeof inviteResult === 'string' ? JSON.parse(inviteResult) : inviteResult; } catch { return inviteResult; }
    }

    case 'list_staff': {
      const { checkKaiPermission, getUserRole } = await import('./staffPermissions');
      const userRole = await getUserRole(ctx);
      const perm = checkKaiPermission(userRole, 'list_staff');
      if (!perm.allowed) return { error: perm.reason, permissionDenied: true };
      const { executeListStaff } = await import('./kai-tools');
      return await executeListStaff(args, ctx);
    }

    case 'send_sms': {
      // Send SMS to a specific student by ID or phone number
      const { sendSMS, formatPhoneNumber } = await import('./services/twilio.js');
      const orgId = ctx?.currentOrganizationId;
      if (!orgId) return { error: 'No organization context' };

      let phone = args.phone as string | undefined;
      let recipientName = args.recipientName as string;

      // If studentId provided, look up their phone
      if (args.studentId) {
        const { db } = await import('./db');
        const { students } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        const [student] = await db
          .select({ phone: students.phone, firstName: students.firstName, lastName: students.lastName })
          .from(students)
          .where(and(eq(students.id, args.studentId), eq(students.organizationId, orgId)))
          .limit(1);
        if (!student) return { error: `Student ID ${args.studentId} not found` };
        phone = student.phone || undefined;
        recipientName = recipientName || `${student.firstName} ${student.lastName}`;
      }

      if (!phone) {
        // Log the no-phone case
        try {
          const { getDb } = await import('./db');
          const rawDb = getDb();
          await rawDb.execute(
            `INSERT INTO sms_log (organization_id, student_id, recipient_name, recipient_phone, message, status, sent_by) VALUES (?, ?, ?, ?, ?, 'no_phone', 'kai')`,
            [orgId, args.studentId || null, recipientName, 'N/A', args.message]
          );
        } catch {}
        return { error: `No phone number on file for ${recipientName}. Cannot send SMS.` };
      }
      const formatted = formatPhoneNumber(phone);
      let twilioSid: string | null = null;
      let status: 'sent' | 'failed' = 'sent';
      let errorMsg: string | null = null;
      try {
        // Call Twilio and capture the SID
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const form = new URLSearchParams();
        form.append('To', formatted);
        form.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        form.append('Body', args.message);
        const resp = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        });
        const twilioData = await resp.json() as any;
        if (!resp.ok) throw new Error(twilioData.message || 'Twilio error');
        twilioSid = twilioData.sid || null;
      } catch (err: any) {
        status = 'failed';
        errorMsg = err.message;
      }
      // Write to sms_log
      try {
        const { getDb } = await import('./db');
        const rawDb = getDb();
        await rawDb.execute(
          `INSERT INTO sms_log (organization_id, student_id, recipient_name, recipient_phone, message, twilio_sid, status, error_message, sent_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'kai')`,
          [orgId, args.studentId || null, recipientName, formatted, args.message, twilioSid, status, errorMsg]
        );
      } catch (logErr: any) {
        console.warn('[SMS Log] Failed to write log entry:', logErr.message);
      }
      if (status === 'failed') {
        return { error: `Failed to send SMS to ${recipientName}: ${errorMsg}` };
      }
      return {
        success: true,
        recipient: recipientName,
        phone: formatted,
        message: args.message,
        twilioSid,
        sentAt: new Date().toISOString(),
        summary: `SMS sent to ${recipientName} (${formatted})`,
      };
    }

    case 'send_bulk_sms': {
      const { sendSMS, formatPhoneNumber } = await import('./services/twilio.js');
      const { db } = await import('./db');
      const { students, studentBillingEnrollments } = await import('../drizzle/schema');
      const { eq, and, inArray } = await import('drizzle-orm');
      const orgId = ctx?.currentOrganizationId;
      if (!orgId) return { error: 'No organization context' };

      const filter = args.filter as string;
      const message = args.message as string;
      const preview = args.preview as boolean | undefined;

      // Fetch students based on filter
      let targetStudents: { id: number; firstName: string; lastName: string; phone: string | null }[] = [];

      if (filter === 'billing_issues') {
        // Students with past_due billing enrollments
        const billingRows = await db
          .select({ studentId: studentBillingEnrollments.studentId })
          .from(studentBillingEnrollments)
          .where(and(
            eq(studentBillingEnrollments.organizationId, orgId),
            eq(studentBillingEnrollments.status, 'past_due')
          ));
        const ids = [...new Set(billingRows.map((r: any) => r.studentId).filter(Boolean))];
        if (ids.length > 0) {
          targetStudents = await db
            .select({ id: students.id, firstName: students.firstName, lastName: students.lastName, phone: students.phone })
            .from(students)
            .where(and(eq(students.organizationId, orgId), inArray(students.id, ids)));
        }
      } else if (filter === 'inactive') {
        targetStudents = await db
          .select({ id: students.id, firstName: students.firstName, lastName: students.lastName, phone: students.phone })
          .from(students)
          .where(and(eq(students.organizationId, orgId), eq(students.status, 'Inactive')));
      } else if (filter === 'at_risk') {
        targetStudents = await db
          .select({ id: students.id, firstName: students.firstName, lastName: students.lastName, phone: students.phone })
          .from(students)
          .where(and(eq(students.organizationId, orgId), eq(students.status, 'At Risk')));
      } else if (filter === 'all_active') {
        targetStudents = await db
          .select({ id: students.id, firstName: students.firstName, lastName: students.lastName, phone: students.phone })
          .from(students)
          .where(and(eq(students.organizationId, orgId), eq(students.status, 'Active')));
      } else {
        // 'all' — everyone
        targetStudents = await db
          .select({ id: students.id, firstName: students.firstName, lastName: students.lastName, phone: students.phone })
          .from(students)
          .where(eq(students.organizationId, orgId));
      }

      const withPhone = targetStudents.filter((s: any) => s.phone);
      const noPhone = targetStudents.filter((s: any) => !s.phone);

      if (preview) {
        return {
          preview: true,
          filter,
          totalMatched: targetStudents.length,
          willReceive: withPhone.length,
          noPhone: noPhone.length,
          recipients: withPhone.slice(0, 10).map((s: any) => `${s.firstName} ${s.lastName}`),
          message,
          summary: `Preview: ${withPhone.length} of ${targetStudents.length} students would receive this SMS (${noPhone.length} have no phone on file).`,
        };
      }

      if (withPhone.length === 0) {
        return { error: `No students in the "${filter}" group have a phone number on file.` };
      }

      // Send SMS to all
      let sent = 0;
      let failed = 0;
      for (const student of withPhone) {
        try {
          const formatted = formatPhoneNumber(student.phone!);
          await sendSMS(formatted, message);
          sent++;
        } catch {
          failed++;
        }
      }

      return {
        success: true,
        filter,
        sent,
        failed,
        skipped: noPhone.length,
        summary: `Bulk SMS sent: ${sent} delivered, ${failed} failed, ${noPhone.length} skipped (no phone).`,
      };
    }

     default:
      return { error: 'Unknown function' };
  }
}
function formatFunctionResults(results: any[]): { text: string; ui_blocks: any[] } {
  if (results.length === 0) return { text: 'No results found.', ui_blocks: [] };
  
  const result = results[0];
  
  if (result.error) {
    return { text: `No results found — ${result.error}`, ui_blocks: [] };
  }
  
  // Handle search_students results
  if (result.students && Array.isArray(result.students)) {
    if (result.students.length === 0) {
      return { text: "No students matched that search. If your roster is empty, drop a PDF, Excel, or CSV file into this chat bar and I'll import your students automatically.", ui_blocks: [] };
    }
    if (result.students.length === 1) {
      const s = result.students[0];
      return {
        text: `I found ${s.name}. They're a ${s.beltRank} in the ${s.program} program.`,
        ui_blocks: [{
          type: 'student_card',
          studentId: s.id,
          label: s.name
        }]
      };
    }
    const ids = result.students.map((s: any) => s.id);
    const count = result.students.length;
    return {
      text: `I found ${count} students. Click to view their details.`,
      ui_blocks: [{
        type: 'student_list',
        studentIds: ids,
        label: `${count} students`
      }]
    };
  }
  
  // Handle get_student result
  if (result.id && result.name && result.beltRank) {
    return {
      text: `Here's ${result.name}. They're a ${result.beltRank} in the ${result.program} program.`,
      ui_blocks: [{
        type: 'student_card',
        studentId: result.id,
        label: result.name
      }]
    };
  }
  
  // Handle search_leads results
  if (result.leads && Array.isArray(result.leads)) {
    if (result.leads.length === 0) {
      return { text: "No leads matched that search — try a different name, email, or phone number.", ui_blocks: [] };
    }
    if (result.leads.length === 1) {
      const l = result.leads[0];
      return {
        text: `I found ${l.name}. Status: ${l.status}.`,
        ui_blocks: [{
          type: 'lead_card',
          leadId: l.id,
          label: l.name
        }]
      };
    }
    const ids = result.leads.map((l: any) => l.id);
    const count = result.leads.length;
    return {
      text: `I found ${count} leads. Click to view their details.`,
      ui_blocks: [{
        type: 'lead_list',
        leadIds: ids,
        label: `${count} leads`
      }]
    };
  }
  
  // Handle student_card result (new rich card format)
  if (result.type === 'student_card' && result.student) {
    const s = result.student;
    return {
      text: `Here's ${s.fullName}'s profile:`,
      ui_blocks: [{
        type: 'student_card',
        student: s,
        label: s.fullName
      }]
    };
  }
  
  // Handle student_lookup result (legacy format)
  if (result.type === 'student_lookup') {
    const s = result.student;
    return {
      text: `Found ${s.first_name} ${s.last_name}: ${s.belt_rank} belt, ${s.status}, ${s.membership_status} membership.`,
      ui_blocks: []
    };
  }
  
  // Handle get_dashboard_stats results
  if (result.activeStudents !== undefined || result.totalStudents !== undefined) {
    const active = result.activeStudents || 0;
    const total = result.totalStudents || 0;
    const leads = result.activeLeads || 0;
    const attendance = result.attendanceToday || 0;
    const atRisk = result.atRiskStudents || 0;

    // Empty roster — warm, actionable import offer
    if (active === 0 && total === 0) {
      return {
        text: `Your roster is empty — let's fix that. Setup is easy: just drop your current student list, class schedule, or program documents right into this chat bar. I can read **PDFs**, **Excel files**, **CSVs**, and even **photos of handwritten lists**. I'll extract the data and place it exactly where it belongs — students, classes, programs — all in one go.\n\nReady to import your roster?`,
        ui_blocks: []
      };
    }
    
    let text = `You have **${active} active student${active === 1 ? '' : 's'}** on your roster.`;
    
    if (total > active) {
      text += ` (${total - active} inactive)`;
    }
    
    if (leads > 0) {
      text += ` You also have **${leads} lead${leads === 1 ? '' : 's'}** in the pipeline.`;
    }
    
    if (attendance > 0) {
      text += ` **${attendance}** checked in today.`;
    }
    
    if (atRisk > 0) {
      text += ` ⚠️ **${atRisk} student${atRisk === 1 ? '' : 's'}** need attention — consider running a re-engagement check.`;
    }
    
    return { text, ui_blocks: [] };
  }
  
    if (result.count !== undefined) {
    return { text: `Found ${result.count} results.`, ui_blocks: [] };
  }
  
  if (result.revenue !== undefined) {
    // Use the message field if available (includes helpful context)
    if (result.message) {
      return { text: result.message, ui_blocks: [] };
    }
    const revenueAmt = Number(result.revenue || 0).toFixed(2);
    if (Number(revenueAmt) === 0) {
      return { text: `No paid tuition records found for this month. If you use FluidPay for payment processing, connect it via Settings so Kai can pull live payment data.`, ui_blocks: [] };
    }
    return { text: `💰 **Revenue this month:** $${revenueAmt} (from internal tuition records)`, ui_blocks: [] };
  }

  // Handle FluidPay live revenue data
  if (result.source === 'fluidpay' && result.totalCollected !== undefined) {
    const total = Number(result.totalCollected).toFixed(2);
    const settled = Number(result.settled).toFixed(2);
    const pending = Number(result.pending).toFixed(2);
    const refunds = Number(result.refunds || 0).toFixed(2);
    const count = result.transactionCount || 0;
    let text = `💳 **${result.month} ${result.year} Revenue (FluidPay)**\n\n`;
    text += `**Total Collected:** $${total}\n`;
    text += `**Settled:** $${settled}\n`;
    if (Number(pending) > 0) text += `**Pending Settlement:** $${pending}\n`;
    if (Number(refunds) > 0) text += `**Refunds:** -$${refunds}\n`;
    text += `**Transactions:** ${count}\n`;
    if (result.recentTransactions && result.recentTransactions.length > 0) {
      text += `\n**Recent Transactions:**\n`;
      result.recentTransactions.forEach((t: any) => {
        const name = t.name && t.name !== 'Unknown' ? t.name : null;
        text += `• ${t.date} — $${t.amount} (${t.type}, ${t.status})${name ? ' — ' + name : ''}\n`;
      });
    }
    return { text, ui_blocks: [] };
  }

  // Handle get_classes results
  if (result.classes !== undefined && result.totalToday !== undefined) {
    const total = result.totalToday as number;
    const date = result.date || 'today';

    // Empty schedule — warm, actionable import offer
    if (total === 0) {
      return {
        text: `No classes are scheduled for ${date}. Let's set that up — just drop your class schedule into this chat bar and I'll import it automatically. I can read **Excel files**, **CSVs**, **PDFs**, and even **photos of a handwritten timetable**. I'll create each class with the correct day, time, and instructor.\n\nReady to import your schedule?`,
        ui_blocks: []
      };
    }

    // Classes exist — format a readable schedule
    const classList = (result.classes as any[]).map((c: any) => {
      const time = c.startTime || c.time || '';
      const instructor = c.instructor ? ` · ${c.instructor}` : '';
      const spots = (c.capacity && c.enrolled !== undefined)
        ? ` (${c.capacity - c.enrolled} spots left)`
        : '';
      return `• **${c.name}** at ${time}${instructor}${spots}`;
    }).join('\n');

    return {
      text: `Here are today's **${total} class${total === 1 ? '' : 'es'}** for ${date}:\n\n${classList}`,
      ui_blocks: []
    };
  }

  // Handle action results (remove_student, add_lead, update_lead_status, mark_attendance)
  if (result.success && result.message) {
    return { text: result.message, ui_blocks: [] };
  }

  // Handle permission denied errors
  if (result.permissionDenied) {
    return { text: `⛔ ${result.error}`, ui_blocks: [] };
  }

  return { text: JSON.stringify(result), ui_blocks: [] };
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  organizations: organizationsRouter,
  kaiCommand: kaiCommandRouter,
  kaiStudents: kaiStudentsRouter,
  kioskDesigner: kioskDesignerRouter,
  kioskSettings: kioskSettingsRouter,
  kioskStudio: kioskStudioRouter,
  kioskManager: kioskManagerRouter,
  kioskDevice: kioskDeviceRouter,
  
  // Platform Admin CRM (internal only)
  platform: platformRouter,
  platformAuth: platformAdminAuthRouter,
  masterDashboard: masterDashboardRouter,
  
  // Multi-tenant authentication (public)
  classes: classesRouter,
  ownerAuth: ownerAuthRouter,
  staffAuth: staffAuthRouter,
  studentAuth: studentAuthRouter,
  googleAuth: googleAuthRouter,
  welcomeMessage: welcomeMessageRouter,
  emailTemplates: emailTemplatesRouter,
  onboarding: onboardingRouter,
  kaiOnboarding: kaiOnboardingRouter,
  kaiProfileOnboarding: kaiProfileOnboardingRouter,
  kaiOnboardingSM: kaiOnboardingStateMachineRouter,
  tutorial: tutorialRouter,
  kaiCreative: kaiCreativeRouter,
  kaiReview: kaiReviewRouter,
  brandDna: brandDnaRouter,
  setupMode: setupModeRouter,
  subscription: subscriptionRouter,
  credits: creditRouter,
  ownerProfile: ownerProfileRouter,
  user: userRouter,
  paymentProvider: paymentProviderRouter,
  fluidPay: fluidPayRouter,
  schoolProfile: schoolProfileRouter,
  pcBankCard: pcBankCardRouter,
  dojoFlowMessaging: messagingRouter,
  publicLead: publicLeadRouter,
  myDojoSync: myDojoSyncRouter,
  waiver: waiverRouter,
  
  // File upload for attachments
  upload: router({
    // Upload a file attachment (image or document)
    uploadAttachment: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 data URL
        fileType: z.string(), // MIME type
        fileSize: z.number(), // Size in bytes
        context: z.enum(['kai-command', 'message', 'general']).default('general'),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (input.fileSize > maxSize) {
          throw new Error('File size exceeds 10MB limit');
        }
        
        // Validate file type
        const allowedTypes = [
          // Images
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          // Documents
          'application/pdf', 
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          // Spreadsheets
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'text/csv', // csv
          'application/octet-stream', // fallback for xlsx when browser doesn't detect type
        ];
        
        // Also check by file extension for xlsx files that may have wrong MIME type
        const isSpreadsheetByExtension = 
          input.fileName.toLowerCase().endsWith('.xlsx') ||
          input.fileName.toLowerCase().endsWith('.xls') ||
          input.fileName.toLowerCase().endsWith('.csv');
        
        if (!allowedTypes.includes(input.fileType) && !isSpreadsheetByExtension) {
          throw new Error(`File type not supported: ${input.fileType}. Allowed: images (jpg, png, gif, webp), documents (pdf, doc, docx, txt), and spreadsheets (xlsx, xls, csv)`);
        }
        
        // Extract base64 data from data URL
        const base64Match = input.fileData.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) {
          throw new Error('Invalid file data format');
        }
        
        const buffer = Buffer.from(base64Match[1], 'base64');
        
        // Generate unique key with timestamp and random suffix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const userId = ctx.user?.id || 'anonymous';
        const key = `attachments/${input.context}/${userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.fileType);
        
        return {
          success: true,
          url: result.url,
          key: result.key,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
        };
      }),
    
    // Get allowed file types
    getAllowedTypes: publicProcedure
      .query(() => {
        return {
          images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
          spreadsheets: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
          maxSize: 10 * 1024 * 1024, // 10MB
          maxSizeLabel: '10MB',
        };
      }),
  }),
  setupWizard: setupWizardRouter,
  kioskDirect: kioskDirectRouter,
  kiosk: kioskRouter,
  billing: billingRouter,
  tuitionBilling: tuitionBillingRouter,
  membershipPlans: membershipPlansRouter,
  classEntitlements: classEntitlementsRouter,
  oneTimeFees: oneTimeFeesRouter,
  discounts: discountsRouter,
  addOns: addOnsRouter,
  merchandise: merchandiseRouter,
  kaiData: kaiDataRouter,
  navBadges: navBadgesRouter,

  webhook: webhookRouter,
  campaigns: campaignsRouter,
  automation: automationRouter,
  conversations: conversationsRouter,
  smsReminders: smsReminderRouter,
  auth: router({
    // User profile endpoint
    getCurrentUser: authRouter.getCurrentUser,
    
    // Organization selection for multi-org users
    selectOrganization: authRouter.selectOrganization,
    
    // Update user profile
    updateProfile: authRouter.updateProfile,
    
    // Profile picture management
    uploadProfilePicture: authRouter.uploadProfilePicture,
    deleteProfilePicture: authRouter.deleteProfilePicture,
    
    // Kiosk settings endpoint (uses raw mysql2 to bypass Drizzle connection issues)
    getKioskSettings: publicProcedure.query(async () => {
      try {
        const mysql = await import('mysql2/promise');
        const connection = await mysql.default.createConnection(process.env.DATABASE_URL!);
        
        const [rows] = await connection.execute<mysql.RowDataPacket[]>(
          'SELECT businessName, logoSquare FROM dojo_settings LIMIT 1'
        );
        
        await connection.end();
        
        if (rows.length === 0) {
          return {
            businessName: 'DojoFlow',
            logoSquare: null,
          };
        }
        
        return {
          businessName: rows[0].businessName || 'DojoFlow',
          logoSquare: rows[0].logoSquare || null,
        };
      } catch (error) {
        console.error('[Kiosk Settings] Database error:', error);
        return {
          businessName: 'DojoFlow',
          logoSquare: null,
        };
      }
    }),
    
    // Legacy endpoints
    me: protectedProcedure.query(async (opts) => {
      // Fetch full user data including photoUrl
      const { getUserByOpenId } = await import("./db");
      const fullUser = await getUserByOpenId(opts.ctx.user.openId);
      
      if (!fullUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      // Get user's primary organization
      const db = await getDb();
      let activeOrgId: number | null = null;
      
      if (db) {
        const [primaryOrg] = await db
          .select({
            organizationId: organizationUsers.organizationId,
          })
          .from(organizationUsers)
          .where(
            and(
              eq(organizationUsers.userId, fullUser.id),
              eq(organizationUsers.isPrimary, 1)
            )
          )
          .limit(1);
        
        if (primaryOrg) {
          activeOrgId = primaryOrg.organizationId;
        } else {
          // If no primary org, get the first organization
          const [firstOrg] = await db
            .select({
              organizationId: organizationUsers.organizationId,
            })
            .from(organizationUsers)
            .where(eq(organizationUsers.userId, fullUser.id))
            .limit(1);
          
          if (firstOrg) {
            activeOrgId = firstOrg.organizationId;
          }
        }
      }
      
      // Return the full user object with activeOrgId
      return {
        ...fullUser,
        activeOrgId,
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Staff PIN validation for kiosk access
  staff: router({
    validatePin: publicProcedure
      .input(z.object({
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
      }))
      .mutation(async ({ input }) => {
        const { pin } = input;
        
        // Get all active staff PINs from database
        const staffPins = await getActiveStaffPins();
        
        if (staffPins.length === 0) {
          // No PINs in database - allow default PIN 1234 for initial setup
          if (pin === "1234") {
            return {
              valid: true,
              staffName: "Default Admin",
              message: "Using default PIN. Please create staff PINs in settings."
            };
          }
          return {
            valid: false,
            message: "Invalid PIN"
          };
        }
        
        // Check PIN against all active staff PINs
        for (const staffPin of staffPins) {
          const isMatch = await bcrypt.compare(pin, staffPin.pinHash);
          if (isMatch) {
            // Update last used timestamp
            await updateStaffPinLastUsed(staffPin.id);
            
            return {
              valid: true,
              staffName: staffPin.name,
              role: staffPin.role,
              message: "Access granted"
            };
          }
        }
        
        return {
          valid: false,
          message: "Invalid PIN"
        };
      }),
    
    createPin: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { name, pin, role } = input;
        
        // Hash the PIN before storing
        const pinHash = await bcrypt.hash(pin, 10);
        
        await createStaffPin({
          name,
          pinHash,
          role: role || "staff",
          isActive: 1,
        });
        
        return {
          success: true,
          message: `PIN created for ${name}`
        };
      }),
    
    listPins: publicProcedure
      .query(async () => {
        const pins = await getAllStaffPins();
        // Remove pinHash from response for security
        return pins.map(({ pinHash, ...pin }) => pin);
      }),
    
    updatePin: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required"),
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits").optional(),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, name, pin, role } = input;
        
        const updates: any = { name, role };
        
        // Only update PIN if provided
        if (pin) {
          updates.pinHash = await bcrypt.hash(pin, 10);
        }
        
        await updateStaffPin(id, updates);
        
        return {
          success: true,
          message: `PIN updated for ${name}`
        };
      }),
    
    toggleActive: publicProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        const { id, isActive } = input;
        
        await toggleStaffPinActive(id, isActive);
        
        return {
          success: true,
          message: isActive ? "PIN activated" : "PIN deactivated"
        };
      }),
    
    deletePin: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { id } = input;
        
        await deleteStaffPin(id);
        
        return {
          success: true,
          message: "PIN deleted successfully"
        };
      }),
    
    // Get all staff members for mention dropdown
    getAll: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq, like, or, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { staff: [] };
        
        let query = db.select().from(teamMembers).where(eq(teamMembers.isActive, 1));
        
        if (input.search && input.search.length > 0) {
          const searchPattern = `%${input.search}%`;
          query = db.select().from(teamMembers).where(
            sql`${teamMembers.isActive} = 1 AND (${teamMembers.name} LIKE ${searchPattern} OR ${teamMembers.addressAs} LIKE ${searchPattern} OR ${teamMembers.role} LIKE ${searchPattern})`
          );
        }
        
        const staff = await query.limit(input.limit);
        
        return {
          staff: staff.map(s => ({
            id: s.id,
            name: s.addressAs || s.name,
            fullName: s.name,
            role: s.role.charAt(0).toUpperCase() + s.role.slice(1).replace('_', ' '),
            email: s.email,
            photoUrl: s.photoUrl || null,
          }))
        };
      }),
    
    // Update staff member photo
    updatePhoto: publicProcedure
      .input(z.object({
        id: z.number(),
        photoUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(teamMembers)
          .set({ photoUrl: input.photoUrl })
          .where(eq(teamMembers.id, input.id));
        
        return { success: true };
      }),
    
    // Get single staff member by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return null;
        
        const [staff] = await db.select().from(teamMembers).where(eq(teamMembers.id, input.id));
        if (!staff) return null;
        
        return {
          id: staff.id,
          name: staff.name,
          addressAs: staff.addressAs,
          role: staff.role,
          email: staff.email,
          phone: staff.phone,
          photoUrl: staff.photoUrl,
          focusAreas: staff.focusAreas,
          isActive: staff.isActive,
        };
      }),

    // Get active instructors for class assignment dropdown
    getInstructors: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { teamMembers } = await import("../drizzle/schema");
        const { eq, and, or, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { instructors: [] };
        
        // Get active team members who are instructors, coaches, trainers, or assistants
        const instructorRoles = ['instructor', 'coach', 'trainer', 'assistant', 'owner', 'manager'];
        const instructors = await db.select({
          id: teamMembers.id,
          name: teamMembers.name,
          addressAs: teamMembers.addressAs,
          role: teamMembers.role,
          photoUrl: teamMembers.photoUrl,
          email: teamMembers.email,
        }).from(teamMembers).where(
          sql`${teamMembers.isActive} = 1 AND ${teamMembers.role} IN ('instructor', 'coach', 'trainer', 'assistant', 'owner', 'manager')`
        );
        
        return {
          instructors: instructors.map(i => ({
            id: i.id,
            name: i.addressAs || i.name,
            fullName: i.name,
            role: i.role.charAt(0).toUpperCase() + i.role.slice(1).replace('_', ' '),
            photoUrl: i.photoUrl || null,
            email: i.email,
          }))
        };
      }),
  }),

  // Messaging router for @mentions and directed messages
  messaging: router({
    // Get classes for mention dropdown (bulk messaging)
    getClassesForMention: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(5),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classes, classEnrollments } = await import("../drizzle/schema");
        const { eq, like, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { classes: [] };
        
        // Get classes with student counts
        let query;
        if (input.search && input.search.length > 0) {
          const searchPattern = `%${input.search}%`;
          query = db.select({
            id: classes.id,
            name: classes.name,
            schedule: classes.schedule,
            studentCount: sql<number>`(SELECT COUNT(*) FROM class_enrollments WHERE class_enrollments.classId = ${classes.id})`,
          }).from(classes).where(like(classes.name, searchPattern));
        } else {
          query = db.select({
            id: classes.id,
            name: classes.name,
            schedule: classes.schedule,
            studentCount: sql<number>`(SELECT COUNT(*) FROM class_enrollments WHERE class_enrollments.classId = ${classes.id})`,
          }).from(classes);
        }
        
        const result = await query.limit(input.limit);
        
        return {
          classes: result.map(c => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule || '',
            studentCount: Number(c.studentCount) || 0,
          }))
        };
      }),
    
    // Send a directed message from @mention
    sendDirectedMessage: protectedProcedure
      .input(z.object({
        recipientType: z.enum(['student', 'staff', 'group']),
        recipientId: z.number(),
        content: z.string().min(1),
        subject: z.string().optional(),
        sourceConversationId: z.number().optional(),
        sourceMessageId: z.number().optional(),
        kaiMentioned: z.boolean().default(false),
        attachments: z.array(z.object({
          url: z.string(),
          name: z.string(),
          type: z.string(),
          size: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { directedMessages, studentMessages, staffMessages } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const senderName = ctx.user?.name || 'Unknown';
        const senderId = ctx.user?.id || 0;
        
        // Create the directed message record
        const [directedMsg] = await db.insert(directedMessages).values({
          recipientType: input.recipientType,
          recipientId: input.recipientId,
          senderId,
          senderName,
          content: input.content,
          subject: input.subject,
          sourceConversationId: input.sourceConversationId,
          sourceMessageId: input.sourceMessageId,
          kaiMentioned: input.kaiMentioned ? 1 : 0,
          attachments: input.attachments ? JSON.stringify(input.attachments) : null,
          label: 'message',
        }).$returningId();
        
        // Also create a record in the appropriate inbox table
        if (input.recipientType === 'student') {
          await db.insert(studentMessages).values({
            studentId: input.recipientId,
            senderType: 'staff',
            senderId,
            senderName,
            subject: input.subject || 'New Message',
            content: input.content,
          });
        } else if (input.recipientType === 'staff') {
          await db.insert(staffMessages).values({
            staffId: input.recipientId,
            senderType: 'staff',
            senderId,
            senderName,
            subject: input.subject || 'New Message',
            content: input.content,
            attachments: input.attachments ? JSON.stringify(input.attachments) : null,
          });
        }
        
        return {
          success: true,
          messageId: directedMsg.id,
          kaiShouldRespond: input.kaiMentioned,
        };
      }),
    
    // Get staff inbox messages
    getStaffInbox: protectedProcedure
      .input(z.object({
        staffId: z.number().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { staffMessages } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { messages: [], total: 0 };
        
        // Use provided staffId or try to get from user context
        const staffId = input.staffId;
        if (!staffId) return { messages: [], total: 0 };
        
        const messages = await db.select()
          .from(staffMessages)
          .where(eq(staffMessages.staffId, staffId))
          .orderBy(desc(staffMessages.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return {
          messages,
          total: messages.length,
        };
      }),
    
    // Mark staff message as read
    markStaffMessageRead: protectedProcedure
      .input(z.object({
        messageId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { staffMessages } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(staffMessages)
          .set({ isRead: 1, readAt:new Date().toISOString() })
          .where(eq(staffMessages.id, input.messageId));
        
        return { success: true };
      }),
  }),

  // CRM Dashboard APIs
  dashboard: router({
    stats: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
      const { getDashboardStats } = await import("./db");
      const stats = await getDashboardStats(ctx.currentOrganizationId);
      return stats || {
        total_students: 0,
        monthly_revenue: 0,
        total_leads: 0,
        todays_classes: []
      };
    }),
    
    // Enhanced stats endpoint for Kai with location support
    getStats: protectedProcedure
      .input(z.object({
        locationId: z.number().optional(),
        includeInactive: z.boolean().optional().default(false),
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { students, leads, studentAttendance } = await import("../drizzle/schema");
        const { eq, and, count, gte } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          return {
            activeStudents: 0,
            totalStudents: 0,
            activeLeads: 0,
            totalLeads: 0,
            attendanceToday: 0,
            atRiskStudents: 0,
          };
        }
        
        // Build base conditions
        const studentBaseCondition = input.locationId
          ? and(eq(students.organizationId, orgId))
          : eq(students.organizationId, orgId);
        
        const leadBaseCondition = input.locationId
          ? and(eq(leads.organizationId, orgId), eq(leads.locationId, input.locationId))
          : eq(leads.organizationId, orgId);
        
        // Count active students
        const activeStudentsResult = await db.select({ count: count() })
          .from(students)
          .where(and(
            studentBaseCondition,
            eq(students.status, 'Active')
          ));
        
        // Count total students
        const totalStudentsResult = await db.select({ count: count() })
          .from(students)
          .where(studentBaseCondition);
        
        // Count active leads (not in 'won' or 'lost' stage)
        const activeLeadsResult = await db.select({ count: count() })
          .from(leads)
          .where(leadBaseCondition);
        
        // Count total leads
        const totalLeadsResult = await db.select({ count: count() })
          .from(leads)
          .where(leadBaseCondition);
        
        // Today's attendance
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayAttendanceResult = await db.select({ count: count() })
          .from(studentAttendance)
          .where(and(
            gte(studentAttendance.checkedInAt, todayStart.toISOString()),
            eq(studentAttendance.status, 'attended')
          ));
        
        // At-risk students (inactive status)
        const atRiskStudentsResult = await db.select({ count: count() })
          .from(students)
          .where(and(
            studentBaseCondition,
            eq(students.status, 'Inactive')
          ));
        
        console.log('[dashboard.getStats] Query executed', {
          userId: ctx.userId,
          orgId,
          locationId: input.locationId,
          activeStudents: activeStudentsResult[0]?.count || 0,
          totalStudents: totalStudentsResult[0]?.count || 0,
          activeLeads: activeLeadsResult[0]?.count || 0,
        });
        
        return {
          activeStudents: activeStudentsResult[0]?.count || 0,
          totalStudents: totalStudentsResult[0]?.count || 0,
          activeLeads: activeLeadsResult[0]?.count || 0,
          totalLeads: totalLeadsResult[0]?.count || 0,
          attendanceToday: todayAttendanceResult[0]?.count || 0,
          atRiskStudents: atRiskStudentsResult[0]?.count || 0,
        };
      }),
    
    getLeads: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get leads filtered by organization for multi-tenancy
      // Users without an organization see empty list (no fake data)
      const orgId = ctx.currentOrganizationId;
      if (!orgId) {
        return []; // No organization = empty list (clean slate for new accounts)
      }
      const allLeads = await db.select().from(leads).where(eq(leads.organizationId, orgId));
      return allLeads;
    }),
  }),

  leadSources: router({
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { leadSources } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      try {
        // Get all lead sources ordered by creation date
        const sources = await db.select().from(leadSources).orderBy(desc(leadSources.createdAt));
        return sources || [];
      } catch (error) {
        console.error('[leadSources.list] Error fetching lead sources:', error);
        return [];
      }
    }),
    
    toggle: publicProcedure
      .input(z.object({
        id: z.number(),
        isActive: z.number().min(0).max(1),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadSources } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(leadSources)
          .set({ isActive: input.isActive })
          .where(eq(leadSources.id, input.id));
        
        return { success: true };
      }),
  }),

  leads: router({
    getByStatus: protectedProcedure
      .input(z.void())
      .query(async ({ ctx, input }) => {
      const { getDb } = await import("./db");
      const { leads } = await import("../drizzle/schema");
      const { eq, ne, and: andLeads } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get leads filtered by organization for multi-tenancy
      // Exclude Enrolled leads — they are students and should not appear in the active pipeline
      const orgId = ctx.currentOrganizationId;
      const allLeads = orgId
        ? await db.select().from(leads).where(andLeads(eq(leads.organizationId, orgId), ne(leads.status, 'Enrolled')))
        : [];
      
      // Group by status (map database enum values to frontend keys)
      const grouped = {
        new_lead: [],
        attempting_contact: [],
        contact_made: [],
        intro_scheduled: [],
        offer_presented: [],
        enrolled: [],
        nurture: [],
        lost_winback: [],
      };
      
      allLeads.forEach(lead => {
        const statusKey = lead.status.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
        if (grouped[statusKey]) {
          grouped[statusKey].push({
            id: lead.id,
            first_name: lead.firstName,
            last_name: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            status: statusKey,
            source: lead.source,
            notes: lead.notes,
            lead_score: lead.leadScore,
            created_at: lead.createdAt,
            updated_at: lead.updatedAt,
          });
        }
      });
      
      return grouped;
    }),
    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { leads, students: studentsTable } = await import("../drizzle/schema");
        const { or, and: andOp, eq: eqOp, sql: sqlExpr } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Use organization ID from context for multi-tenancy
        const orgId = ctx.currentOrganizationId;
        
        // ── Dedup rule: if a student already exists with matching email, phone, or full name → mark as Enrolled
        let isAlreadyStudent = false;
        try {
          const dedupConditions: any[] = [];
          // Case-insensitive email match (check student email AND guardian email)
          if (input.email) {
            dedupConditions.push(sqlExpr`LOWER(${studentsTable.email}) = LOWER(${input.email})`);
            dedupConditions.push(sqlExpr`LOWER(${studentsTable.guardianEmail}) = LOWER(${input.email})`);
          }
          // Normalized phone match: strip non-digits and compare last 10 digits
          if (input.phone) {
            const inputDigits = input.phone.replace(/\D/g, '').slice(-10);
            if (inputDigits.length >= 7) {
              dedupConditions.push(sqlExpr`RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${studentsTable.phone}, '+', ''), '-', ''), ' ', ''), '(', ''), ')', ''), 10) = ${inputDigits}`);
            }
          }
          // Case-insensitive full name match
          if (input.firstName && input.lastName) {
            dedupConditions.push(
              andOp(
                sqlExpr`LOWER(${studentsTable.firstName}) = LOWER(${input.firstName})`,
                sqlExpr`LOWER(${studentsTable.lastName}) = LOWER(${input.lastName})`
              )
            );
          }
          if (dedupConditions.length > 0) {
            const match = await db.select({ id: studentsTable.id })
              .from(studentsTable)
              .where(andOp(eqOp(studentsTable.organizationId, orgId!), or(...dedupConditions)))
              .limit(1);
            isAlreadyStudent = match.length > 0;
          }
        } catch (dedupErr) {
          console.error('[Leads] Dedup check error:', dedupErr);
        }
        
        const result = await db.insert(leads).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          notes: input.notes,
          status: isAlreadyStudent ? 'Enrolled' : 'New Lead',
          stage: isAlreadyStudent ? 'won' : 'new',
          organizationId: orgId,
        });
        
        const newLeadId = result.insertId;
        
        // Trigger automation for new lead (async, don't wait)
        // Only trigger if we have a valid lead ID
        if (newLeadId) {
          const { triggerAutomation } = await import("./services/automationEngine");
          triggerAutomation("new_lead", "lead", Number(newLeadId)).catch((err) => {
            console.error('[Leads] Automation trigger error:', err);
          });
        }
        
        return { success: true, id: newLeadId };
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Map frontend key to database enum value
        const statusMap = {
          'new_lead': 'New Lead',
          'attempting_contact': 'Attempting Contact',
          'contact_made': 'Contact Made',
          'intro_scheduled': 'Intro Scheduled',
          'offer_presented': 'Offer Presented',
          'enrolled': 'Enrolled',
          'nurture': 'Nurture',
          'lost_winback': 'Lost/Winback',
        };
        
        const dbStatus = statusMap[input.status] || input.status;
        
        await db.update(leads)
          .set({ status: dbStatus })
          .where(eq(leads.id, input.id));
        
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(leads).where(eq(leads.id, input.id));
        
        return { success: true };
      }),
    
    // Lead Activities - Timeline
    getActivities: publicProcedure
      .input(z.object({
        leadId: z.number(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadActivities } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const activities = await db.select()
          .from(leadActivities)
          .where(eq(leadActivities.leadId, input.leadId))
          .orderBy(desc(leadActivities.createdAt))
          .limit(input.limit);
        
        return activities;
      }),
    
    addActivity: publicProcedure
      .input(z.object({
        leadId: z.number(),
        type: z.enum(["call", "email", "sms", "note", "status_change", "meeting", "task"]),
        title: z.string().optional(),
        content: z.string().optional(),
        previousStatus: z.string().optional(),
        newStatus: z.string().optional(),
        callDuration: z.number().optional(),
        callOutcome: z.enum(["answered", "voicemail", "no_answer", "busy", "wrong_number"]).optional(),
        isAutomated: z.boolean().optional().default(false),
        createdByName: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { leadActivities } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(leadActivities).values({
          leadId: input.leadId,
          type: input.type,
          title: input.title,
          content: input.content,
          previousStatus: input.previousStatus,
          newStatus: input.newStatus,
          callDuration: input.callDuration,
          callOutcome: input.callOutcome,
          isAutomated: input.isAutomated ? 1 : 0,
          createdByName: input.createdByName || "System",
          metadata: input.metadata,
        });
        
        // Update lead score after adding activity
        const { updateLeadScore } = await import("./leadScoring");
        await updateLeadScore(input.leadId);
        
        return { success: true, id: result.insertId };
      }),
    
    // Lead Scoring
    getScore: publicProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .query(async ({ input }) => {
        const { calculateLeadScore, getScoreColor, getScoreLabel } = await import("./leadScoring");
        
        const score = await calculateLeadScore(input.leadId);
        return {
          score,
          color: getScoreColor(score),
          label: getScoreLabel(score),
        };
      }),
    
    recalculateScore: publicProcedure
      .input(z.object({
        leadId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { updateLeadScore, getScoreColor, getScoreLabel } = await import("./leadScoring");
        
        const score = await updateLeadScore(input.leadId);
        return {
          success: true,
          score,
          color: getScoreColor(score),
          label: getScoreLabel(score),
        };
      }),
    
    recalculateAllScores: publicProcedure
      .mutation(async () => {
        const { recalculateAllLeadScores } = await import("./leadScoring");
        
        const result = await recalculateAllLeadScores();
        return {
          success: true,
          ...result,
        };
      }),
    
    // Get all leads with scores for sorting
    getAllWithScores: protectedProcedure
      .input(z.object({
        sortBy: z.enum(["score", "created", "updated"]).optional().default("created"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { desc, asc, eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Filter by organization for multi-tenancy
        // Users without an organization see empty list (no fake data)
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          return []; // No organization = empty list (clean slate for new accounts)
        }
        
        let orderBy;
        const orderFn = input.sortOrder === "asc" ? asc : desc;
        
        switch (input.sortBy) {
          case "score":
            orderBy = orderFn(leads.leadScore);
            break;
          case "updated":
            orderBy = orderFn(leads.updatedAt);
            break;
          default:
            orderBy = orderFn(leads.createdAt);
        }
        
        const allLeads = await db.select().from(leads).where(eq(leads.organizationId, orgId)).orderBy(orderBy);
        
        return allLeads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          source: lead.source,
          leadScore: lead.leadScore,
          leadScoreUpdatedAt: lead.leadScoreUpdatedAt,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }));
      }),

    // ── Appointment Scheduling ─────────────────────────────────────────────
    getSchedulableClasses: protectedProcedure
      .input(z.object({
        dayOfWeek: z.string().optional(),
        program: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getPool } = await import('./db');
        const pool = getPool();
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return [];
        let query = `SELECT id, name, dayOfWeek, startTime, endTime, instructor, capacity, enrolled, program, level, room, duration_minutes as duration FROM classes WHERE isActive=1 AND organizationId=?`;
        const params: any[] = [orgId];
        if (input?.dayOfWeek) { query += ` AND dayOfWeek=?`; params.push(input.dayOfWeek); }
        if (input?.program) { query += ` AND program=?`; params.push(input.program); }
        query += ` ORDER BY FIELD(dayOfWeek,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), startTime, name`;
        const [rows] = await pool.query(query, params);
        return rows as any[];
      }),

    scheduleAppointment: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        classId: z.number(),
        scheduledDate: z.string(),
        scheduledTime: z.string().optional(),
        bookedByName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getPool } = await import('./db');
        const { getDb } = await import('./db');
        const { leads } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const pool = getPool();
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization');
        const [result] = await pool.query(
          `INSERT INTO lead_appointments (lead_id, class_id, organization_id, scheduled_date, scheduled_time, booked_by_user_id, booked_by_name, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
          [input.leadId, input.classId, orgId, input.scheduledDate, input.scheduledTime || null, (ctx.user as any)?.id || null, input.bookedByName || null, input.notes || null]
        );
        await db.update(leads)
          .set({ status: 'Intro Scheduled', updatedAt: new Date().toISOString() })
          .where(eq(leads.id, input.leadId));
        return { success: true, appointmentId: (result as any).insertId };
      }),

    getAppointments: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getPool } = await import('./db');
        const pool = getPool();
        const [rows] = await pool.query(
          `SELECT la.*, c.name as class_name, c.dayOfWeek, c.startTime, c.endTime, c.instructor, c.program, c.level, c.room
           FROM lead_appointments la
           LEFT JOIN classes c ON la.class_id = c.id
           WHERE la.lead_id = ? AND la.organization_id = ?
           ORDER BY la.scheduled_date DESC, la.created_at DESC`,
          [input.leadId, ctx.currentOrganizationId]
        );
        return rows as any[];
      }),

    updateAppointmentStatus: protectedProcedure
      .input(z.object({
        appointmentId: z.number(),
        status: z.enum(['scheduled','confirmed','showed','no_show','cancelled']),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getPool } = await import('./db');
        const pool = getPool();
        await pool.query(
          `UPDATE lead_appointments SET status = ?, updated_at = NOW() WHERE id = ? AND organization_id = ?`,
          [input.status, input.appointmentId, ctx.currentOrganizationId]
        );
        return { success: true };
      }),

    getStaffMembers: protectedProcedure
      .query(async ({ ctx }) => {
        const { getPool } = await import('./db');
        const pool = getPool();
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return [];
        const [rows] = await pool.query(
          `SELECT id, name, role FROM staff_pins WHERE is_active = 1 AND (organization_id = ? OR organization_id IS NULL) ORDER BY name ASC`,
          [orgId]
        ) as any;
        return (rows as any[]).map((r: any) => ({
          id: r.id,
          name: r.name,
          role: r.role || 'staff',
        }));
      }),

    // ── Batch dedup: scan all leads and mark any that match an existing student as Enrolled
    syncEnrolledFromStudents: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { leads, students: studentsTable } = await import('../drizzle/schema');
        const { eq, or, and: andOp, sql: sqlExpr, ne } = await import('drizzle-orm');

        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('Organization context missing');

        // Fetch all active (non-Enrolled, non-won) leads for this org
        const activeLeads = await db.select({
          id: leads.id,
          firstName: leads.firstName,
          lastName: leads.lastName,
          email: leads.email,
          phone: leads.phone,
        })
          .from(leads)
          .where(andOp(eq(leads.organizationId, orgId), ne(leads.status, 'Enrolled')));

        let convertedCount = 0;
        // Helper: strip all non-digit characters for phone comparison
        const digitsOnly = (s: string) => s.replace(/\D/g, '');
        for (const lead of activeLeads) {
          const conditions: any[] = [];
          // Case-insensitive email match (check student email AND guardian email)
          if (lead.email) {
            conditions.push(sqlExpr`LOWER(${studentsTable.email}) = LOWER(${lead.email})`);
            conditions.push(sqlExpr`LOWER(${studentsTable.guardianEmail}) = LOWER(${lead.email})`);
          }
          // Normalized phone match: compare last 10 digits to handle +1 country code differences
          if (lead.phone) {
            const leadDigits = digitsOnly(lead.phone).slice(-10);
            if (leadDigits.length >= 7) {
              conditions.push(sqlExpr`RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${studentsTable.phone}, '+', ''), '-', ''), ' ', ''), '(', ''), ')', ''), 10) = ${leadDigits}`);
            }
          }
          // Case-insensitive full name match
          if (lead.firstName && lead.lastName) {
            conditions.push(
              andOp(
                sqlExpr`LOWER(${studentsTable.firstName}) = LOWER(${lead.firstName})`,
                sqlExpr`LOWER(${studentsTable.lastName}) = LOWER(${lead.lastName})`
              )
            );
          }
          if (conditions.length === 0) continue;
          const match = await db.select({ id: studentsTable.id })
            .from(studentsTable)
            .where(andOp(eq(studentsTable.organizationId, orgId), or(...conditions)))
            .limit(1);
          if (match.length > 0) {
            await db.update(leads)
              .set({ status: 'Enrolled', stage: 'won' })
              .where(eq(leads.id, lead.id));
            convertedCount++;
          }
        }

        return { success: true, convertedCount };
      }),

    // Returns the count of leads that have been converted to students (status = 'Enrolled')
    getEnrolledCount: protectedProcedure
      .input(z.void())
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { leads } = await import("../drizzle/schema");
        const { eq, and: andCount, count } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const orgId = ctx.currentOrganizationId;
        if (!orgId) return { count: 0 };

        const result = await db
          .select({ total: count() })
          .from(leads)
          .where(andCount(eq(leads.organizationId, orgId), eq(leads.status, 'Enrolled')));

        return { count: result[0]?.total ?? 0 };
      }),
  }),
  
  students: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get students filtered by organization for multi-tenancy
        // Users without an organization see empty list (no fake data)
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          return []; // No organization = empty list (clean slate for new accounts)
        }
        const allStudents = await db.select().from(students).where(eq(students.organizationId, orgId));
        return allStudents;
      }),
    
    // Get single student by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          return null;
        }
        
        const [student] = await db.select().from(students).where(
          and(
            eq(students.id, input.id),
            eq(students.organizationId, orgId)
          )
        );
        return student || null;
      }),
    
    // Get all students with search support (for mention dropdown, etc.)
    getAll: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        limit: z.number().optional().default(10),
      }).optional())
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, and, or, like, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return [];
        
        // SECURITY: Require organization ID for multi-tenancy
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          return []; // No organization = empty list (data isolation)
        }
        
        // Handle undefined input (when called without parameters)
        const search = input?.search;
        const limit = input?.limit ?? 10;
        
        let result;
        if (search && search.length > 0) {
          const searchPattern = `%${search}%`;
          result = await db.select().from(students).where(
            and(
              eq(students.organizationId, orgId),
              or(
                like(students.firstName, searchPattern),
                like(students.lastName, searchPattern),
                like(students.email, searchPattern)
              )
            )
          ).limit(limit);
        } else {
          result = await db.select().from(students)
            .where(eq(students.organizationId, orgId))
            .limit(limit);
        }
        
        return result;
      }),
    
    lookupByPhone: publicProcedure
      .input(z.object({
        phone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, like } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Search for student by phone
        const result = await db.select().from(students).where(like(students.phone, `%${input.phone}%`)).limit(1);
        
        if (result.length > 0) {
          return {
            student: result[0]
          };
        }
        
        return {
          student: null,
          message: 'Student not found'
        };
      }),
      
    lookupByEmail: publicProcedure
      .input(z.object({
        email: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, like } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Search for student by email
        const result = await db.select().from(students).where(like(students.email, `%${input.email}%`)).limit(1);
        
        if (result.length > 0) {
          return {
            student: result[0]
          };
        }
        
        return {
          student: null,
          message: 'Student not found'
        };
      }),
      
    searchStudents: publicProcedure
      .input(z.object({
        query: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { searchStudents } = await import("./db");
        const students = await searchStudents(input.query);
        
        return {
          students
        };
      }),
    
    stats: publicProcedure
      .query(async () => {
        const { getDashboardStats } = await import("./db");
        const stats = await getDashboardStats();
        return {
          total: stats?.total_students || 0,
          active: stats?.total_students || 0,
          overdue: 0,
          newThisMonth: 0
        };
      }),
    
    uploadPhoto: protectedProcedure
      .input(z.object({
        base64Data: z.string(), // base64 encoded image data (without data:image prefix)
        mimeType: z.string(), // e.g., 'image/jpeg', 'image/png'
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import("./storage");
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = input.mimeType.split('/')[1] || 'jpg';
        const fileName = input.fileName || `student-photo-${timestamp}-${randomSuffix}.${extension}`;
        const fileKey = `student-photos/${ctx.user?.openId || 'unknown'}/${fileName}`;
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.base64Data, 'base64');
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { url };
      }),
    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        dateOfBirth: z.string().optional().nullable(), // Accept string date from frontend
        age: z.number().optional().nullable(),
        beltRank: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        membershipStatus: z.string().optional().nullable(),
        program: z.string().optional().nullable(),
        programId: z.number().optional(),
        streetAddress: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
        latitude: z.string().optional().nullable(),
        longitude: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
        guardianName: z.string().optional().nullable(),
        guardianEmail: z.string().email().optional().nullable(),
        guardianPhone: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        tags: z.string().optional().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students, programEnrollments } = await import("../drizzle/schema");
        const { geocodeAddress } = await import("./geocoding");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get organization ID from context for multi-tenancy
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          throw new Error('No organization found. Please complete your account setup.');
        }
        
        // Format date string for database (schema uses mode: 'string' for timestamps)
        let dateOfBirthStr: string | null = null;
        if (input.dateOfBirth) {
          const date = new Date(input.dateOfBirth);
          // Format as MySQL datetime string: YYYY-MM-DD HH:MM:SS
          dateOfBirthStr = date.toISOString().slice(0, 19).replace('T', ' ');
        }
        
        // Use provided coordinates or geocode address if needed
        let latitude: string | null = input.latitude || null;
        let longitude: string | null = input.longitude || null;
        
        // Only geocode if coordinates not provided but address is
        if (!latitude && !longitude && (input.streetAddress || input.city || input.state || input.zipCode)) {
          try {
            const coords = await geocodeAddress({
              streetAddress: input.streetAddress || undefined,
              city: input.city || undefined,
              state: input.state || undefined,
              zipCode: input.zipCode || undefined,
            });
            if (coords) {
              latitude = coords.lat.toString();
              longitude = coords.lng.toString();
            }
          } catch (e) {
            console.log('Geocoding failed, continuing without coordinates');
          }
        }
        
        const newStudent = await db.insert(students).values({
          organizationId: orgId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          dateOfBirth: dateOfBirthStr,
          age: input.age || null,
          beltRank: input.beltRank || 'White Belt',
          status: (input.status as 'Active' | 'Inactive' | 'On Hold') || 'Active',
          membershipStatus: input.membershipStatus || 'Active',
          program: input.program || null,
          streetAddress: input.streetAddress || null,
          city: input.city || null,
          state: input.state || null,
          zipCode: input.zipCode || null,
          latitude: latitude,
          longitude: longitude,
          photoUrl: input.photoUrl || null,
          guardianName: input.guardianName || null,
          guardianEmail: input.guardianEmail || null,
          guardianPhone: input.guardianPhone || null,
        });
        
        // If a program was selected, create a program enrollment
        if (input.programId) {
          try {
            await db.insert(programEnrollments).values({
              studentId: newStudent.insertId,
              programId: input.programId,
              status: 'active',
              enrollmentType: 'instructor_approval',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } catch (enrollmentError) {
            console.error('Failed to create program enrollment:', enrollmentError);
            // Don't fail the student creation if enrollment fails
          }
        }
        
        return { success: true, id: newStudent.insertId };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        dateOfBirth: z.string().optional().nullable(), // Accept string date from frontend
        age: z.number().optional().nullable(),
        beltRank: z.string().optional().nullable(),
        status: z.string().optional(),
        membershipStatus: z.string().optional().nullable(),
        program: z.string().optional().nullable(),
        // Address fields
        streetAddress: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
        // Geocoded coordinates
        latitude: z.string().optional().nullable(),
        longitude: z.string().optional().nullable(),
        // Parent/Guardian fields
        guardianName: z.string().optional().nullable(),
        guardianRelationship: z.string().optional().nullable(),
        guardianPhone: z.string().optional().nullable(),
        guardianEmail: z.string().email().optional().nullable(),
        // Emergency Contact fields
        emergencyContactName: z.string().optional().nullable(),
        emergencyContactRelationship: z.string().optional().nullable(),
        emergencyContactPhone: z.string().optional().nullable(),
        // Photo URL
        photoUrl: z.string().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { geocodeAddress } = await import("./geocoding");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { id, ...updateData } = input;
        
        // Filter out undefined values to avoid overwriting with null
        const cleanedData: Record<string, any> = {};
        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            // Convert dateOfBirth string to Date object
            if (key === 'dateOfBirth' && value) {
              cleanedData[key] = new Date(value as string);
            } else {
              cleanedData[key] = value;
            }
          }
        }
        
        // Check if address fields are being updated and geocode if needed
        const hasAddressUpdate = 
          updateData.streetAddress !== undefined ||
          updateData.city !== undefined ||
          updateData.state !== undefined ||
          updateData.zipCode !== undefined;
        
        if (hasAddressUpdate) {
          // Get current student data to merge with new address
          const [currentStudent] = await db.select().from(students).where(eq(students.id, id));
          
          if (currentStudent) {
            const addressToGeocode = {
              streetAddress: updateData.streetAddress ?? currentStudent.streetAddress ?? undefined,
              city: updateData.city ?? currentStudent.city ?? undefined,
              state: updateData.state ?? currentStudent.state ?? undefined,
              zipCode: updateData.zipCode ?? currentStudent.zipCode ?? undefined,
            };
            
            // Only geocode if we have enough address info
            if (addressToGeocode.city || addressToGeocode.zipCode) {
              console.log('[Student Update] Geocoding address:', addressToGeocode);
              const geocodeResult = await geocodeAddress(addressToGeocode);
              
              if (geocodeResult) {
                cleanedData.latitude = geocodeResult.latitude;
                cleanedData.longitude = geocodeResult.longitude;
                console.log('[Student Update] Geocoded to:', geocodeResult.latitude, geocodeResult.longitude);
              }
            }
          }
        }
        
        await db.update(students).set(cleanedData).where(eq(students.id, id));
        
        return { success: true, geocoded: hasAddressUpdate };
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(students).where(eq(students.id, input.id));
        
        return { success: true };
      }),
    
    // Add a note to a student's profile
    addNote: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        content: z.string(),
        noteType: z.enum(['manual', 'extraction', 'action_item', 'follow_up']).default('manual'),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        sourceConversationId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentNotes, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Verify student exists
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        if (student.length === 0) {
          throw new Error('Student not found');
        }
        
        // Insert the note
        const result = await db.insert(studentNotes).values({
          studentId: input.studentId,
          content: input.content,
          noteType: input.noteType,
          priority: input.priority || 'medium',
          createdById: ctx.user.id,
          createdByName: ctx.user.name || 'Unknown',
          sourceConversationId: input.sourceConversationId || null,
        });
        
        return { 
          success: true, 
          noteId: result.insertId,
          studentName: `${student[0].firstName} ${student[0].lastName}`
        };
      }),
    
    // Get notes for a student
    getNotes: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { studentNotes } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const notes = await db.select()
          .from(studentNotes)
          .where(eq(studentNotes.studentId, input.studentId))
          .orderBy(desc(studentNotes.createdAt));
        
        return notes;
      }),
    
    // Mark a note as completed
    completeNote: protectedProcedure
      .input(z.object({
        noteId: z.number(),
        isCompleted: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { studentNotes } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.update(studentNotes)
          .set({ 
            isCompleted: input.isCompleted ? 1 : 0,
            completedAt: input.isCompleted ? new Date() : null
          })
          .where(eq(studentNotes.id, input.noteId));
        
        return { success: true };
      }),
    
    // Enhanced Students Dashboard Procedures
    
    // Get students with pagination, search, and filters
    getListWithFilters: protectedProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        status: z.string().optional(),
        program: z.string().optional(),
        beltRank: z.string().optional(),
        sortBy: z.enum(['name', 'enrollment', 'lastContact', 'status']).optional().default('name'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
        billingIssues: z.boolean().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, and, or, like, sql, desc, asc, inArray } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        console.log('[getListWithFilters] Query with orgId:', orgId, 'user:', ctx.user?.id);
        
        // Build where conditions - start with empty array
        const conditions: any[] = [];
        
        // If we have an orgId, filter by it. Otherwise, return all students
        if (orgId) {
          conditions.push(eq(students.organizationId, orgId));
        } else {
          console.log('[getListWithFilters] No orgId, returning all students');
        }
        
        if (input.search) {
          const searchPattern = `%${input.search}%`;
          conditions.push(
            or(
              like(students.firstName, searchPattern),
              like(students.lastName, searchPattern),
              like(students.email, searchPattern),
              like(students.phone, searchPattern)
            )
          );
        }
        
        if (input.status) {
          conditions.push(eq(students.status, input.status));
        }
        
        if (input.program) {
          conditions.push(eq(students.program, input.program));
        }
        
        if (input.beltRank) {
          conditions.push(eq(students.beltRank, input.beltRank));
        }

        // Billing issues filter: find students with past_due enrollments
        if (input.billingIssues) {
          const billingStudentIds = await db.execute(
            sql`SELECT DISTINCT student_id FROM student_billing_enrollments WHERE organization_id = ${orgId} AND status = 'past_due'`
          ) as any;
          const ids: number[] = (billingStudentIds?.rows || billingStudentIds || []).map((r: any) => Number(r.student_id || r[0])).filter(Boolean);
          if (ids.length === 0) {
            // No students with billing issues — return empty
            return { students: [], total: 0 };
          }
          conditions.push(inArray(students.id, ids));
        }
        
        // Get total count
        let countQuery = db.select({ count: sql`COUNT(*) as count` })
          .from(students);
        if (conditions.length > 0) {
          // Always use and() to combine conditions, even if there's only one
          countQuery = countQuery.where(and(...conditions));
        }
        const countResult = await countQuery;
        const total = countResult[0]?.count || 0;
        
        // Determine sort column
        let sortColumn = students.firstName;
        if (input.sortBy === 'enrollment') sortColumn = students.createdAt;
        if (input.sortBy === 'status') sortColumn = students.status;
        
        const sortFn = input.sortOrder === 'desc' ? desc : asc;
        
        // Get paginated results
        const offset = (input.page - 1) * input.limit;
        let query = db.select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
          phone: students.phone,
          dateOfBirth: students.dateOfBirth,
          age: students.age,
          beltRank: students.beltRank,
          status: students.status,
          membershipStatus: students.membershipStatus,
          createdAt: students.createdAt,
          updatedAt: students.updatedAt,
          photoUrl: students.photoUrl,
          program: students.program,
          streetAddress: students.streetAddress,
          city: students.city,
          state: students.state,
          zipCode: students.zipCode,
          latitude: students.latitude,
          longitude: students.longitude,
          guardianName: students.guardianName,
          guardianRelationship: students.guardianRelationship,
          guardianPhone: students.guardianPhone,
          guardianEmail: students.guardianEmail,
          organizationId: students.organizationId,
        })
          .from(students);
        if (conditions.length > 0) {
          // Always use and() to combine conditions, even if there's only one
          query = query.where(and(...conditions));
        }
        const result = await query
          .orderBy(sortFn(sortColumn))
          .limit(input.limit)
          .offset(offset);

        // ── Attach billing info per student ───────────────────────────────
        let studentsWithBilling: any[] = result;
        if (result.length > 0) {
          try {
            const studentIds = result.map((s: any) => s.id).join(',');
            const billingRows = await db.execute(
              sql`SELECT sbe.student_id, sbe.status AS billing_status,
                         sbe.next_billing_date, sbe.fluidpay_customer_id,
                         sbe.card_last4, sbe.card_brand,
                         tp.amount_cents, tp.frequency, tp.name AS plan_name
                  FROM student_billing_enrollments sbe
                  LEFT JOIN tuition_plans tp ON sbe.plan_id = tp.id
                  WHERE sbe.student_id IN (${sql.raw(studentIds)})
                    AND sbe.status IN ('active','past_due')
                  ORDER BY sbe.updated_at DESC`
            ) as any;
            const billingArr: any[] = billingRows?.rows || billingRows || [];
            const billingMap = new Map<number, any>();
            for (const row of billingArr) {
              const sid = Number(row.student_id);
              if (!billingMap.has(sid)) billingMap.set(sid, row);
            }
            studentsWithBilling = result.map((s: any) => {
              const b = billingMap.get(s.id);
              if (!b) return { ...s, billing: null };
              return {
                ...s,
                billing: {
                  amountCents: b.amount_cents ? Number(b.amount_cents) : null,
                  frequency: b.frequency || null,
                  planName: b.plan_name || null,
                  nextBillingDate: b.next_billing_date ? new Date(b.next_billing_date).toISOString() : null,
                  billingStatus: b.billing_status || null,
                  cardLast4: b.card_last4 || null,
                  cardBrand: b.card_brand || null,
                  paymentSource: b.fluidpay_customer_id ? 'FluidPay' : 'Stripe',
                },
              };
            });
          } catch (billingErr: any) {
            console.warn('[getListWithFilters] Billing join failed:', billingErr?.message);
          }
        }

        // ── Overlay Stripe billing data for students not in DB billing ────
        try {
          const { getStripeCustomerBillingMap } = await import('./services/stripe');
          const stripeMap = await getStripeCustomerBillingMap();
          if (stripeMap.size > 0) {
            studentsWithBilling = studentsWithBilling.map((s: any) => {
              // Skip if already has billing from DB
              if (s.billing?.amountCents) return s;
              // Try to match by email first, then by name
              const email = s.email?.toLowerCase();
              const name = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
              const stripeBilling = (email && stripeMap.get(email)) || stripeMap.get(`name:${name}`);
              if (!stripeBilling) return s;
              return {
                ...s,
                billing: {
                  amountCents: stripeBilling.amountCents,
                  frequency: stripeBilling.interval,
                  planName: 'Stripe Subscription',
                  nextBillingDate: stripeBilling.nextBillingDate,
                  billingStatus: stripeBilling.subscriptionStatus,
                  cardLast4: null,
                  cardBrand: null,
                  paymentSource: 'Stripe' as const,
                  lastPaymentDate: stripeBilling.lastPaymentDate,
                  lastPaymentAmountCents: stripeBilling.lastPaymentAmountCents,
                },
              };
            });
          }
        } catch (stripeErr: any) {
          console.warn('[getListWithFilters] Stripe overlay failed:', stripeErr?.message);
        }

        return { students: studentsWithBilling, total };
      }),
    
    // Get student analytics and KPI metrics
    getAnalytics: protectedProcedure
      .input(z.void())
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq, and, count, sql } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        console.log('[Analytics] Query with orgId:', orgId);
        
        // If no orgId, return empty analytics
        if (!orgId) {
          console.log('[Analytics] No orgId, returning empty analytics');
          return {
            total: 0,
            active: 0,
            atRisk: 0,
            inactive: 0,
            pending: 0,
            statusBreakdown: [],
          };
        }
        
        try {
          // Get student counts by status
          const statusCounts = await db.select({
            status: students.status,
            count: count().as('count')
          })
          .from(students)
          .where(eq(students.organizationId, orgId))
          .groupBy(students.status);
          
          // Get total students
          const totalResult = await db.select({ count: count().as('count') })
            .from(students)
            .where(eq(students.organizationId, orgId));
          
          const total = Number(totalResult[0]?.count || 0);
          
          // Get active students
          const activeResult = await db.select({ count: count().as('count') })
            .from(students)
            .where(and(
              eq(students.organizationId, orgId),
              eq(students.status, 'Active')
            ));
          
          const active = Number(activeResult[0]?.count || 0);
          
          // Get at-risk students
          const atRiskResult = await db.select({ count: count().as('count') })
            .from(students)
            .where(and(
              eq(students.organizationId, orgId),
              eq(students.status, 'At Risk')
            ));
          
          const atRisk = Number(atRiskResult[0]?.count || 0);
          
          // Get inactive students
          const inactiveResult = await db.select({ count: count().as('count') })
            .from(students)
            .where(and(
              eq(students.organizationId, orgId),
              eq(students.status, 'Inactive')
            ));
          
          const inactive = Number(inactiveResult[0]?.count || 0);
          
          // Get pending/trial students
          const pendingResult = await db.select({ count: count().as('count') })
            .from(students)
            .where(and(
              eq(students.organizationId, orgId),
              eq(students.status, 'On Hold')
            ));
          
          const pending = Number(pendingResult[0]?.count || 0);
          
          console.log('[Analytics] Results:', { total, active, atRisk, inactive, pending, orgId });
          
          return {
            total,
            active,
            atRisk,
            inactive,
            pending,
            statusBreakdown: statusCounts,
          };
        } catch (error) {
          console.error('[Analytics] Error querying analytics:', error);
          throw error;
        }
      }),
    
    // Count students with active billing issues (past_due enrollments)
    getBillingIssuesCount: protectedProcedure
      .input(z.void())
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return { count: 0 };
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return { count: 0 };
        try {
          const result = await db.execute(
            sql`SELECT COUNT(DISTINCT student_id) as cnt FROM student_billing_enrollments WHERE organization_id = ${orgId} AND status = 'past_due'`
          ) as any;
          const rows = result?.rows || result || [];
          const cnt = Number(rows[0]?.cnt ?? rows[0]?.[0] ?? 0);
          return { count: cnt };
        } catch {
          return { count: 0 };
        }
      }),

    // Get SMS log entries for a specific student
    getSmsLog: protectedProcedure
      .input(z.object({ studentId: z.number(), limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return [];
        try {
          const limit = input.limit || 50;
          const result = await db.execute(
            sql`SELECT id, recipient_name, recipient_phone, message, twilio_sid, status, error_message, sent_by, bulk_filter, sent_at, delivered_at
                FROM sms_log
                WHERE organization_id = ${orgId} AND student_id = ${input.studentId}
                ORDER BY sent_at DESC
                LIMIT ${limit}`
          ) as any;
          const rows = result?.rows || result || [];
          return rows.map((r: any) => ({
            id: r.id ?? r[0],
            recipientName: r.recipient_name ?? r[1],
            recipientPhone: r.recipient_phone ?? r[2],
            message: r.message ?? r[3],
            twilioSid: r.twilio_sid ?? r[4],
            status: r.status ?? r[5],
            errorMessage: r.error_message ?? r[6],
            sentBy: r.sent_by ?? r[7],
            bulkFilter: r.bulk_filter ?? r[8],
            sentAt: r.sent_at ?? r[9],
            deliveredAt: r.delivered_at ?? r[10],
          }));
        } catch (e: any) {
          console.warn('[getSmsLog] Error:', e.message);
          return [];
        }
      }),

    // Get org-wide SMS log (for admin view)
    getOrgSmsLog: protectedProcedure
      .input(z.object({ limit: z.number().optional(), status: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { sql } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) return [];
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return [];
        try {
          const limit = input.limit || 100;
          const statusFilter = input.status ? sql` AND status = ${input.status}` : sql``;
          const result = await db.execute(
            sql`SELECT id, student_id, recipient_name, recipient_phone, message, twilio_sid, status, error_message, sent_by, bulk_filter, sent_at, delivered_at
                FROM sms_log
                WHERE organization_id = ${orgId}${statusFilter}
                ORDER BY sent_at DESC
                LIMIT ${limit}`
          ) as any;
          const rows = result?.rows || result || [];
          return rows.map((r: any) => ({
            id: r.id ?? r[0],
            studentId: r.student_id ?? r[1],
            recipientName: r.recipient_name ?? r[2],
            recipientPhone: r.recipient_phone ?? r[3],
            message: r.message ?? r[4],
            twilioSid: r.twilio_sid ?? r[5],
            status: r.status ?? r[6],
            errorMessage: r.error_message ?? r[7],
            sentBy: r.sent_by ?? r[8],
            bulkFilter: r.bulk_filter ?? r[9],
            sentAt: r.sent_at ?? r[10],
            deliveredAt: r.delivered_at ?? r[11],
          }));
        } catch (e: any) {
          console.warn('[getOrgSmsLog] Error:', e.message);
          return [];
        }
      }),

    // Get students by segment
    getBySegment: protectedProcedure
      .input(z.object({ segmentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentSegmentMembers, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const members = await db.select({ studentId: studentSegmentMembers.studentId })
          .from(studentSegmentMembers)
          .where(eq(studentSegmentMembers.segmentId, input.segmentId));
        
        const studentIds = members.map(m => m.studentId);
        if (studentIds.length === 0) return [];
        
        const result = await db.select()
          .from(students)
          .where(eq(students.organizationId, ctx.currentOrganizationId));
        
        return result.filter(s => studentIds.includes(s.id));
      }),
    
    // Upload photo and save to student record
    // NOTE: Photos are stored as base64 data URLs directly in the database
    // because the S3/CloudFront storage doesn't support public access.
    // This approach works well for profile photos which are typically small (<500KB after compression)
    uploadPhotoToStudent: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        base64Data: z.string(), // base64 encoded image data (without data:image prefix)
        mimeType: z.string(), // e.g., 'image/jpeg', 'image/png', 'image/heic'
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          throw new Error('No organization context found');
        }
        
        // Verify student exists and belongs to user's organization
        const [student] = await db.select().from(students).where(
          eq(students.id, input.studentId)
        );
        if (!student || student.organizationId !== orgId) {
          throw new Error('Student not found or does not belong to your organization');
        }
        
        // Validate MIME type
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
        if (!validMimeTypes.includes(input.mimeType)) {
          throw new Error('Invalid image format. Supported formats: JPG, PNG, HEIC, WebP');
        }
        
        // Validate base64 data size (max 2MB for profile photos)
        const maxSizeBytes = 2 * 1024 * 1024; // 2MB
        const estimatedSize = Math.ceil(input.base64Data.length * 0.75); // base64 is ~33% larger than binary
        if (estimatedSize > maxSizeBytes) {
          throw new Error('Photo is too large. Maximum size is 2MB. Please use a smaller image or reduce quality.');
        }
        
        // Use image/jpeg for HEIC/HEIF since the frontend converts them to JPEG
        const effectiveMimeType = input.mimeType.includes('heic') || input.mimeType.includes('heif') 
          ? 'image/jpeg' 
          : input.mimeType;
        const extension = effectiveMimeType.split('/')[1] || 'jpg';
        
        // Upload to S3 (CDN) instead of storing base64 in DB
        const { storagePut } = await import('./storage');
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `student-photos/${orgId}/${input.studentId}-${timestamp}-${randomSuffix}.${extension}`;
        const buffer = Buffer.from(input.base64Data, 'base64');
        const { url } = await storagePut(fileKey, buffer, effectiveMimeType);
        
        // Update student record with CDN URL
        await db.update(students).set({ photoUrl: url }).where(eq(students.id, input.studentId));
        
        console.log(`[Photo Upload] Student ${input.studentId}: Photo uploaded to S3 (${Math.round(estimatedSize / 1024)}KB) -> ${url}`);
        
        return { success: true, url, photoUrl: url };
      }),
    
    // Remove photo from student (revert to initials)
    removePhoto: protectedProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) {
          throw new Error('No organization context found');
        }
        
        // Verify student exists and belongs to user's organization
        const [student] = await db.select().from(students).where(eq(students.id, input.studentId));
        if (!student || student.organizationId !== orgId) {
          throw new Error('Student not found or does not belong to your organization');
        }
        
        // Remove photo URL
        await db.update(students).set({ photoUrl: null }).where(eq(students.id, input.studentId));
        
        return { success: true };
      }),
    
    // Get student detail with related data
    getDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .output(z.union([
        z.object({
          student: z.any(),
          attendance: z.array(z.any()),
          lastContact: z.any().nullable(),
          tuition: z.array(z.any()),
        }),
        z.null(),
      ]))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students, studentAttendance, studentContacts, studentTuition } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) return null;
        
        console.log('[getDetail] Query started - studentId:', input.id, 'orgId:', orgId);
        
        try {
          // Get student - explicitly select columns to avoid case sensitivity issues
          console.log('[getDetail] Fetching student...');
          const [student] = await db.select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            email: students.email,
            phone: students.phone,
            dateOfBirth: students.dateOfBirth,
            age: students.age,
            beltRank: students.beltRank,
            status: students.status,
            membershipStatus: students.membershipStatus,
            createdAt: students.createdAt,
            updatedAt: students.updatedAt,
            photoUrl: students.photoUrl,
            program: students.program,
            streetAddress: students.streetAddress,
            city: students.city,
            state: students.state,
            zipCode: students.zipCode,
            latitude: students.latitude,
            longitude: students.longitude,
            guardianName: students.guardianName,
            guardianRelationship: students.guardianRelationship,
            guardianPhone: students.guardianPhone,
            guardianEmail: students.guardianEmail,
            organizationId: students.organizationId,
          })
            .from(students)
            .where(and(
              eq(students.id, input.id),
              eq(students.organizationId, orgId)
            ));
          console.log('[getDetail] Student found:', !!student);
          
          if (!student) {
            console.log('[getDetail] Student not found for id:', input.id);
            return null;
          }
          
          // Get attendance - with error handling
          let attendance = [];
          try {
            attendance = await db.select()
              .from(studentAttendance)
              .where(eq(studentAttendance.studentId, input.id))
              .orderBy(desc(studentAttendance.classDate))
              .limit(10);
          } catch (err) {
            console.warn('[getDetail] Failed to fetch attendance:', err);
          }
          
          // Get last contact - with error handling
          let lastContact = null;
          try {
            const contacts = await db.select()
              .from(studentContacts)
              .where(eq(studentContacts.studentId, input.id))
              .orderBy(desc(studentContacts.contactDate))
              .limit(1);
            lastContact = contacts[0] || null;
          } catch (err) {
            console.warn('[getDetail] Failed to fetch contacts:', err);
          }
          
          // Get tuition - with error handling
          let tuition = [];
          try {
            tuition = await db.select()
              .from(studentTuition)
              .where(eq(studentTuition.studentId, input.id))
              .orderBy(desc(studentTuition.dueDate));
          } catch (err) {
            console.warn('[getDetail] Failed to fetch tuition:', err);
          }
          
          const result = {
            student,
            attendance: attendance || [],
            lastContact: lastContact || null,
            tuition: tuition || [],
          };
          console.log('[getDetail] Procedure completed successfully');
          return result;
        } catch (error) {
          console.error('[getDetail] Error fetching student detail:', error);
          throw error;
        }
      }),
    
    // Request student deletion (staff with permission)
    requestDeletion: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        reason: z.string().min(10, 'Reason must be at least 10 characters'),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { students, studentDeletionRequests, auditLogs } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const bcrypt = await import("bcryptjs");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization context');
        
        // Check permission
        if (!ctx.user.permissions?.includes('students.delete.request')) {
          throw new Error('Permission denied: students.delete.request required');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(input.password, ctx.user.passwordHash || '');
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }
        
        // Get student to check if paying member
        const [student] = await db.select().from(students).where(
          and(
            eq(students.id, input.studentId),
            eq(students.organizationId, orgId)
          )
        );
        
        if (!student) throw new Error('Student not found');
        
        // Check if student is paying member
        const isPayingMember = student.membershipStatus === 'Active' || student.membershipStatus === 'Premium';
        
        // Create deletion request
        const result = await db.insert(studentDeletionRequests).values({
          orgId,
          studentId: input.studentId,
          requestedByUserId: ctx.user.id,
          status: 'pending',
          reason: input.reason,
          isPayingMemberAtRequestTime: isPayingMember ? 1 : 0,
        });
        
        // Log audit event
        await db.insert(auditLogs).values({
          orgId,
          actorUserId: ctx.user.id,
          actorName: ctx.user.name || 'Unknown',
          eventType: 'DELETE_REQUESTED',
          studentId: input.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          deletionRequestId: result.insertId,
          description: `Deletion requested: ${input.reason}`,
        });
        
        return {
          success: true,
          requestId: result.insertId,
          message: 'Deletion request submitted. Awaiting owner approval.',
        };
      }),
    
    // List pending deletion requests (owner only)
    listDeletionRequests: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'approved', 'denied', 'executed', 'expired']).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentDeletionRequests, students } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization context');
        
        // Check permission
        if (!ctx.user.permissions?.includes('students.delete.viewRequests')) {
          throw new Error('Permission denied: students.delete.viewRequests required');
        }
        
        const conditions = [eq(studentDeletionRequests.orgId, orgId)];
        if (input?.status) {
          conditions.push(eq(studentDeletionRequests.status, input.status));
        }
        
        const requests = await db.select({
          id: studentDeletionRequests.id,
          studentId: studentDeletionRequests.studentId,
          studentName: students.firstName,
          studentLastName: students.lastName,
          requestedByUserId: studentDeletionRequests.requestedByUserId,
          approvedByUserId: studentDeletionRequests.approvedByUserId,
          status: studentDeletionRequests.status,
          reason: studentDeletionRequests.reason,
          isPayingMemberAtRequestTime: studentDeletionRequests.isPayingMemberAtRequestTime,
          billingDecision: studentDeletionRequests.billingDecision,
          createdAt: studentDeletionRequests.createdAt,
          updatedAt: studentDeletionRequests.updatedAt,
        })
        .from(studentDeletionRequests)
        .leftJoin(students, eq(studentDeletionRequests.studentId, students.id))
        .where(and(...conditions))
        .orderBy(desc(studentDeletionRequests.createdAt));
        
        return requests;
      }),
    
    // Approve deletion request (owner only)
    approveDeletion: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        password: z.string(),
        billingDecision: z.enum(['cancel_subscription', 'keep_active', 'abort']),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentDeletionRequests, students, auditLogs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const bcrypt = await import("bcryptjs");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization context');
        
        // Check permission
        if (!ctx.user.permissions?.includes('students.delete.approve')) {
          throw new Error('Permission denied: students.delete.approve required');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(input.password, ctx.user.passwordHash || '');
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }
        
        // Get deletion request
        const [request] = await db.select().from(studentDeletionRequests)
          .where(eq(studentDeletionRequests.id, input.requestId));
        
        if (!request) throw new Error('Deletion request not found');
        if (request.orgId !== orgId) throw new Error('Unauthorized');
        
        // If paying member and abort decision, deny the request
        if (request.isPayingMemberAtRequestTime && input.billingDecision === 'abort') {
          await db.update(studentDeletionRequests)
            .set({ status: 'denied', updatedAt: new Date() })
            .where(eq(studentDeletionRequests.id, input.requestId));
          
          await db.insert(auditLogs).values({
            orgId,
            actorUserId: ctx.user.id,
            actorName: ctx.user.name || 'Unknown',
            eventType: 'DELETE_DENIED',
            studentId: request.studentId,
            deletionRequestId: input.requestId,
            description: 'Deletion aborted due to billing decision',
          });
          
          return { success: true, message: 'Deletion request denied' };
        }
        
        // Approve the request
        await db.update(studentDeletionRequests)
          .set({
            status: 'approved',
            approvedByUserId: ctx.user.id,
            billingDecision: input.billingDecision,
            updatedAt: new Date(),
          })
          .where(eq(studentDeletionRequests.id, input.requestId));
        
        // Log approval
        await db.insert(auditLogs).values({
          orgId,
          actorUserId: ctx.user.id,
          actorName: ctx.user.name || 'Unknown',
          eventType: 'DELETE_APPROVED',
          studentId: request.studentId,
          deletionRequestId: input.requestId,
          description: `Deletion approved. Billing decision: ${input.billingDecision}`,
        });
        
        // Perform soft delete
        await db.update(students)
          .set({
            deletedAt: new Date(),
            deletedByUserId: ctx.user.id,
            deletionRequestId: input.requestId,
          })
          .where(eq(students.id, request.studentId));
        
        // Log execution
        await db.insert(auditLogs).values({
          orgId,
          actorUserId: ctx.user.id,
          actorName: ctx.user.name || 'Unknown',
          eventType: 'DELETE_EXECUTED',
          studentId: request.studentId,
          deletionRequestId: input.requestId,
          description: 'Student soft deleted',
        });
        
        // Update request status to executed
        await db.update(studentDeletionRequests)
          .set({ status: 'executed', updatedAt: new Date() })
          .where(eq(studentDeletionRequests.id, input.requestId));
        
        return { success: true, message: 'Student deleted successfully' };
      }),
    
    // Deny deletion request (owner only)
    denyDeletion: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { studentDeletionRequests, auditLogs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization context');
        
        // Check permission
        if (!ctx.user.permissions?.includes('students.delete.approve')) {
          throw new Error('Permission denied: students.delete.approve required');
        }
        
        // Get deletion request
        const [request] = await db.select().from(studentDeletionRequests)
          .where(eq(studentDeletionRequests.id, input.requestId));
        
        if (!request) throw new Error('Deletion request not found');
        if (request.orgId !== orgId) throw new Error('Unauthorized');
        
        // Deny the request
        await db.update(studentDeletionRequests)
          .set({ status: 'denied', updatedAt: new Date() })
          .where(eq(studentDeletionRequests.id, input.requestId));
        
        // Log denial
        await db.insert(auditLogs).values({
          orgId,
          actorUserId: ctx.user.id,
          actorName: ctx.user.name || 'Unknown',
          eventType: 'DELETE_DENIED',
          studentId: request.studentId,
          deletionRequestId: input.requestId,
          description: input.reason || 'Deletion request denied',
        });
        
        return { success: true, message: 'Deletion request denied' };
      }),

    // ── Secure delete: Step 1 — generate a 6-digit code ──────────────────────
    generateDeleteCode: protectedProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { eq, and, gt } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization context');

        // Ensure table exists (safe for first-time use)
        await db.execute(
          `CREATE TABLE IF NOT EXISTS student_delete_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            organization_id INT NOT NULL,
            student_id INT NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_used TINYINT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_sdc_org_student (organization_id, student_id),
            INDEX idx_sdc_expires (expires_at)
          )` as any
        );

        // Generate a cryptographically random 6-digit code
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

        // Invalidate any existing unused codes for this student
        await db.execute(
          `UPDATE student_delete_codes SET is_used = 1
           WHERE organization_id = ${orgId} AND student_id = ${input.studentId} AND is_used = 0` as any
        );

        // Insert the new code
        await db.execute(
          `INSERT INTO student_delete_codes (organization_id, student_id, code, expires_at)
           VALUES (${orgId}, ${input.studentId}, '${code}', '${expiresAtStr}')` as any
        );

        // Fetch the account holder's email and send the code via SendGrid
        const { getUserByOpenId } = await import('./db');
        const fullUser = await getUserByOpenId(ctx.user.openId);
        const ownerEmail = fullUser?.email;
        if (!ownerEmail) {
          throw new Error('Could not find account holder email. Please contact support.');
        }
        // Mask the email for display (e.g. v****@gmail.com)
        const atIdx = ownerEmail.indexOf('@');
        const localPart = ownerEmail.slice(0, atIdx);
        const domainPart = ownerEmail.slice(atIdx);
        const maskedEmail = `${localPart.charAt(0)}${'*'.repeat(Math.max(localPart.length - 1, 3))}${domainPart}`;
        // Send the code via SendGrid
        const { sendEmail } = await import('./services/sendgrid.js');
        const emailHtml = [
          '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">',
          '<h2 style="color:#111827;font-size:20px;margin-bottom:8px;">Student Deletion Verification</h2>',
          '<p style="color:#6b7280;font-size:14px;margin-bottom:24px;">A request was made to permanently delete a student record from your DojoFlow account. Use the code below to confirm this action.</p>',
          '<div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">',
          '<p style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Verification Code</p>',
          `<p style="color:#111827;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace;">${code}</p>`,
          '<p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">Expires in 10 minutes</p>',
          '</div>',
          '<p style="color:#6b7280;font-size:13px;">If you did not request this deletion, please ignore this email.</p>',
          '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />',
          '<p style="color:#9ca3af;font-size:12px;text-align:center;">DojoFlow — The Operating System for Every Studio</p>',
          '</div>',
        ].join('');
        await sendEmail(
          ownerEmail,
          'DojoFlow: Student Deletion Verification Code',
          emailHtml,
          `Your DojoFlow student deletion verification code is: ${code}. This code expires in 10 minutes.`
        );
        return { success: true, maskedEmail, expiresAt: expiresAtStr };
      }),

    // ── Secure delete: Step 2 — verify code and delete student ───────────────
    verifyAndDelete: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { students } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization context');

        // Look up the code — must be unused and not expired
        const [rows]: any = await db.execute(
          `SELECT id FROM student_delete_codes
           WHERE organization_id = ${orgId}
             AND student_id = ${input.studentId}
             AND code = '${input.code}'
             AND is_used = 0
             AND expires_at > NOW()
           LIMIT 1` as any
        );

        const match = Array.isArray(rows) ? rows[0] : null;
        if (!match) {
          throw new Error('Invalid or expired verification code. Please generate a new code.');
        }

        // Mark code as used
        await db.execute(
          `UPDATE student_delete_codes SET is_used = 1 WHERE id = ${match.id}` as any
        );

        // Delete the student
        await db.delete(students).where(eq(students.id, input.studentId));

        return { success: true };
      }),
  }),
  kai: router({
    // Get all conversations for the current user (excludes soft-deleted)
    getConversations: protectedProcedure
      .input(z.void())
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, desc, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        console.log('[kai.getConversations] Fetching conversations for user:', ctx.user.id);
        
        // Filter out soft-deleted conversations (deletedAt is null)
        const conversations = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .orderBy(desc(kaiConversations.lastMessageAt));
        
        console.log('[kai.getConversations] Found conversations:', conversations.length);
        return conversations;
      }),

    // Get messages for a specific conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number().positive() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, desc, isNull } = await import("drizzle-orm");
        const { TRPCError } = await import("@trpc/server");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        try {
          // Verify user owns this conversation
          const [conversation] = await db.select()
            .from(kaiConversations)
            .where(and(
              eq(kaiConversations.id, input.conversationId),
              eq(kaiConversations.userId, ctx.user.id)
            ))
            .limit(1);
          
          if (!conversation) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conversation not found',
            });
          }
          
          // Select all columns from kaiMessages (Drizzle will handle schema mapping)
          // CRITICAL: Filter out deleted messages
          const messages = await db.select()
            .from(kaiMessages)
            .where(and(
              eq(kaiMessages.conversationId, input.conversationId),
              isNull(kaiMessages.deletedAt)
            ))
            .orderBy(kaiMessages.createdAt);
          
          return messages;
        } catch (error) {
          console.error('[kai.getMessages] Error:', error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch messages: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
      }).nullish())
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { TRPCError } = await import("@trpc/server");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Ensure organizationId is always present
        if (!ctx.currentOrganizationId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No organization context. Please select an organization first.',
          });
        }
        
        try {
          const payload = {
            organizationId: ctx.currentOrganizationId,
            userId: ctx.user.id,
            title: input?.title || "New Conversation",
            preview: null,
            threadType: "kai_direct",
            status: "active",
            category: "kai",
            priority: "neutral",
            lastMessageAt:new Date().toISOString(),
            participantIds: JSON.stringify([ctx.user.id]),
          };
          
          console.log('[kai.createConversation] Inserting conversation with payload:', JSON.stringify(payload, null, 2));
          
          const [result] = await db.insert(kaiConversations).values(payload);
          
          console.log('[kai.createConversation] Conversation created with ID:', result.insertId, 'orgId:', ctx.currentOrganizationId);
          return { id: result.insertId };
        } catch (error: any) {
          console.error('[kai.createConversation] Database error:', {
            message: error?.message,
            code: error?.code,
            errno: error?.errno,
            sqlState: error?.sqlState,
            sql: error?.sql,
            stack: error?.stack,
          });
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create conversation: ${error?.message || 'Unknown error'}`,
            cause: error,
          });
        }
      }),

    // Add a message to a conversation
    addMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { TRPCError } = await import("@trpc/server");
        const { enforceFeatureAccess, deductCredits } = await import("./creditMiddleware");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        console.log('[kai.addMessage] Adding message to conversation:', input.conversationId, 'userId:', ctx.user.id, 'orgId:', ctx.currentOrganizationId);
        
        try {
          // Check subscription and credits for chat feature
          if (input.role === 'user') {
            await enforceFeatureAccess(ctx.currentOrganizationId, 'CHAT_MESSAGE');
          }
          // Verify user owns this conversation - use select() with proper column selection
          const conversations = await db.select({
            id: kaiConversations.id,
            organizationId: kaiConversations.organizationId,
            userId: kaiConversations.userId,
            title: kaiConversations.title,
            preview: kaiConversations.preview,
            lastMessageAt: kaiConversations.lastMessageAt,
          })
            .from(kaiConversations)
            .where(and(
              eq(kaiConversations.id, input.conversationId),
              eq(kaiConversations.userId, ctx.user.id)
            ))
            .limit(1);
          
          const conversation = conversations[0];
          if (!conversation) {
            console.error('[kai.addMessage] Conversation not found for id:', input.conversationId, 'userId:', ctx.user.id);
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Conversation not found or you do not have access to it',
            });
          }
          
          console.log('[kai.addMessage] Conversation found:', conversation.id);
          
          // Insert the message with explicit organizationId from conversation
          const [result] = await db.insert(kaiMessages).values({
            conversationId: input.conversationId,
            organizationId: conversation.organizationId,
            role: input.role,
            content: input.content,
            metadata: input.metadata,
          });
          
          console.log('[kai.addMessage] Message saved with ID:', result.insertId);
          
          // Deduct credits for user messages
          if (input.role === 'user') {
            const deductResult = await deductCredits(
              conversation.organizationId,
              ctx.user.id,
              'CHAT_MESSAGE',
              { conversationId: input.conversationId, messageId: result.insertId }
            );
            if (!deductResult.success) {
              console.warn('[kai.addMessage] Credit deduction warning:', deductResult.error);
            }
          }
          
          // Update conversation with preview and timestamp
          const preview = input.content.substring(0, 200);
          const updateData: any = {
            preview,
            lastMessageAt:new Date().toISOString(),
          };
          
          // Auto-update title from first user message if still "New Conversation"
          if (conversation.title === "New Conversation" && input.role === "user") {
            updateData.title = input.content.substring(0, 50) + (input.content.length > 50 ? "..." : "");
          }
          
          await db.update(kaiConversations)
            .set(updateData)
            .where(eq(kaiConversations.id, input.conversationId));
          
          console.log('[kai.addMessage] Conversation updated');
          return { id: result.insertId };
        } catch (error) {
          console.error('[kai.addMessage] Error:', error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to save message: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // Update conversation (title, status, category, priority)
    updateConversation: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        status: z.enum(["active", "archived"]).optional(),
        category: z.enum(["kai", "growth", "billing", "operations", "general"]).optional(),
        priority: z.enum(["neutral", "attention", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...updates } = input;
        
        await db.update(kaiConversations)
          .set(updates)
          .where(and(
            eq(kaiConversations.id, id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // Soft-delete a conversation (sets deletedAt timestamp)
    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not already deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or already deleted");
        }
        
        // Soft-delete by setting deletedAt timestamp
        await db.update(kaiConversations)
          .set({ deletedAt:new Date().toISOString() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Archive a conversation (sets status to 'archived')
    archiveConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Archive by setting archivedAt timestamp
        await db.update(kaiConversations)
          .set({ archivedAt:new Date().toISOString() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Unarchive a conversation (sets status back to 'active')
    unarchiveConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Unarchive by clearing archivedAt timestamp
        await db.update(kaiConversations)
          .set({ archivedAt: null })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id };
      }),

    // Rename a conversation
    renameConversation: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().min(1).max(500) }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Update the title
        await db.update(kaiConversations)
          .set({ title: input.title.trim() })
          .where(and(
            eq(kaiConversations.id, input.id),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true, id: input.id, title: input.title.trim() };
      }),

    // Summarize a conversation using AI
    summarizeConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get all messages in the conversation
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (messages.length === 0) {
          throw new Error("No messages to summarize");
        }
        
        // Format messages for LLM
        const messageHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n\n');
        
        // Generate summary using LLM
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an executive assistant for a martial arts dojo. Generate a concise executive summary of the following conversation. Focus on:
- Key topics discussed
- Important decisions or conclusions
- Action items mentioned
- Any concerns or issues raised

Format the summary with clear sections and bullet points where appropriate. Keep it professional and actionable.`
            },
            {
              role: 'user',
              content: `Please summarize this conversation:\n\n${messageHistory}`
            }
          ]
        });
        
        const summary = response.choices[0]?.message?.content || 'Unable to generate summary';
        
        // Save summary as a Kai message in the conversation
        const [savedMessage] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: `## 📋 Conversation Summary\n\n${summary}`,
          metadata: JSON.stringify({ type: 'summary', generatedAt:new Date().toISOString() })
        });
        
        // Update conversation last message
        await db.update(kaiConversations)
          .set({ 
            preview: 'Conversation Summary generated',
            lastMessageAt:new Date().toISOString()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          summary,
          messageId: savedMessage.insertId
        };
      }),

    // Extract structured data from a conversation using AI
    extractConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        
        // Get all messages in the conversation
        const messages = await db.select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (messages.length === 0) {
          throw new Error("No messages to extract from");
        }
        
        // Format messages for LLM
        const messageHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Kai'}: ${m.content}`).join('\n\n');
        
        // Extract structured data using LLM with JSON schema
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: `You are an executive assistant for a martial arts dojo. Extract structured data from the conversation. Identify and categorize:

1. **Action Items**: Tasks that need to be completed
2. **Follow-ups**: Items that require follow-up communication or checking
3. **Decisions**: Any decisions that were made during the conversation
4. **Mentioned Students**: Names of any students mentioned (with context)
5. **Mentioned Staff**: Names of any staff/instructors mentioned (with context)
6. **Key Dates/Deadlines**: Any dates or deadlines mentioned
7. **Financial Items**: Any billing, payment, or financial matters discussed

Return the data as a structured JSON object.`
            },
            {
              role: 'user',
              content: `Please extract structured data from this conversation:\n\n${messageHistory}`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'conversation_extraction',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  actionItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        task: { type: 'string' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                        assignee: { type: 'string' }
                      },
                      required: ['task', 'priority', 'assignee'],
                      additionalProperties: false
                    }
                  },
                  followUps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: { type: 'string' },
                        deadline: { type: 'string' }
                      },
                      required: ['item', 'deadline'],
                      additionalProperties: false
                    }
                  },
                  decisions: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  mentionedStudents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        context: { type: 'string' }
                      },
                      required: ['name', 'context'],
                      additionalProperties: false
                    }
                  },
                  mentionedStaff: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        context: { type: 'string' }
                      },
                      required: ['name', 'context'],
                      additionalProperties: false
                    }
                  },
                  keyDates: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string' },
                        description: { type: 'string' }
                      },
                      required: ['date', 'description'],
                      additionalProperties: false
                    }
                  },
                  financialItems: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['actionItems', 'followUps', 'decisions', 'mentionedStudents', 'mentionedStaff', 'keyDates', 'financialItems'],
                additionalProperties: false
              }
            }
          }
        });
        
        let extractedData;
        try {
          extractedData = JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch {
          extractedData = {
            actionItems: [],
            followUps: [],
            decisions: [],
            mentionedStudents: [],
            mentionedStaff: [],
            keyDates: [],
            financialItems: []
          };
        }
        
        // Format extracted data as readable message
        let formattedContent = '## 📊 Conversation Extraction\n\n';
        
        if (extractedData.actionItems?.length > 0) {
          formattedContent += '### ✅ Action Items\n';
          extractedData.actionItems.forEach((item: any) => {
            const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
            formattedContent += `- ${priorityEmoji} **${item.task}** (Assigned: ${item.assignee})\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.followUps?.length > 0) {
          formattedContent += '### 📞 Follow-ups\n';
          extractedData.followUps.forEach((item: any) => {
            formattedContent += `- ${item.item} (Due: ${item.deadline})\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.decisions?.length > 0) {
          formattedContent += '### 🎯 Decisions\n';
          extractedData.decisions.forEach((item: string) => {
            formattedContent += `- ${item}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.mentionedStudents?.length > 0) {
          formattedContent += '### 👤 Mentioned Students\n';
          
          // Look up student IDs for each mentioned student
          const { students } = await import("../drizzle/schema");
          const { like, or } = await import("drizzle-orm");
          
          for (const item of extractedData.mentionedStudents) {
            // Try to find the student in the database
            const nameParts = item.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            let studentId = null;
            let studentMatch = null;
            
            if (firstName) {
              const matchingStudents = await db.select()
                .from(students)
                .where(or(
                  like(students.firstName, `%${firstName}%`),
                  like(students.lastName, `%${lastName || firstName}%`)
                ))
                .limit(1);
              
              if (matchingStudents.length > 0) {
                studentMatch = matchingStudents[0];
                studentId = studentMatch.id;
              }
            }
            
            // Add to formatted content with student ID for Save to Card button
            if (studentId) {
              formattedContent += `- **${item.name}** [STUDENT_ID:${studentId}]: ${item.context}\n`;
              // Store the student ID in the extracted data for frontend use
              item.studentId = studentId;
              item.fullName = `${studentMatch?.firstName} ${studentMatch?.lastName}`;
            } else {
              formattedContent += `- **${item.name}**: ${item.context}\n`;
            }
          }
          formattedContent += '\n';
        }
        
        if (extractedData.mentionedStaff?.length > 0) {
          formattedContent += '### 👥 Mentioned Staff\n';
          extractedData.mentionedStaff.forEach((item: any) => {
            formattedContent += `- **${item.name}**: ${item.context}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.keyDates?.length > 0) {
          formattedContent += '### 📅 Key Dates\n';
          extractedData.keyDates.forEach((item: any) => {
            formattedContent += `- **${item.date}**: ${item.description}\n`;
          });
          formattedContent += '\n';
        }
        
        if (extractedData.financialItems?.length > 0) {
          formattedContent += '### 💰 Financial Items\n';
          extractedData.financialItems.forEach((item: string) => {
            formattedContent += `- ${item}\n`;
          });
          formattedContent += '\n';
        }
        
        // Check if anything was extracted
        const hasContent = Object.values(extractedData).some((arr: any) => arr?.length > 0);
        if (!hasContent) {
          formattedContent += '_No structured data could be extracted from this conversation._\n';
        }
        
        // Save extraction as a Kai message in the conversation
        const [savedMessage] = await db.insert(kaiMessages).values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: formattedContent,
          metadata: JSON.stringify({ 
            type: 'extraction', 
            extractedData,
            generatedAt:new Date().toISOString() 
          })
        });
        
        // Update conversation last message
        await db.update(kaiConversations)
          .set({ 
            preview: 'Conversation data extracted',
            lastMessageAt:new Date().toISOString()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          extractedData,
          formattedContent,
          messageId: savedMessage.insertId
        };
      }),

    generateSpeech: publicProcedure
      .input(z.object({
        text: z.string(),
        voiceId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateKaiSpeech } = await import("./_core/elevenlabs");
        const { storagePut } = await import("./storage");
        
        try {
          // Generate speech using ElevenLabs
          const result = await generateKaiSpeech(input.text);
          
          if (!result.success || !result.audioBuffer) {
            return {
              success: false,
              error: result.error || 'Failed to generate speech'
            };
          }
          
          // Upload audio to S3
          const audioKey = `kai-speech/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
          const { url: audioUrl } = await storagePut(audioKey, result.audioBuffer, 'audio/mpeg');
          
          // Calculate audio duration (rough estimate based on text length)
          // Average speaking rate: ~150 words per minute = 2.5 words per second
          const wordCount = input.text.split(/\s+/).length;
          const estimatedDuration = (wordCount / 2.5) * 1000; // in milliseconds
          
          console.log('[Kai TTS] Generated speech:', {
            textLength: input.text.length,
            wordCount,
            estimatedDuration: `${estimatedDuration}ms`,
            audioUrl
          });
          
          return {
            success: true,
            audioUrl,
            audioDuration: estimatedDuration
          };
        } catch (error) {
          console.error('[Kai TTS] Error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }),

    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        avatarName: z.string().optional(),
        conversation_id: z.string().optional(),
        context: z.any().optional(),
        conversationHistory: z.array(z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string(),
        })).optional(),
        organizationId: z.number().optional(), // For credit consumption
        confirmedAction: z.object({
          toolName: z.string(),
          toolArgs: z.record(z.any()),
        }).optional(), // Pre-confirmed destructive action (bypass LLM)
        imageUrl: z.string().optional(), // Vision: URL of an image for Kai to analyze
        pendingScheduleData: z.object({
          classes: z.array(z.object({
            name: z.string(),
            dayOfWeek: z.union([z.string(), z.array(z.string())]),
            startTime: z.string(),
            endTime: z.string(),
            instructor: z.string().optional(),
            location: z.string().optional(),
            maxCapacity: z.number().optional(),
          })),
        }).optional(), // Pre-extracted schedule data to import directly (bypasses history scan)
      }).strict())
      .mutation(async ({ input, ctx }) => {
        // Validate input is not undefined
        if (!input) {
          throw new Error('Input is required for kai.chat mutation');
        }
        
        const { message, avatarName = 'Kai', conversationHistory = [], organizationId } = input;

        // ── CONFIRMED ACTION SHORTCUT ─────────────────────────────────────────
        // When user clicked "Yes, archive" — bypass LLM and execute directly
        if (input.confirmedAction) {
          const { toolName, toolArgs } = input.confirmedAction;
          console.log('[Kai Chat] Executing confirmed action:', toolName, toolArgs);
          const result = await executeCRMFunction(toolName, toolArgs, ctx);
          if (result.error) {
            return { response: `❌ ${result.error}`, ui_blocks: [] };
          }
          return { response: result.message || `✅ Action completed.`, ui_blocks: [] };
        }
        // ── END CONFIRMED ACTION SHORTCUT ─────────────────────────────────────
        
        console.log('[Kai Chat] Input received:', { message, avatarName, hasHistory: conversationHistory.length > 0, organizationId });
        console.log('[Kai Chat] User message:', message);
        
        // Check credit balance before processing (if organizationId provided)
        if (organizationId) {
          const { checkSufficientBalance, CREDIT_COSTS } = await import("./creditConsumption");
          const balanceCheck = await checkSufficientBalance(organizationId, CREDIT_COSTS.KAI_CHAT);
          
          if (!balanceCheck.sufficient) {
            throw new Error(balanceCheck.message || "Insufficient credits for Kai chat");
          }
          
          // Log warning if balance is low
          if (balanceCheck.message) {
            console.warn('[Kai Chat] Credit warning:', balanceCheck.message);
          }
        }
        
        // Use OpenAI GPT-4 for conversational AI
        const { chatWithKai } = await import("./services/openai");
        const { processAbsenceReportQuery } = await import("./services/absenceReportWrapper");
        
        // ── CONTEXT LOADING & INTENT ROUTING ─────────────────────────────────
        let contextBlock = '';
        let intentHint = '';
        try {
          const orgId = ctx?.currentOrganizationId || organizationId;
          if (orgId) {
            const { loadKaiContext, buildContextBlock } = await import('./services/kaiContextLoader');
            const { classifyIntent, buildIntentHint } = await import('./services/kaiIntentRouter');
            const db = await getDb();
            if (db) {
              const pageCtx = {
                userName: ctx?.user?.name || undefined,
                userRole: ctx?.user?.role || 'owner',
              };
              const kaiCtx = await loadKaiContext(orgId, db, pageCtx);
              contextBlock = buildContextBlock(kaiCtx);
              const intentMatch = classifyIntent(message);
              intentHint = buildIntentHint(intentMatch);
            }
          }
        } catch (ctxErr) {
          console.warn('[Kai Chat] Context loading failed (non-fatal):', ctxErr);
        }
        // ── END CONTEXT LOADING ───────────────────────────────────────────────
        
        try {
          const aiResponse = await chatWithKai(message, conversationHistory, avatarName, input.imageUrl, contextBlock, intentHint);
          console.log('[Kai Chat] AI response:', JSON.stringify(aiResponse, null, 2));
          
          // Check if this is an absence report query and wrap data for InfoPanel
          const db = await getDb();
          if (db && ctx.currentOrganizationId) {
            const absenceBlocks = await processAbsenceReportQuery(message, db, ctx.currentOrganizationId);
            if (absenceBlocks && absenceBlocks.length > 0) {
              console.log('[Kai Chat] Absence report blocks detected, adding to ui_blocks');
              aiResponse.ui_blocks = [...(aiResponse.ui_blocks || []), ...absenceBlocks];
            }
          }
          
          // If GPT-4 wants to call functions, execute them
          if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
            console.log('[Kai Chat] Function calls detected:', aiResponse.functionCalls.length);

            // ── CONFIRMATION GATE: Intercept destructive actions ────────────────
            const DESTRUCTIVE_FUNCS = ['remove_student', 'archive_student'];
            const destructiveCall = aiResponse.functionCalls.find((c: any) => DESTRUCTIVE_FUNCS.includes(c.name));
            if (destructiveCall) {
              const studentName = destructiveCall.arguments?.studentName || 'this student';
              const confirmMsg = `⚠️ **Confirm Archive**\n\nAre you sure you want to archive **${studentName}**? They will be moved to Inactive status and removed from the active roster. Their records will be preserved.\n\nReply **"Yes, archive"** to confirm or **"Cancel"** to abort.`;
              return {
                response: confirmMsg,
                pendingAction: {
                  toolName: destructiveCall.name,
                  toolArgs: destructiveCall.arguments,
                },
                quickReplies: [
                  { label: `✅ Yes, archive ${studentName}`, action: `confirm_archive:${JSON.stringify(destructiveCall.arguments)}` },
                  { label: '❌ Cancel', action: 'cancel_action' },
                ],
                ui_blocks: [],
              };
            }
            // ── END CONFIRMATION GATE ──────────────────────────────────────────

            // ── EXTRACT_CLASS_SCHEDULE TOOL CALL ───────────────────────────────
            // When the LLM calls extract_class_schedule, return the schedule data
            // as a scheduleImportData block so the client can render the import button.
            // This is the clean approach — no JSON embedded in visible text.
            const scheduleToolCall = aiResponse.functionCalls.find((c: any) => c.name === 'extract_class_schedule');
            if (scheduleToolCall) {
              const scheduleArgs = scheduleToolCall.arguments;
              const classCount = scheduleArgs?.classes?.length || 0;
              const summary = scheduleArgs?.summary || `Found ${classCount} classes`;
              console.log('[Kai Chat] extract_class_schedule tool called with', classCount, 'classes');
              // Build a review request since this is a completed vision task
              const reviewRequest = {
                taskType: 'schedule_import',
                taskDescription: `Analyzed schedule image: ${summary}`,
                completedAt: new Date().toISOString(),
              };
              return {
                response: `I've analyzed the schedule. ${summary}. Review the classes below and click **"Import X Classes"** to add them to your schedule.`,
                scheduleImportData: { classes: scheduleArgs?.classes || [] },
                ui_blocks: [{
                  type: 'schedule_import',
                  data: { classes: scheduleArgs?.classes || [] },
                  classCount,
                }],
                reviewRequest,
              };
            }
            // ── END EXTRACT_CLASS_SCHEDULE ─────────────────────────────────────

            const functionResults: any[] = [];
            
            for (const call of aiResponse.functionCalls) {
              console.log('[Kai Chat] Executing function:', call.name, 'with args:', call.arguments);
              console.log('[Kai Chat] Context:', { userId: ctx.userId, orgId: ctx.currentOrganizationId });
              const result = await executeCRMFunction(call.name, call.arguments, ctx);
              console.log('[Kai Chat] Function result:', JSON.stringify(result, null, 2));
              functionResults.push(result);
            }
            
            // Return the AI response with function results
            const formatted = formatFunctionResults(functionResults);
            return {
              response: aiResponse.response || formatted.text,
              action_result: functionResults[0], // For backwards compatibility
              ui_blocks: formatted.ui_blocks,
            };
          }
          
          // Deduct credits after successful response (if organizationId provided)
          if (organizationId) {
            const { deductCredits, CREDIT_COSTS } = await import("./creditConsumption");
            const deductResult = await deductCredits({
              organizationId,
              amount: CREDIT_COSTS.KAI_CHAT,
              taskType: 'kai_chat' as const,
              description: `Kai chat: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
              metadata: {
                messageLength: message.length,
                responseLength: aiResponse.response?.length || 0,
                hasFunctionCalls: false,
              },
            });
            
            if (!deductResult.success) {
              console.error('[Kai Chat] Failed to deduct credits:', deductResult.error);
            } else {
              console.log('[Kai Chat] Credits deducted. New balance:', deductResult.newBalance);
            }
          }
          
          // ── AUTO-IMPORT: If user asks Kai to place/import schedule, use pendingScheduleData from client ──
          // The client passes pendingScheduleData directly when the user asks to import a schedule
          // that was previously extracted from an image. This is more reliable than scanning history
          // because the SCHEDULE_JSON block is stripped from the cleaned response stored in history.
          const importTriggerPhrases = [
            'put this in', 'place this', 'add this', 'import this', 'save this',
            'put these', 'place these', 'add these', 'import these', 'save these',
            'put it in', 'place it', 'add it to classes', 'save to classes',
            'add to classes', 'put in classes', 'place in classes',
            'can you place', 'please place', 'can you add', 'please add',
          ];
          const msgLowerForImport = message.toLowerCase();
          const isImportRequest = importTriggerPhrases.some(p => msgLowerForImport.includes(p));

          // Use pendingScheduleData passed directly from client (preferred), or fall back to history scan
          const directScheduleData = input.pendingScheduleData || null;

          if ((isImportRequest || directScheduleData) && ctx.currentOrganizationId) {
            // Use directly passed schedule data first, then fall back to history scan
            let historicScheduleData: any = directScheduleData;
            if (!historicScheduleData) {
              // Fallback: scan conversation history for a SCHEDULE_JSON block
              for (const histMsg of [...conversationHistory].reverse()) {
                if (histMsg.role === 'assistant') {
                  const histMatch = histMsg.content.match(/\[SCHEDULE_JSON:(\{.*?\})]\s*$/s);
                  if (histMatch) {
                    try {
                      historicScheduleData = JSON.parse(histMatch[1]);
                      break;
                    } catch { /* ignore parse errors */ }
                  }
                }
              }
            }
            console.log('[Kai Chat] Auto-import check: directScheduleData=', !!directScheduleData, 'historicScheduleData=', !!historicScheduleData, 'classes=', historicScheduleData?.classes?.length);

            if (historicScheduleData?.classes?.length > 0) {
              console.log('[Kai Chat] Auto-importing', historicScheduleData.classes.length, 'classes from conversation history');
              try {
                const { getDb } = await import('./db');
                const { classes: classesTable } = await import('../drizzle/schema');
                const autoDb = await getDb();
                if (autoDb) {
                  let autoCreatedCount = 0;
                  const formatTime24to12 = (t: string) => {
                    const [h, m] = t.split(':').map(Number);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
                  };
                  for (const cls of historicScheduleData.classes) {
                    try {
                      const dayStr = Array.isArray(cls.dayOfWeek) ? cls.dayOfWeek.join(',') : cls.dayOfWeek;
                      const timeDisplay = `${formatTime24to12(cls.startTime)} - ${formatTime24to12(cls.endTime)}`;
                      await autoDb.insert(classesTable).values({
                        name: cls.name,
                        dayOfWeek: dayStr,
                        time: timeDisplay,
                        instructor: cls.instructor || null,
                        capacity: cls.maxCapacity || 20,
                        isActive: 1,
                        enrolled: 0,
                        organizationId: ctx.currentOrganizationId!,
                      });
                      autoCreatedCount++;
                    } catch (e: any) {
                      console.error('[Kai Chat] Auto-import class error:', e.message);
                    }
                  }
                  console.log('[Kai Chat] Auto-import complete:', autoCreatedCount, 'classes created');
                  const reviewRequestAutoImport = {
                    taskSummary: message.slice(0, 120),
                    taskType: 'schedule',
                    creditsUsed: 0,
                  };
                  return {
                    response: `✅ Done! I've added **${autoCreatedCount} class${autoCreatedCount !== 1 ? 'es' : ''}** to your schedule.`,
                    ui_blocks: [],
                    reviewRequest: reviewRequestAutoImport,
                    viewClassesLink: true,
                    importedClassCount: autoCreatedCount,
                  };
                }
              } catch (autoImportErr: any) {
                console.error('[Kai Chat] Auto-import outer error:', autoImportErr.message);
              }
            }
          }
          // ── END AUTO-IMPORT ───────────────────────────────────────          // ── SCHEDULE_JSON EXTRACTION ────────────────────────────────────────────────────
          // If vision response contains [SCHEDULE_JSON:{...}], extract it and
          // return as a schedule_import ui_block so the client can render an import button.
          // We use bracket counting instead of regex to handle large nested JSON reliably.
          let scheduleImportData: any = null;
          let cleanedResponse = aiResponse.response || '';
          const scheduleTag = '[SCHEDULE_JSON:';
          const scheduleTagIdx = cleanedResponse.indexOf(scheduleTag);
          if (scheduleTagIdx !== -1) {
            // Find the matching closing bracket by counting depth
            const jsonStart = scheduleTagIdx + scheduleTag.length;
            let depth = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < cleanedResponse.length; i++) {
              if (cleanedResponse[i] === '{') depth++;
              else if (cleanedResponse[i] === '}') {
                depth--;
                if (depth === 0) { jsonEnd = i + 1; break; }
              }
            }
            if (jsonEnd !== -1) {
              const jsonStr = cleanedResponse.slice(jsonStart, jsonEnd);
              try {
                scheduleImportData = JSON.parse(jsonStr);
                // Strip the entire [SCHEDULE_JSON:{...}] block (and any trailing ] or whitespace) from the visible text
                const blockEnd = cleanedResponse.indexOf(']', jsonEnd);
                const removeUntil = blockEnd !== -1 ? blockEnd + 1 : jsonEnd;
                cleanedResponse = (cleanedResponse.slice(0, scheduleTagIdx) + cleanedResponse.slice(removeUntil)).trim();
                console.log('[Kai Chat] Extracted schedule import data with', scheduleImportData?.classes?.length, 'classes');
              } catch (parseErr) {
                // JSON parse failed — still strip the block so it doesn't show as raw text
                const blockEnd = cleanedResponse.indexOf(']', jsonEnd);
                const removeUntil = blockEnd !== -1 ? blockEnd + 1 : jsonEnd;
                cleanedResponse = (cleanedResponse.slice(0, scheduleTagIdx) + cleanedResponse.slice(removeUntil)).trim();
                console.warn('[Kai Chat] Failed to parse SCHEDULE_JSON block:', parseErr);
              }
            } else {
              // Couldn’t find closing bracket — strip everything from the tag to end of string
              cleanedResponse = cleanedResponse.slice(0, scheduleTagIdx).trim();
              console.warn('[Kai Chat] SCHEDULE_JSON block has no closing bracket, stripped from response');
            }
          }
          // ── END SCHEDULE_JSON EXTRACTION ────────────────────────────────────────────────      // Return response with ui_blocks for InfoPanel population
          const finalUiBlocks = [...(aiResponse.ui_blocks || [])];
          if (scheduleImportData && scheduleImportData.classes?.length > 0) {
            finalUiBlocks.push({
              type: 'schedule_import',
              data: scheduleImportData,
              classCount: scheduleImportData.classes.length,
            });
          }
          // ── POST-TASK REVIEW DETECTION ──────────────────────────────────────
          // Detect task-completion signals in the response to prompt a review.
          // We look for common completion phrases that indicate Kai finished a meaningful task.
          const taskCompletionPhrases = [
            // Explicit completion markers
            'done!', 'completed!', 'finished!', 'sent!', 'created!', 'added!',
            'scheduled!', 'updated!', 'deleted!', 'removed!', 'imported!',
            // "I've" patterns
            'i\'ve sent', 'i\'ve created', 'i\'ve added', 'i\'ve scheduled',
            'i\'ve updated', 'i\'ve deleted', 'i\'ve removed', 'i\'ve imported',
            'i\'ve set up', 'i\'ve set', 'i\'ve placed', 'i\'ve saved',
            // "Successfully" patterns
            'successfully sent', 'successfully created', 'successfully added',
            'successfully scheduled', 'successfully updated', 'successfully set',
            'successfully imported', 'successfully placed',
            // "Has been" patterns
            'has been sent', 'has been created', 'has been added',
            'has been scheduled', 'has been set up', 'has been updated',
            // Image/schedule analysis completion
            'here are the extracted', 'here is a summary', 'here\'s a summary',
            'here are the classes', 'extracted the following', 'i extracted',
            'the schedule shows', 'the image contains', 'i can see',
            'let me know if you need', 'feel free to let me know',
            // Import/action completion
            'importing the class schedule', 'import the class schedule',
            'set up with the correct', 'reflected in the schedule',
            'classes to your schedule', 'added to your schedule',
          ];
          const lowerCleanedResponse = cleanedResponse.toLowerCase();
          // Also trigger review for image-based tasks (vision) and when scheduleImportData is present
          const isVisionTask = !!input.imageUrl;
          const hasScheduleData = scheduleImportData && scheduleImportData.classes?.length > 0;
          const isTaskCompletion = isVisionTask || hasScheduleData || taskCompletionPhrases.some(phrase =>
            lowerCleanedResponse.includes(phrase)
          );     // Determine task type from the message content
          let detectedTaskType: string | undefined;
          const msgLower = (message || '').toLowerCase();
          if (msgLower.includes('sms') || msgLower.includes('text') || msgLower.includes('blast')) detectedTaskType = 'sms';
          else if (msgLower.includes('email')) detectedTaskType = 'email';
          else if (msgLower.includes('class') || msgLower.includes('schedule')) detectedTaskType = 'schedule';
          else if (msgLower.includes('student') || msgLower.includes('enroll')) detectedTaskType = 'student_management';
          else if (msgLower.includes('lead')) detectedTaskType = 'lead_management';
          else if (msgLower.includes('import')) detectedTaskType = 'import';
          else detectedTaskType = 'general';

          // Build a short task summary from the user message (max 120 chars)
          const taskSummaryText = (message || '').length > 120
            ? (message || '').slice(0, 117) + '…'
            : (message || '');

          const reviewRequest = isTaskCompletion ? {
            taskSummary: taskSummaryText,
            taskType: detectedTaskType,
            creditsUsed: 0, // Will be enriched from credit deduction data if available
          } : undefined;
          // ── END POST-TASK REVIEW DETECTION ─────────────────────────────────

          return {
            response: cleanedResponse,
            ui_blocks: finalUiBlocks,
            scheduleImportData: scheduleImportData || undefined,
            reviewRequest,
          };
        } catch (error) {
          console.error('[Kai Chat] Error caught:', error);
          console.error('[Kai Chat] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          console.error('[Kai Chat] Error message:', error instanceof Error ? error.message : String(error));
          // Fallback to keyword-based parsing if OpenAI fails
          const lowerMessage = message.toLowerCase();
        
        // Student lookup
        if (lowerMessage.includes('find') || lowerMessage.includes('lookup') || lowerMessage.includes('search')) {
          const { searchStudents } = await import("./db");
          
          // Extract potential name from message
          const words = message.split(' ');
          const nameQuery = words.slice(1).join(' '); // Skip first word (find/lookup/search)
          
          const students = await searchStudents(nameQuery);
          
          if (students.length > 0) {
            const student = students[0];
            return {
              response: `I found ${student.firstName} ${student.lastName}'s information. Here are the details:`,
              action_result: {
                type: "student_lookup",
                student: {
                  first_name: student.firstName,
                  last_name: student.lastName,
                  belt_rank: student.beltRank,
                  status: student.status,
                  email: student.email,
                  phone: student.phone,
                  age: student.age,
                  membership_status: student.membershipStatus,
                }
              }
            };
          } else {
            return {
              response: `No students found for "${nameQuery}" — try a different name or check the spelling.`
            };
          }
        }
        
        // Stats queries
        if (lowerMessage.includes('how many students') || lowerMessage.includes('total students')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `You currently have ${stats?.total_students || 0} active students in your dojo.`
          };
        }
        
        if (lowerMessage.includes('revenue') || lowerMessage.includes('money')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `Your monthly revenue is $${stats?.monthly_revenue || 0}.`
          };
        }
        
        if (lowerMessage.includes('leads')) {
          const { getDashboardStats } = await import("./db");
          const stats = await getDashboardStats();
          return {
            response: `You have ${stats?.total_leads || 0} active leads in your pipeline.`
          };
        }
        
        // Kiosk check-ins
        if (lowerMessage.includes('check-in') || lowerMessage.includes('checkin') || lowerMessage.includes('check in')) {
          const { getKioskCheckIns } = await import("./db");
          const checkIns = await getKioskCheckIns();
          return {
            response: `There have been ${checkIns?.length || 0} check-ins today at the kiosk.`
          };
        }
        
        // Kiosk visitors
        if (lowerMessage.includes('visitor') || lowerMessage.includes('new visitor')) {
          const { getKioskVisitors } = await import("./db");
          const visitors = await getKioskVisitors();
          return {
            response: `You have ${visitors?.length || 0} new visitors today.`
          };
        }
        
        // Waivers
        if (lowerMessage.includes('waiver')) {
          const { getKioskWaivers } = await import("./db");
          const waivers = await getKioskWaivers();
          return {
            response: `${waivers?.length || 0} waivers have been signed today.`
          };
        }
        
        // Classes
        if (lowerMessage.includes('class') && (lowerMessage.includes('today') || lowerMessage.includes('schedule'))) {
          return {
            response: "Today's class schedule: 4:00 PM - Kids Karate (Ages 6-12), 5:30 PM - Teen Martial Arts, 7:00 PM - Adult Kickboxing. Would you like more details about any class?"
          };
        }
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi' || lowerMessage.includes('hey')) {
          return {
            response: `Hello! I'm ${avatarName}, your AI dojo assistant. I can help you check student information, view statistics, manage check-ins, and more. What would you like to know?`
          };
        }
        
        // Default response
        return {
          response: `I'm ${avatarName}, your AI assistant. I can help you with:\n• Finding student information\n• Checking statistics (students, revenue, leads)\n• Viewing today's check-ins and visitors\n• Checking class schedules\n• Managing waivers\n\nWhat would you like to know?`
        };
        }
      }),

    // Export conversation history
    exportConversations: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(), // If provided, export single conversation; otherwise export all
        format: z.enum(["json", "markdown", "csv"]).default("json"),
      }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, desc, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get conversations
        let conversations;
        if (input.conversationId) {
          // Export single conversation
          conversations = await db.select()
            .from(kaiConversations)
            .where(and(
              eq(kaiConversations.id, input.conversationId),
              eq(kaiConversations.userId, ctx.user.id),
              isNull(kaiConversations.deletedAt)
            ))
            .limit(1);
        } else {
          // Export all conversations
          conversations = await db.select()
            .from(kaiConversations)
            .where(and(
              eq(kaiConversations.userId, ctx.user.id),
              isNull(kaiConversations.deletedAt)
            ))
            .orderBy(desc(kaiConversations.lastMessageAt));
        }
        
        if (conversations.length === 0) {
          throw new Error("No conversations found");
        }
        
        // Get messages for each conversation
        const exportData = [];
        for (const conversation of conversations) {
          const messages = await db.select()
            .from(kaiMessages)
            .where(eq(kaiMessages.conversationId, conversation.id))
            .orderBy(kaiMessages.createdAt);
          
          exportData.push({
            conversation,
            messages,
          });
        }
        
        // Format based on requested format
        let content: string;
        let filename: string;
        let mimeType: string;
        
        if (input.format === "json") {
          content = JSON.stringify(exportData, null, 2);
          filename = input.conversationId 
            ? `kai-conversation-${input.conversationId}.json`
            : `kai-conversations-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = "application/json";
        } else if (input.format === "markdown") {
          content = exportData.map(({ conversation, messages }) => {
            let md = `# ${conversation.title}\n\n`;
            md += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
            md += `**Last Message:** ${new Date(conversation.lastMessageAt).toLocaleString()}\n`;
            md += `**Status:** ${conversation.status}\n`;
            md += `**Category:** ${conversation.category}\n\n`;
            md += `---\n\n`;
            
            messages.forEach(msg => {
              md += `### ${msg.role === 'user' ? '👤 User' : '🤖 Kai'}\n`;
              md += `*${new Date(msg.createdAt).toLocaleString()}*\n\n`;
              md += `${msg.content}\n\n`;
            });
            
            return md;
          }).join('\n\n---\n\n');
          
          filename = input.conversationId
            ? `kai-conversation-${input.conversationId}.md`
            : `kai-conversations-${new Date().toISOString().split('T')[0]}.md`;
          mimeType = "text/markdown";
        } else {
          // CSV format
          content = "Conversation ID,Conversation Title,Message Role,Message Content,Created At\n";
          exportData.forEach(({ conversation, messages }) => {
            messages.forEach(msg => {
              const escapedContent = msg.content.replace(/"/g, '""').replace(/\n/g, ' ');
              content += `${conversation.id},"${conversation.title}",${msg.role},"${escapedContent}",${new Date(msg.createdAt).toISOString()}\n`;
            });
          });
          
          filename = input.conversationId
            ? `kai-conversation-${input.conversationId}.csv`
            : `kai-conversations-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = "text/csv";
        }
        
        return {
          content,
          filename,
          mimeType,
          count: exportData.length,
        }
      }),

    // Delete all messages from a conversation
    deleteAllMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Soft-delete all messages in the conversation (set deletedAt timestamp)
        const now = new Date();
        const result = await db.update(kaiMessages)
          .set({ deletedAt: now })
          .where(and(
            eq(kaiMessages.conversationId, input.conversationId),
            isNull(kaiMessages.deletedAt)
          ));
        
        // Update conversation to reset preview and last message time
        await db.update(kaiConversations)
          .set({ 
            preview: null,
            lastMessageAt: now
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { success: true, conversationId: input.conversationId, deletedCount: result.rowsAffected };
      }),

    // Bulk delete specific messages from a conversation
    bulkDeleteMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        messageIds: z.array(z.number()).min(1).max(100)
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and, isNull, inArray } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation and it's not deleted
        const [conversation] = await db.select()
          .from(kaiConversations)
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id),
            isNull(kaiConversations.deletedAt)
          ))
          .limit(1);
        
        if (!conversation) {
          throw new Error("Conversation not found or deleted");
        }
        
        // Verify all messages belong to this conversation and are not deleted
        const messagesToDelete = await db.select()
          .from(kaiMessages)
          .where(and(
            eq(kaiMessages.conversationId, input.conversationId),
            inArray(kaiMessages.id, input.messageIds),
            isNull(kaiMessages.deletedAt)
          ));
        
        if (messagesToDelete.length === 0) {
          throw new Error("No messages found to delete");
        }
        
        // Soft-delete the selected messages
        const now = new Date();
        await db.update(kaiMessages)
          .set({ deletedAt: now })
          .where(and(
            eq(kaiMessages.conversationId, input.conversationId),
            inArray(kaiMessages.id, input.messageIds),
            isNull(kaiMessages.deletedAt)
          ));
        
        // Get the remaining non-deleted messages to update preview
        const remainingMessages = await db.select()
          .from(kaiMessages)
          .where(and(
            eq(kaiMessages.conversationId, input.conversationId),
            isNull(kaiMessages.deletedAt)
          ))
          .orderBy(kaiMessages.createdAt);
        
        // Update conversation preview with the last remaining message
        const lastMessage = remainingMessages[remainingMessages.length - 1];
        const preview = lastMessage ? lastMessage.content.substring(0, 200) : null;
        
        await db.update(kaiConversations)
          .set({ 
            preview,
            lastMessageAt: lastMessage ? new Date(lastMessage.createdAt) :new Date().toISOString()
          })
          .where(eq(kaiConversations.id, input.conversationId));
        
        return { 
          success: true, 
          conversationId: input.conversationId,
          deletedCount: messagesToDelete.length
        };
      }),

    // Update conversation summary
    updateSummary: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        summary: z.string().max(1200),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user owns this conversation
        await db.update(kaiConversations)
          .set({
            summary: input.summary,
            updatedAt:new Date().toISOString(),
          })
          .where(and(
            eq(kaiConversations.id, input.conversationId),
            eq(kaiConversations.userId, ctx.user.id)
          ));
        
        return { success: true };
      }),

    // Generate summary using LLM
    generateSummary: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { kaiConversations, kaiMessages } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get all messages in conversation
        const conversationMessages = await db
          .select()
          .from(kaiMessages)
          .where(eq(kaiMessages.conversationId, input.conversationId))
          .orderBy(kaiMessages.createdAt);
        
        if (conversationMessages.length === 0) {
          return { summary: "" };
        }
        
        // Format messages for LLM
        const formattedMessages = conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        
        // Generate summary using LLM
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a conversation summarizer. Create a concise summary (under 1200 chars) of the conversation including: goals discussed, key decisions made, and pending follow-ups.",
              },
              {
                role: "user",
                content: `Please summarize this conversation:\n\n${formattedMessages
                  .map((m) => `${m.role}: ${m.content}`)
                  .join("\n\n")}`,
              },
            ],
          });
          
          const summary =
            response.choices?.[0]?.message?.content || "Conversation summary";
          const truncatedSummary = summary.substring(0, 1200);
          
          // Update conversation with summary
          await db
            .update(kaiConversations)
            .set({
              summary: truncatedSummary,
              updatedAt:new Date().toISOString(),
            })
            .where(eq(kaiConversations.id, input.conversationId));
          
          return { summary: truncatedSummary };
        } catch (error) {
          console.error("Failed to generate summary:", error);
          return { summary: "Unable to generate summary" };
        }
      }),

    // ── Kai Website Analyzer ──────────────────────────────────────────────
    // Scrape a school website and extract all available information using AI
    analyzeSchoolWebsite: protectedProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');

        // 1. Fetch the website HTML
        let html = '';
        try {
          const res = await fetch(input.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DojoFlow/1.0; +https://dojo-flow.ai)' },
            signal: AbortSignal.timeout(15000),
          });
          html = await res.text();
        } catch (err) {
          throw new Error(`Could not fetch website: ${err instanceof Error ? err.message : String(err)}`);
        }

        // 2. Strip HTML tags and limit to 12k chars for LLM context
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 12000);

        // 2b. Extract JSON-LD schema.org structured data (most reliable source for phone/address)
        let schemaOrgHints = '';
        try {
          const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
          const schemaData: any[] = [];
          for (const block of jsonLdMatches) {
            const inner = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            try {
              const parsed = JSON.parse(inner);
              const items = Array.isArray(parsed) ? parsed : [parsed];
              for (const item of items) {
                if (item['@type'] && (item.telephone || item.address || item.name || item.email || item.url)) {
                  schemaData.push(item);
                }
              }
            } catch { /* ignore malformed JSON-LD */ }
          }
          if (schemaData.length > 0) {
            schemaOrgHints = `\n\nJSON-LD Schema.org structured data found on page:\n${JSON.stringify(schemaData, null, 2).substring(0, 3000)}`;
          }
        } catch { /* non-fatal */ }

        // 2c. Regex fallbacks for phone and address in raw HTML
        let phoneHint = '';
        let addressHint = '';
        try {
          // Phone: look for tel: links or common phone patterns
          const telLinks = html.match(/href=["']tel:([+\d\s().\-]+)["']/gi) || [];
          if (telLinks.length > 0) {
            phoneHint = telLinks[0].replace(/href=["']tel:/i, '').replace(/["']$/, '').trim();
          }
          if (!phoneHint) {
            // Fallback: look for 10-digit US phone patterns in visible text
            const phoneMatch = text.match(/(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
            if (phoneMatch) phoneHint = phoneMatch[0].trim();
          }
          // Address: look for schema.org address patterns or common address patterns
          const addrMatch = text.match(/\d{2,5}\s+[A-Za-z0-9\s.,'#-]{5,60},\s*[A-Za-z\s]{2,30},\s*[A-Z]{2}\s+\d{5}/);
          if (addrMatch) addressHint = addrMatch[0].trim();
        } catch { /* non-fatal */ }

        // 2d. Try to also fetch the /contact page for more data
        let contactPageText = '';
        try {
          const baseUrl2 = new URL(input.url);
          const contactUrl = `${baseUrl2.origin}/contact`;
          const contactRes = await fetch(contactUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DojoFlow/1.0)' },
            signal: AbortSignal.timeout(8000),
          });
          if (contactRes.ok) {
            const contactHtml = await contactRes.text();
            contactPageText = contactHtml
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 4000);
            // Also check contact page for phone
            if (!phoneHint) {
              const telLinksContact = contactHtml.match(/href=["']tel:([+\d\s().\-]+)["']/gi) || [];
              if (telLinksContact.length > 0) {
                phoneHint = telLinksContact[0].replace(/href=["']tel:/i, '').replace(/["']$/, '').trim();
              }
            }
          }
        } catch { /* contact page may not exist, non-fatal */ }

        // 2e. Try to fetch schedule/classes pages for richer class data
        let schedulePageText = '';
        try {
          const baseUrl3 = new URL(input.url);
          // Find schedule/classes links in the homepage HTML first
          const scheduleLinks = (html.match(/href=["']([^"']*(?:schedule|classes|class|programs?|timetable|calendar)[^"']*)["']/gi) || [])
            .map(m => m.replace(/href=["']/i, '').replace(/["']$/, ''))
            .filter(u => !u.startsWith('http') || u.includes(baseUrl3.hostname))
            .map(u => u.startsWith('http') ? u : `${baseUrl3.origin}${u.startsWith('/') ? u : '/' + u}`)
            .filter((u, i, arr) => arr.indexOf(u) === i) // dedupe
            .slice(0, 3);
          // Also try common paths
          const commonPaths = ['/schedule', '/classes', '/programs', '/class-schedule', '/martial-arts-classes', '/about', '/about-us', '/our-story', '/instructors', '/team'];
          const allScheduleUrls = [...new Set([...scheduleLinks, ...commonPaths.map(p => `${baseUrl3.origin}${p}`)])];
          for (const schedUrl of allScheduleUrls.slice(0, 8)) {
            try {
              const schedRes = await fetch(schedUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DojoFlow/1.0)' },
                signal: AbortSignal.timeout(8000),
              });
              if (schedRes.ok) {
                const schedHtml = await schedRes.text();
                const schedText = schedHtml
                  .replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .substring(0, 5000);
                if (schedText.length > 200) {
                  schedulePageText += `\n\n[Page: ${schedUrl}]\n${schedText}`;
                  if (schedulePageText.length > 8000) break; // cap total
                }
              }
            } catch { /* skip failed pages */ }
          }
        } catch { /* non-fatal */ }

        // 3. Also try to find logo/image URLs in the raw HTML
        const base = new URL(input.url);
        const logoHintSet = new Set<string>();
        // a) <img src> with logo/brand/icon in path
        const imgMatches = html.match(/src=["']([^"']*(?:logo|brand|icon|header)[^"']*\.(png|svg|webp|jpg|jpeg))["']/gi) || [];
        imgMatches.forEach(m => {
          const u = m.replace(/src=["']/i, '').replace(/["']$/, '');
          if (u.startsWith('http')) logoHintSet.add(u);
          else if (u.startsWith('/')) logoHintSet.add(`${base.origin}${u}`);
        });
        // b) og:image meta tag
        const ogImg = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        if (ogImg?.[1]) { const u = ogImg[1]; logoHintSet.add(u.startsWith('http') ? u : `${base.origin}${u}`); }
        // c) link rel=icon / apple-touch-icon
        const iconMatches = html.match(/rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/gi) || [];
        iconMatches.forEach(m => {
          const hrefMatch = m.match(/href=["']([^"']+)["']/i);
          if (hrefMatch?.[1]) { const u = hrefMatch[1]; logoHintSet.add(u.startsWith('http') ? u : `${base.origin}${u}`); }
        });
        const logoHints = Array.from(logoHintSet).slice(0, 8);

        // 4. Extract structured data with GPT-4o
        const response = await invokeLLM({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a data extraction assistant for a martial arts school management system. 
Extract all available information from the provided website text and return it as structured JSON. 
Be thorough — extract everything you can find. If a field is not found, use null.
For programs/classes, extract each one as a separate object with name, description, ageRange, and schedule if available.
For schedules, use 24h time format (HH:MM) and standard day names (Monday, Tuesday, etc.).

CRITICAL ADDRESS RULES:
- addressStreet: ONLY the street number and street name (e.g. "123 Main Street"). NEVER include city, state, or zip here.
- addressCity: ONLY the city name (e.g. "New York"). NEVER include state or zip.
- addressState: ONLY the 2-letter state abbreviation or full state name (e.g. "NY" or "New York"). NEVER include city.
- addressPostal: ONLY the zip/postal code (e.g. "10001").
- addressCountry: Country name (e.g. "United States").
- If you see a combined address like "123 Main St, New York, NY 10001", split it correctly into the separate fields.

CRITICAL LOGO RULES:
- logoUrl: Return the BEST logo image URL found. Prefer SVG or PNG over JPG. Prefer URLs containing "logo" in the path.
- Choose from the Logo URL hints provided. If a hint URL contains "logo", "brand", or "icon" in its path, prefer it.
- Return the full absolute URL (starting with https://).
- If no logo is found in the hints, return null.

Return ONLY valid JSON, no markdown, no explanation.`,
            },
            {
              role: 'user',
              content: `Website URL: ${input.url}\n\nWebsite content (homepage):\n${text}${contactPageText ? `\n\nContact page content:\n${contactPageText}` : ''}${schedulePageText ? `\n\nSchedule/Classes page content:${schedulePageText}` : ''}${schemaOrgHints}${phoneHint ? `\n\nPhone number found via tel: link or regex: ${phoneHint}` : ''}${addressHint ? `\n\nAddress found via regex: ${addressHint}` : ''}\n\nLogo URL hints found in HTML: ${logoHints.join(', ') || 'none'}\n\nIMPORTANT:\n- Use the phone number hint and address hint above if the website content does not clearly show them.\n- Prefer structured JSON-LD data over text extraction for phone and address.\n- For classes: extract EVERY individual class session with its day, start time, end time, and name. If a class runs Monday/Wednesday/Friday, create 3 separate class entries (one per day).\n- For instructors: extract full name, bio, rank/certifications, and specialties from the About page content.\n- For the school description/about: capture the school's history, mission, and story in the \"about\" field.\n\nExtract all school information and return as JSON with this exact structure:\n{
  "schoolName": string | null,
  "displayName": string | null,
  "tagline": string | null,
  "phone": string | null,
  "email": string | null,
  "website": string | null,
  "addressStreet": string | null,
  "addressCity": string | null,
  "addressState": string | null,
  "addressPostal": string | null,
  "addressCountry": string | null,
  "logoUrl": string | null,
  "brandColorPrimary": string | null,
  "timezone": string | null,
  "programs": [
    {
      "name": string,
      "description": string | null,
      "ageRange": string | null,
      "price": number | null,
      "billing": "monthly" | "weekly" | "per_session" | "one_time" | null
    }
  ],
  "classes": [
    {
      "name": string,
      "instructor": string | null,
      "dayOfWeek": string | null,
      "startTime": string | null,
      "endTime": string | null,
      "program": string | null,
      "level": string | null
    }
  ],
  "instructors": [
    {
      "name": string,
      "bio": string | null,
      "specialties": string | null,
      "certifications": string | null
    }
  ],
  "about": string | null,
  "socialLinks": {
    "facebook": string | null,
    "instagram": string | null,
    "youtube": string | null,
    "twitter": string | null
  },
  "confidence": {
    "overall": "high" | "medium" | "low",
    "notes": string
  }
}`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        let extracted: any = {};
        try {
          // Get raw content — handle both OpenAI choices format and direct content
          let raw: string = (
            response.choices?.[0]?.message?.content ||
            (response as any).content ||
            (response as any).text ||
            '{}'
          ).trim();
          // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
          if (raw.startsWith('```')) {
            raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          }
          // Strategy 1: direct parse
          try {
            extracted = JSON.parse(raw);
          } catch {
            // Strategy 2: extract first JSON object from the string
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                extracted = JSON.parse(jsonMatch[0]);
              } catch {
                // Strategy 3: return minimal object so we don't hard-fail
                console.error('[analyzeSchoolWebsite] All JSON parse strategies failed. Raw:', raw.substring(0, 300));
                extracted = { schoolName: null, phone: null, email: null, programs: [], classes: [], instructors: [], socialLinks: {} };
              }
            } else {
              console.error('[analyzeSchoolWebsite] No JSON found in response. Raw:', raw.substring(0, 300));
              extracted = { schoolName: null, phone: null, email: null, programs: [], classes: [], instructors: [], socialLinks: {} };
            }
          }
        } catch (parseErr) {
          console.error('[analyzeSchoolWebsite] Outer parse error:', parseErr);
          extracted = { schoolName: null, phone: null, email: null, programs: [], classes: [], instructors: [], socialLinks: {} };
        }

        // Resolve relative logo URLs to absolute
        if (extracted.logoUrl && extracted.logoUrl.startsWith('/')) {
          const baseUrl = new URL(input.url);
          extracted.logoUrl = `${baseUrl.origin}${extracted.logoUrl}`;
        }

        // Download logo and upload to S3 so we have a permanent hosted copy
        if (extracted.logoUrl && extracted.logoUrl.startsWith('http')) {
          try {
            const { storagePut } = await import('./storage');
            const logoRes = await fetch(extracted.logoUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DojoFlow/1.0)' },
              signal: AbortSignal.timeout(10000),
            });
            if (logoRes.ok) {
              const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
              const contentType = logoRes.headers.get('content-type') || 'image/png';
              const ext = contentType.includes('svg') ? 'svg' : contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : 'jpg';
              const orgId = ctx.currentOrganizationId;
              const logoKey = `logos/org-${orgId}/website-scan-${Date.now()}.${ext}`;
              const { url: s3Url } = await storagePut(logoKey, logoBuffer, contentType);
              extracted.logoUrl = s3Url;
              console.log('[analyzeSchoolWebsite] Logo uploaded to S3:', s3Url);
            }
          } catch (logoErr) {
            console.warn('[analyzeSchoolWebsite] Logo download/upload failed (non-fatal):', logoErr);
            // Keep the original URL as fallback
          }
        }

        return {
          success: true,
          url: input.url,
          data: extracted,
        };
      }),

    // Save the analyzed website data into the DB
    populateSchoolFromWebsite: protectedProcedure
      .input(z.object({
        schoolName: z.string().optional(),
        displayName: z.string().optional(),
        tagline: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        addressStreet: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().optional(),
        addressPostal: z.string().optional(),
        addressCountry: z.string().optional(),
        logoUrl: z.string().optional(),
        brandColorPrimary: z.string().optional(),
        timezone: z.string().optional(),
        programs: z.array(z.object({
          name: z.string(),
          description: z.string().nullish(),
          ageRange: z.string().nullish(),
          price: z.number().nullish(),
          billing: z.enum(['monthly','weekly','per_session','one_time']).nullish(),
        })).optional(),
        classes: z.array(z.object({
          name: z.string(),
          instructor: z.string().nullish(),
          dayOfWeek: z.string().nullish(),
          startTime: z.string().nullish(),
          endTime: z.string().nullish(),
          program: z.string().nullish(),
          level: z.string().nullish(),
        })).optional(),
        instructors: z.array(z.object({
          name: z.string(),
          bio: z.string().nullish(),
          specialties: z.string().nullish(),
          certifications: z.string().nullish(),
        })).optional(),
        about: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const {
          organizations, schoolProfiles, programs: programsTable,
          classes: classesTable, ownerProfiles,
        } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;

        const results: string[] = [];

        // 1. Update organizations table
        const orgUpdate: Record<string, any> = {};
        if (input.schoolName) orgUpdate.name = input.schoolName;
        if (input.addressStreet) orgUpdate.address = input.addressStreet;
        if (input.addressCity) orgUpdate.city = input.addressCity;
        if (input.addressState) orgUpdate.state = input.addressState;
        if (input.addressPostal) orgUpdate.zipCode = input.addressPostal;
        if (input.timezone) orgUpdate.timezone = input.timezone;
        if (input.logoUrl) orgUpdate.logoUrl = input.logoUrl;
        if (input.brandColorPrimary) orgUpdate.brandColor = input.brandColorPrimary;
        if (Object.keys(orgUpdate).length > 0) {
          await db.update(organizations).set(orgUpdate).where(eq(organizations.id, orgId));
          results.push(`Updated organization: ${Object.keys(orgUpdate).join(', ')}`);
        }

        // 2. Upsert school_profiles
        const profileUpdate: Record<string, any> = {};
        if (input.schoolName) profileUpdate.schoolName = input.schoolName;
        if (input.displayName) profileUpdate.displayName = input.displayName;
        if (input.tagline) profileUpdate.tagline = input.tagline;
        if (input.phone) profileUpdate.phone = input.phone;
        if (input.email) profileUpdate.email = input.email;
        if (input.website) profileUpdate.website = input.website;
        if (input.addressStreet) profileUpdate.addressStreet = input.addressStreet;
        if (input.addressCity) profileUpdate.addressCity = input.addressCity;
        if (input.addressState) profileUpdate.addressState = input.addressState;
        if (input.addressPostal) profileUpdate.addressPostal = input.addressPostal;
        if (input.addressCountry) profileUpdate.addressCountry = input.addressCountry;
        if (input.logoUrl) {
          // Save to all 4 logo slots so all contexts (light/dark, full/icon) show the scanned logo
          profileUpdate.logoLightUrl = input.logoUrl;
          profileUpdate.logoDarkUrl = input.logoUrl;
          profileUpdate.logoIconLightUrl = input.logoUrl;
          profileUpdate.logoIconDarkUrl = input.logoUrl;
        }
        if (input.brandColorPrimary) profileUpdate.brandColorPrimary = input.brandColorPrimary;
        if (input.timezone) profileUpdate.timezone = input.timezone;
        if (input.about) profileUpdate.about = input.about;

        if (Object.keys(profileUpdate).length > 0) {
          const existing = await db.select({ id: schoolProfiles.id })
            .from(schoolProfiles).where(eq(schoolProfiles.organizationId, orgId)).limit(1);
          if (existing.length > 0) {
            await db.update(schoolProfiles).set(profileUpdate).where(eq(schoolProfiles.organizationId, orgId));
          } else {
            await db.insert(schoolProfiles).values({ organizationId: orgId, schoolName: input.schoolName || 'My School', ...profileUpdate });
          }
          results.push(`Updated school profile: ${Object.keys(profileUpdate).join(', ')}`);
        }

        // 3. Insert programs
        if (input.programs && input.programs.length > 0) {
          for (const prog of input.programs) {
            await db.insert(programsTable).values({
              organizationId: orgId,
              name: prog.name,
              description: prog.description || null,
              ageRange: prog.ageRange || null,
              price: prog.price ? Math.round(prog.price * 100) : null,
              billing: prog.billing || null,
              type: 'membership',
              isActive: 1,
            }).onDuplicateKeyUpdate({ set: { description: prog.description || null } });
          }
          results.push(`Inserted/updated ${input.programs.length} programs`);
        }

        // 4. Insert classes
        if (input.classes && input.classes.length > 0) {
          for (const cls of input.classes) {
            await db.insert(classesTable).values({
              organizationId: orgId,
              name: cls.name,
              instructor: cls.instructor || null,
              dayOfWeek: cls.dayOfWeek || null,
              startTime: cls.startTime || null,
              endTime: cls.endTime || null,
              program: cls.program || null,
              level: cls.level || null,
              time: cls.startTime || '00:00',
              isActive: 1,
            });
          }
          results.push(`Inserted ${input.classes.length} classes`);
        }

        // 5. Insert instructors as owner profiles
        if (input.instructors && input.instructors.length > 0) {
          for (const inst of input.instructors) {
            const existing = await db.select({ id: ownerProfiles.id })
              .from(ownerProfiles)
              .where(eq(ownerProfiles.organizationId, orgId))
              .limit(1);
            if (existing.length === 0) {
              await db.insert(ownerProfiles).values({
                organizationId: orgId,
                name: inst.name,
                bio: inst.bio || null,
                specialties: inst.specialties || null,
                certifications: inst.certifications || null,
              });
            }
          }
          results.push(`Processed ${input.instructors.length} instructors`);
        }

        return { success: true, results };
      }),

  // Subscription and credits management
  // Dojo Settings API
  settings: router({
    getSettings: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get settings (single row with id=1)
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          // Return default empty settings if none exist
          return {
            schoolName: '',
            contactEmail: '',
            contactPhone: '',
            website: '',
            timezone: 'America/New_York',
            instructorTitle: '',
            instructorFirstName: '',
            instructorLastName: '',
            martialArtsStyle: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
            weatherApiKey: '',
            enableWeatherAlerts: 1,
            hasOutdoorClasses: 0,
            heatIndexThreshold: 95,
            airQualityThreshold: 150,
            paymentProvider: '',
            stripeApiKey: '',
            stripePublishableKey: '',
            stripeWebhookSecret: '',
            squareAccessToken: '',
            squareLocationId: '',
            setupCompleted: 0,
          };
        }
        
        return result[0];
      }),
    
    // Alias for getSettings (used by auth system)
    getDojoSettings: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        try {
          // Only query the setupCompleted column to avoid schema mismatch errors
          // This is the only field needed for auth flow
          const result = await db.select({
            id: dojoSettings.id,
            setupCompleted: dojoSettings.setupCompleted,
          }).from(dojoSettings).limit(1);
          
          if (result.length === 0) {
            return { setupCompleted: 0 };
          }
          
          return result[0];
        } catch (error) {
          console.error('Error fetching dojo settings:', error);
          // If there's a database error, assume setup is completed to avoid
          // blocking returning users with a setup wizard
          return { setupCompleted: 1 };
        }
      }),
    
    updateSettings: publicProcedure
      .input(z.object({
        schoolName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        website: z.string().optional(),
        timezone: z.string().optional(),
        instructorTitle: z.string().optional(),
        instructorFirstName: z.string().optional(),
        instructorLastName: z.string().optional(),
        martialArtsStyle: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        weatherApiKey: z.string().optional(),
        enableWeatherAlerts: z.number().optional(),
        hasOutdoorClasses: z.number().optional(),
        heatIndexThreshold: z.number().optional(),
        airQualityThreshold: z.number().optional(),
        paymentProvider: z.string().optional(),
        stripeApiKey: z.string().optional(),
        stripePublishableKey: z.string().optional(),
        stripeWebhookSecret: z.string().optional(),
        squareAccessToken: z.string().optional(),
        squareLocationId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if settings exist
        const existing = await db.select().from(dojoSettings).limit(1);
        
        if (existing.length === 0) {
          // Create new settings row
          await db.insert(dojoSettings).values({
            ...input,
            setupCompleted: 0,
          });
        } else {
          // Update existing settings
          await db.update(dojoSettings)
            .set({
              ...input,
              updatedAt:new Date().toISOString(),
            });
        }
        
        return {
          success: true,
          message: 'Settings updated successfully'
        };
      }),
    
    completeSetup: publicProcedure
      .mutation(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Mark setup as completed
        await db.update(dojoSettings)
          .set({
            setupCompleted: 1,
            updatedAt:new Date().toISOString(),
          });
        
        return {
          success: true,
          message: 'Setup completed successfully'
        };
      }),
    
    getSetupStatus: publicProcedure
      .query(async () => {
        const { getDb } = await import("./db");
        const { dojoSettings } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.select().from(dojoSettings).limit(1);
        
        if (result.length === 0) {
          return { completed: false };
        }
        
        return { completed: result[0].setupCompleted === 1 };
      }),

    // Widget API Key management
    getWidgetKey: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { organizations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization found');
        const rows = await db.select({ widgetApiKey: organizations.widgetApiKey })
          .from(organizations).where(eq(organizations.id, orgId)).limit(1);
        return { widgetApiKey: rows[0]?.widgetApiKey ?? null, organizationId: orgId };
      }),

    // Kai voice preference
    getKaiVoice: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { organizations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        const rows = await db.select({ settings: organizations.settings })
          .from(organizations).where(eq(organizations.id, orgId)).limit(1);
        let parsed: any = {};
        try { parsed = JSON.parse(rows[0]?.settings || '{}'); } catch {}
        return { voiceGender: (parsed.kaiVoiceGender as string) || 'female' };
      }),

    setKaiVoice: protectedProcedure
      .input(z.object({ voiceGender: z.enum(['male', 'female']) }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { organizations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        const rows = await db.select({ settings: organizations.settings })
          .from(organizations).where(eq(organizations.id, orgId)).limit(1);
        let parsed: any = {};
        try { parsed = JSON.parse(rows[0]?.settings || '{}'); } catch {}
        parsed.kaiVoiceGender = input.voiceGender;
        await db.update(organizations)
          .set({ settings: JSON.stringify(parsed) })
          .where(eq(organizations.id, orgId));
        return { success: true, voiceGender: input.voiceGender };
      }),

    regenerateWidgetKey: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { organizations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const crypto = await import("crypto");
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization found');
        const newKey = 'djf_' + crypto.randomBytes(24).toString('hex');
        await db.update(organizations).set({ widgetApiKey: newKey }).where(eq(organizations.id, orgId));
        return { widgetApiKey: newKey };
      }),

    // Named API Keys management (multiple keys per org with labels)
    listApiKeys: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { organizations } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization found');
        const rows = await db.select({ settings: organizations.settings, widgetApiKey: organizations.widgetApiKey })
          .from(organizations).where(eq(organizations.id, orgId)).limit(1);
        let parsed: any = {};
        try { parsed = JSON.parse(rows[0]?.settings || '{}'); } catch {}
        const namedKeys: Array<{ id: string; label: string; key: string; createdAt: string }> = parsed.apiKeys || [];
        const primaryKey = rows[0]?.widgetApiKey;
        return { primaryKey, namedKeys };
      }),

    createApiKey: protectedProcedure
      .input(z.object({ label: z.string().min(1).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { organizations } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const crypto = await import('crypto');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization found');
        const rows = await db.select({ settings: organizations.settings })
          .from(organizations).where(eq(organizations.id, orgId)).limit(1);
        let parsed: any = {};
        try { parsed = JSON.parse(rows[0]?.settings || '{}'); } catch {}
        const namedKeys: Array<{ id: string; label: string; key: string; createdAt: string }> = parsed.apiKeys || [];
        if (namedKeys.length >= 10) throw new Error('Maximum of 10 API keys allowed per organization');
        const newEntry = {
          id: crypto.randomBytes(8).toString('hex'),
          label: input.label,
          key: 'djf_' + crypto.randomBytes(24).toString('hex'),
          createdAt: new Date().toISOString(),
        };
        namedKeys.push(newEntry);
        parsed.apiKeys = namedKeys;
        await db.update(organizations).set({ settings: JSON.stringify(parsed) }).where(eq(organizations.id, orgId));
        return newEntry;
      }),

    revokeApiKey: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { organizations } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('No organization found');
        const rows = await db.select({ settings: organizations.settings })
          .from(organizations).where(eq(organizations.id, orgId)).limit(1);
        let parsed: any = {};
        try { parsed = JSON.parse(rows[0]?.settings || '{}'); } catch {}
        const namedKeys: Array<{ id: string }> = parsed.apiKeys || [];
        parsed.apiKeys = namedKeys.filter((k) => k.id !== input.id);
        await db.update(organizations).set({ settings: JSON.stringify(parsed) }).where(eq(organizations.id, orgId));
        return { success: true };
      }),
  }),

  // Student Portal Router
  studentPortal: router({
    // Self-registration for new students
    register: publicProcedure
      .input(z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().min(1, "Phone number is required"),
        dateOfBirth: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        programs: z.array(z.string()).optional(),
        experienceLevel: z.string().optional(),
        howDidYouHear: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createStudent, getStudentByEmail } = await import("./db");
        
        // Check if email already exists
        const existing = await getStudentByEmail(input.email);
        if (existing?.student) {
          throw new Error("An account with this email already exists. Please login instead.");
        }
        
        // Create the new student
        const newStudent = await createStudent({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zipCode: input.zipCode || null,
          status: "trial",
          notes: `Self-registered. Programs: ${input.programs?.join(", ") || "None selected"}. Experience: ${input.experienceLevel || "Not specified"}. Source: ${input.howDidYouHear || "Not specified"}`,
        });
        
        return {
          success: true,
          student: newStudent,
          message: "Registration successful! We will contact you shortly to schedule your first class.",
        };
      }),

    // Request password reset
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const { getStudentByEmail, createPasswordResetToken, getStudentById } = await import("./db");
        
        // Find student by email
        const studentData = await getStudentByEmail(input.email);
        if (!studentData || !studentData.student) {
          // Don't reveal if email exists for security
          return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
        }
        
        // Create reset token
        const tokenData = await createPasswordResetToken(studentData.student.id);
        if (!tokenData) {
          return { success: false, error: "Failed to create reset token" };
        }
        
        // In production, send email here. For demo, return the token.
        // The token would be sent via email with a link like:
        // /student-reset-password?token=xxx
        console.log(`Password reset token for ${input.email}: ${tokenData.token}`);
        
        return {
          success: true,
          message: "If an account exists with this email, you will receive a password reset link.",
          // For demo purposes only - remove in production
          _demoToken: tokenData.token,
          _demoExpiresAt: tokenData.expiresAt,
        };
      }),

    // Validate reset token
    validateResetToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        const { validateResetToken, getStudentById } = await import("./db");
        
        const validation = await validateResetToken(input.token);
        if (!validation.valid || !validation.studentId) {
          return { valid: false, error: validation.error };
        }
        
        // Get student info for display
        const student = await getStudentById(validation.studentId);
        
        return {
          valid: true,
          studentEmail: student?.email,
          studentName: student?.firstName,
        };
      }),

    // Reset password with token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        const { resetStudentPassword } = await import("./db");
        return await resetStudentPassword(input.token, input.newPassword);
      }),

    // Login endpoint
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { verifyStudentLogin } = await import("./db");
        return await verifyStudentLogin(input.email, input.password);
      }),

    // Get student dashboard data
    getDashboardData: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentPortalData } = await import("./db");
        const data = await getStudentPortalData(input.studentId);
        if (!data) {
          throw new Error('Student not found');
        }
        return data;
      }),

    // Get student by email (for login lookup)
    getByEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .query(async ({ input }) => {
        const { getStudentByEmail } = await import("./db");
        return await getStudentByEmail(input.email);
      }),

    // Get attendance history
    getAttendanceHistory: publicProcedure
      .input(z.object({
        studentId: z.number(),
        limit: z.number().optional().default(30),
      }))
      .query(async ({ input }) => {
        const { getStudentAttendanceHistory } = await import("./db");
        return await getStudentAttendanceHistory(input.studentId, input.limit);
      }),

    // Get upcoming classes for a student
    getUpcomingClasses: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments, classes } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const enrollments = await db.select({
          enrollment: classEnrollments,
          class: classes
        })
          .from(classEnrollments)
          .leftJoin(classes, eq(classEnrollments.classId, classes.id))
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.status, 'active')
          ));
        
        return enrollments.map(e => ({
          id: e.class?.id,
          name: e.class?.name,
          time: e.class?.time,
          dayOfWeek: e.class?.dayOfWeek,
          instructor: e.class?.instructor,
          enrollmentId: e.enrollment.id
        })).filter(c => c.id);
      }),

    // Enroll student in a class
    enrollInClass: publicProcedure
      .input(z.object({
        studentId: z.number(),
        classId: z.number(),
        smsRemindersEnabled: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments, classes, students } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Check if already enrolled
        const existing = await db.select()
          .from(classEnrollments)
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.classId, input.classId),
            eq(classEnrollments.status, 'active')
          ))
          .limit(1);
        
        if (existing.length > 0) {
          return { success: false, message: 'Student is already enrolled in this class' };
        }
        
        // Create enrollment
        await db.insert(classEnrollments).values({
          studentId: input.studentId,
          classId: input.classId,
          smsRemindersEnabled: input.smsRemindersEnabled ? 1 : 0,
          status: 'active',
        });
        
        return { success: true, message: 'Student enrolled successfully' };
      }),

    // Unenroll student from a class
    unenrollFromClass: publicProcedure
      .input(z.object({
        studentId: z.number(),
        classId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { classEnrollments } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Update enrollment status to cancelled
        await db.update(classEnrollments)
          .set({ status: 'cancelled' })
          .where(and(
            eq(classEnrollments.studentId, input.studentId),
            eq(classEnrollments.classId, input.classId)
          ));
        
        return { success: true, message: 'Student unenrolled successfully' };
      }),

    // Record check-in and update belt progress
    checkIn: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb, updateBeltProgressAfterCheckIn } = await import("./db");
        const { students, kioskCheckIns } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get student info
        const student = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        
        if (student.length === 0) {
          return { success: false, message: 'Student not found' };
        }
        
        // Record check-in
        const fullName = `${student[0].firstName} ${student[0].lastName}`;
        await db.insert(kioskCheckIns).values({
          studentId: input.studentId,
          studentName: fullName,
          timestamp:new Date().toISOString(),
        });
        
        // Update belt progress
        await updateBeltProgressAfterCheckIn(input.studentId);
        
        return {
          success: true,
          message: `Checked in ${fullName}`,
          student: student[0]
        };
      }),

    // Create student account
    createAccount: publicProcedure
      .input(z.object({
        studentId: z.number(),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const { createStudentAccount } = await import("./db");
        const bcrypt = await import("bcryptjs");
        
        const passwordHash = await bcrypt.hash(input.password, 10);
        return await createStudentAccount(input.studentId, input.email, passwordHash);
      }),

    // ============================================
    // Belt Test Procedures
    // ============================================

    // Get upcoming belt tests for student's next belt level
    getUpcomingBeltTests: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb, getUpcomingBeltTests } = await import("./db");
        const { beltProgress } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) return { tests: [], nextBelt: null };
        
        // Get student's next belt
        const progress = await db.select().from(beltProgress).where(eq(beltProgress.studentId, input.studentId)).limit(1);
        if (progress.length === 0) {
          return { tests: [], nextBelt: null };
        }
        
        const nextBelt = progress[0].nextBelt;
        const tests = await getUpcomingBeltTests(nextBelt);
        
        return { tests, nextBelt, currentProgress: progress[0] };
      }),

    // Check eligibility for a specific belt test
    checkBeltTestEligibility: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .query(async ({ input }) => {
        const { checkBeltTestEligibility } = await import("./db");
        return await checkBeltTestEligibility(input.studentId, input.testId);
      }),

    // Register for a belt test
    registerForBeltTest: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { registerForBeltTest } = await import("./db");
        return await registerForBeltTest(input.studentId, input.testId);
      }),

    // Cancel belt test registration
    cancelBeltTestRegistration: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { cancelBeltTestRegistration } = await import("./db");
        return await cancelBeltTestRegistration(input.studentId, input.testId);
      }),

    // Get student's belt test registrations
    getMyBeltTestRegistrations: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentBeltTestRegistrations } = await import("./db");
        return await getStudentBeltTestRegistrations(input.studentId);
      }),

    // Create Stripe checkout session for belt test payment
    createBeltTestPayment: publicProcedure
      .input(z.object({
        studentId: z.number(),
        testId: z.number(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { checkBeltTestEligibility, getDb } = await import("./db");
        const { createBeltTestCheckoutSession } = await import("./stripe");
        const { students, beltTests, beltProgress, beltTestRegistrations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        // Check eligibility first
        const eligibility = await checkBeltTestEligibility(input.studentId, input.testId);
        if (!eligibility.eligible) {
          return { success: false, error: eligibility.reason };
        }
        
        const db = await getDb();
        if (!db) return { success: false, error: 'Database not available' };
        
        // Get student info
        const studentResult = await db.select().from(students).where(eq(students.id, input.studentId)).limit(1);
        if (studentResult.length === 0) {
          return { success: false, error: 'Student not found' };
        }
        const student = studentResult[0];
        
        // Get test info
        const testResult = await db.select().from(beltTests).where(eq(beltTests.id, input.testId)).limit(1);
        if (testResult.length === 0) {
          return { success: false, error: 'Belt test not found' };
        }
        const test = testResult[0];
        
        // Get belt progress
        const progressResult = await db.select().from(beltProgress).where(eq(beltProgress.studentId, input.studentId)).limit(1);
        const progress = progressResult[0];
        
        // Check if test is free
        if (!test.fee || test.fee === 0) {
          // Free registration - register directly
          await db.insert(beltTestRegistrations).values({
            testId: input.testId,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            currentBelt: progress?.currentBelt || 'White',
            attendanceAtRegistration: progress?.qualifiedAttendance || 0,
            classesAtRegistration: progress?.qualifiedClasses || 0,
            status: 'registered',
            paymentStatus: 'waived',
            amountPaid: 0,
          });
          
          // Update test registration count
          await db.update(beltTests)
            .set({ 
              currentRegistrations: test.currentRegistrations + 1,
              updatedAt:new Date().toISOString()
            })
            .where(eq(beltTests.id, input.testId));
          
          return { success: true, free: true };
        }
        
        // Create Stripe checkout session
        try {
          const session = await createBeltTestCheckoutSession({
            testId: input.testId,
            testName: test.name,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            studentEmail: student.email || '',
            amount: test.fee,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
          });
          
          // Create pending registration
          await db.insert(beltTestRegistrations).values({
            testId: input.testId,
            studentId: input.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            currentBelt: progress?.currentBelt || 'White',
            attendanceAtRegistration: progress?.qualifiedAttendance || 0,
            classesAtRegistration: progress?.qualifiedClasses || 0,
            status: 'registered',
            paymentStatus: 'pending',
            stripeSessionId: session.id,
            amountPaid: test.fee,
          });
          
          // Update test registration count
          await db.update(beltTests)
            .set({ 
              currentRegistrations: test.currentRegistrations + 1,
              updatedAt:new Date().toISOString()
            })
            .where(eq(beltTests.id, input.testId));
          
          return { 
            success: true, 
            checkoutUrl: session.url,
            sessionId: session.id
          };
        } catch (error: any) {
          console.error('Stripe checkout error:', error);
          return { success: false, error: error.message || 'Payment processing failed' };
        }
      }),

    // Verify payment completion
    verifyBeltTestPayment: publicProcedure
      .input(z.object({
        sessionId: z.string(),
      }))
      .query(async ({ input }) => {
        const { getCheckoutSession } = await import("./stripe");
        const { getDb } = await import("./db");
        const { beltTestRegistrations } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        try {
          const session = await getCheckoutSession(input.sessionId);
          
          if (session.payment_status === 'paid') {
            // Update registration payment status
            const db = await getDb();
            if (db) {
              await db.update(beltTestRegistrations)
                .set({ 
                  paymentStatus: 'paid',
                  stripePaymentIntentId: session.payment_intent as string,
                  updatedAt:new Date().toISOString()
                })
                .where(eq(beltTestRegistrations.stripeSessionId, input.sessionId));
            }
            
            return { success: true, paid: true };
          }
          
          return { success: true, paid: false, status: session.payment_status };
        } catch (error: any) {
          console.error('Payment verification error:', error);
          return { success: false, error: error.message };
        }
      }),

    // ============================================
    // Messaging Procedures
    // ============================================

    // Get all messages for a student
    getMessages: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentMessages } = await import("./db");
        return await getStudentMessages(input.studentId);
      }),

    // Get a single message with thread
    getMessage: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getStudentMessageById, getMessageThread, markMessageAsRead } = await import("./db");
        
        // Mark as read
        await markMessageAsRead(input.messageId, input.studentId);
        
        // Get message and thread
        const message = await getStudentMessageById(input.messageId, input.studentId);
        const thread = await getMessageThread(input.messageId, input.studentId);
        
        return { message, thread };
      }),

    // Send a message (from student)
    sendMessage: publicProcedure
      .input(z.object({
        studentId: z.number(),
        subject: z.string().optional(),
        content: z.string().min(1),
        parentMessageId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendStudentMessage } = await import("./db");
        return await sendStudentMessage(input);
      }),

    // Get unread message count
    getUnreadCount: publicProcedure
      .input(z.object({
        studentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getUnreadMessageCount } = await import("./db");
        return await getUnreadMessageCount(input.studentId);
      }),

    // Mark message as read
    markAsRead: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { markMessageAsRead } = await import("./db");
        return await markMessageAsRead(input.messageId, input.studentId);
      }),

    // Delete a message (only student's own messages)
    deleteMessage: publicProcedure
      .input(z.object({
        messageId: z.number(),
        studentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { deleteStudentMessage } = await import("./db");
        return await deleteStudentMessage(input.messageId, input.studentId);
      }),
  }),

  // Schedule extractor router for parsing uploaded class schedules
  scheduleExtractor: router({
    // Extract schedule from uploaded file - robust parser with column detection
    extractSchedule: orgScopedProcedure
      .input(z.object({
        fileUrl: z.string().optional(),
        storageKey: z.string().optional(),
        fileType: z.string(),
        fileName: z.string(),
        columnMapping: z.object({
          name: z.number().optional(),
          day: z.number().optional(),
          startTime: z.number().optional(),
          endTime: z.number().optional(),
          instructor: z.number().optional(),
          room: z.number().optional(),
          level: z.number().optional(),
          capacity: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const xlsx = await import('xlsx');
        const { storageGetBuffer } = await import('./storage');
        
        // Helper function to normalize column names for matching
        const normalizeHeader = (h: string): string => {
          return h.toLowerCase().replace(/[^a-z0-9]/g, '');
        };
        
        // Column name variations for auto-detection (ordered by specificity - most specific first)
        // Use exact match patterns to avoid false positives (e.g., 'classid' matching 'class')
        const columnPatterns = {
          name: ['classname', 'programname', 'coursename', 'title', 'program', 'course', 'class', 'name'],
          day: ['dayofweek', 'weekday', 'days', 'day', 'schedule'],
          startTime: ['starttime', 'begintime', 'timefrom', 'start', 'begin', 'from'],
          endTime: ['endtime', 'finishtime', 'timeto', 'end', 'finish', 'to'],
          instructor: ['instructor', 'teacher', 'coach', 'staff', 'sensei', 'professor'],
          room: ['room', 'location', 'mat', 'studio', 'area', 'place'],
          level: ['level', 'difficulty', 'skilllevel', 'skill', 'grade', 'agerange'],
          capacity: ['maxcapacity', 'maxstudents', 'capacity', 'max', 'spots', 'size'],
        };
        
        // Columns to exclude from name detection (IDs, codes, etc.)
        const excludeFromName = ['classid', 'id', 'code', 'number', 'agerange'];
        
        // Helper to parse time strings
        const parseTime = (timeStr: string): string | null => {
          if (!timeStr) return null;
          const str = String(timeStr).trim();
          
          // Handle Excel time serial numbers (e.g., 0.6666666666666666 = 4:00 PM)
          if (!isNaN(Number(str)) && Number(str) < 1) {
            const totalMinutes = Math.round(Number(str) * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          
          // Try various time formats
          const patterns = [
            /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i,
            /^(\d{1,2})(am|pm)$/i,
            /^(\d{1,2})\s*(am|pm)$/i,
          ];
          
          for (const pattern of patterns) {
            const match = str.match(pattern);
            if (match) {
              let hours = parseInt(match[1]);
              const minutes = match[2] && !isNaN(parseInt(match[2])) ? parseInt(match[2]) : 0;
              const ampm = (match[3] || match[2] || '').toLowerCase();
              
              if (ampm === 'pm' && hours < 12) hours += 12;
              if (ampm === 'am' && hours === 12) hours = 0;
              
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
          }
          
          // Try 24-hour format
          const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
          if (match24) {
            return `${match24[1].padStart(2, '0')}:${match24[2]}`;
          }
          
          return null;
        };
        
        // Helper to normalize day names
        const normalizeDay = (dayStr: string): string | null => {
          if (!dayStr) return null;
          const str = String(dayStr).toLowerCase().trim();
          const dayMap: Record<string, string> = {
            'mon': 'Mon', 'monday': 'Mon', 'm': 'Mon',
            'tue': 'Tue', 'tuesday': 'Tue', 'tues': 'Tue', 't': 'Tue',
            'wed': 'Wed', 'wednesday': 'Wed', 'w': 'Wed',
            'thu': 'Thu', 'thursday': 'Thu', 'thurs': 'Thu', 'th': 'Thu',
            'fri': 'Fri', 'friday': 'Fri', 'f': 'Fri',
            'sat': 'Sat', 'saturday': 'Sat', 's': 'Sat',
            'sun': 'Sun', 'sunday': 'Sun', 'su': 'Sun',
          };
          return dayMap[str] || null;
        };
        
        try {
          let arrayBuffer: ArrayBuffer;
          
          // Try to read from storage key first (more reliable), then fall back to URL
          if (input.storageKey) {
            try {
              console.log('[Schedule Extract] Reading from storage key:', input.storageKey);
              arrayBuffer = await storageGetBuffer(input.storageKey);
              console.log('[Schedule Extract] Got buffer, size:', arrayBuffer.byteLength);
            } catch (storageError: any) {
              console.error('[Schedule Extract] Storage read failed, trying URL:', storageError);
              // Fall back to URL if storage key fails
              if (input.fileUrl) {
                const response = await fetch(input.fileUrl);
                if (!response.ok) {
                  return { success: false, classes: [], confidence: 0, error: `Failed to fetch file: ${response.status} ${response.statusText}`, errorType: 'file_access' };
                }
                arrayBuffer = await response.arrayBuffer();
              } else {
                return { success: false, classes: [], confidence: 0, error: `Storage read failed: ${storageError.message}`, errorType: 'file_access' };
              }
            }
          } else if (input.fileUrl) {
            // Fetch from URL
            console.log('[Schedule Extract] Fetching from URL:', input.fileUrl);
            const response = await fetch(input.fileUrl);
            if (!response.ok) {
              return { success: false, classes: [], confidence: 0, error: `Failed to fetch file: ${response.status} ${response.statusText}`, errorType: 'file_access' };
            }
            arrayBuffer = await response.arrayBuffer();
          } else {
            return { success: false, classes: [], confidence: 0, error: 'No file URL or storage key provided', errorType: 'missing_input' };
          }
          
          console.log('[Schedule Extract] Parsing workbook...');
          const workbook = xlsx.read(arrayBuffer, { type: 'array' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with raw values
          const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
          
          console.log('[Schedule Extract] Sheet:', sheetName, 'Rows:', data.length);
          
          if (data.length < 2) {
            return { 
              success: false, 
              classes: [], 
              confidence: 0, 
              error: 'File appears to be empty or has no data rows', 
              rawHeaders: data[0] || [],
              errorType: 'empty_file'
            };
          }
          
          // Extract and normalize headers
          const rawHeaders = (data[0] || []).map(h => String(h || '').trim());
          const normalizedHeaders = rawHeaders.map(normalizeHeader);
          
          console.log('[Schedule Extract] Headers:', rawHeaders);
          
          // DETECT GRID-BASED SCHEDULE FORMAT
          // Grid format: First column = Time, other columns = Days of week with class names in cells
          const isGridFormat = () => {
            if (data.length < 2) return false;
            const firstCol = rawHeaders[0]?.toLowerCase() || '';
            const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            
            // Check if first column looks like time and other columns are day names
            const isTimeColumn = /time|start|hour|slot/i.test(firstCol);
            const otherHeadersAreDays = rawHeaders.slice(1).filter(h => h).every(h => {
              const normalized = h.toLowerCase();
              return dayNames.some(day => normalized.includes(day));
            });
            
            return isTimeColumn && otherHeadersAreDays && rawHeaders.slice(1).filter(h => h).length >= 3;
          };
          
          // If grid format detected, parse it differently
          if (isGridFormat()) {
            console.log('[Schedule Extract] Detected GRID-BASED format');
            
            const classes: any[] = [];
            const dayColumns: Record<number, string> = {};
            
            // Map column indices to day names
            for (let i = 1; i < rawHeaders.length; i++) {
              const dayName = rawHeaders[i]?.toLowerCase() || '';
              const dayMap: Record<string, string> = {
                'monday': 'Monday', 'mon': 'Monday', 'm': 'Monday',
                'tuesday': 'Tuesday', 'tue': 'Tuesday', 'tues': 'Tuesday', 't': 'Tuesday',
                'wednesday': 'Wednesday', 'wed': 'Wednesday', 'w': 'Wednesday',
                'thursday': 'Thursday', 'thu': 'Thursday', 'thurs': 'Thursday', 'th': 'Thursday',
                'friday': 'Friday', 'fri': 'Friday', 'f': 'Friday',
                'saturday': 'Saturday', 'sat': 'Saturday', 's': 'Saturday',
                'sunday': 'Sunday', 'sun': 'Sunday', 'su': 'Sunday',
              };
              
              for (const [key, value] of Object.entries(dayMap)) {
                if (dayName.includes(key)) {
                  dayColumns[i] = value;
                  break;
                }
              }
            }
            
            console.log('[Schedule Extract] Day columns:', dayColumns);
            
            // Parse each time slot row
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (!row || row.every(cell => !cell)) continue;
              
              const timeSlot = String(row[0] || '').trim();
              if (!timeSlot) continue;
              
              const startTime = parseTime(timeSlot);
              if (!startTime) continue;
              
              // For each day column, check if there's a class name
              for (const [colIdx, dayName] of Object.entries(dayColumns)) {
                const className = String(row[parseInt(colIdx)] || '').trim();
                if (className && className.toLowerCase() !== 'none' && className !== '-') {
                  classes.push({
                    name: className,
                    dayOfWeek: dayName,
                    startTime: startTime,
                    endTime: undefined, // Will be set to 1 hour after start time
                    instructor: undefined,
                    location: undefined,
                    level: 'All Levels',
                    maxCapacity: 20,
                  });
                }
              }
            }
            
            // Calculate end times (assume 1 hour duration if not specified)
            const classesWithEndTime = classes.map(cls => {
              if (!cls.endTime && cls.startTime) {
                const [hours, minutes] = cls.startTime.split(':').map(Number);
                const endHours = (hours + 1) % 24;
                cls.endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              }
              return cls;
            });
            
            console.log('[Schedule Extract] Grid format parsed', classesWithEndTime.length, 'classes');
            
            return {
              success: true,
              classes: classesWithEndTime,
              confidence: 1.0,
              formatDetected: 'grid',
              rawHeaders,
            };
          }
          
          // Auto-detect column mapping if not provided (for traditional format)
          let mapping = input.columnMapping || {};
          const detectedMapping: Record<string, number> = {};
          const unmappedRequired: string[] = [];
          
          for (const [field, patterns] of Object.entries(columnPatterns)) {
            // Use provided mapping if available
            if (mapping[field as keyof typeof mapping] !== undefined) {
              detectedMapping[field] = mapping[field as keyof typeof mapping]!;
              continue;
            }
            
            // Try to auto-detect - first try exact match, then partial match
            let idx = -1;
            
            // First pass: exact match
            for (const pattern of patterns) {
              idx = normalizedHeaders.findIndex(h => h === pattern);
              if (idx !== -1) break;
            }
            
            // Second pass: partial match (but exclude ID columns for name field)
            if (idx === -1) {
              for (const pattern of patterns) {
                idx = normalizedHeaders.findIndex((h, i) => {
                  // Skip if already mapped to another field
                  if (Object.values(detectedMapping).includes(i)) return false;
                  // For name field, exclude ID-like columns
                  if (field === 'name' && excludeFromName.some(ex => h.includes(ex))) return false;
                  return h.includes(pattern);
                });
                if (idx !== -1) break;
              }
            }
            
            if (idx !== -1) {
              detectedMapping[field] = idx;
            } else if (['name', 'day', 'startTime', 'endTime'].includes(field)) {
              unmappedRequired.push(field);
            }
          }
          
          console.log('[Schedule Extract] Detected mapping:', detectedMapping);
          console.log('[Schedule Extract] Unmapped required:', unmappedRequired);
          
          // If we can't detect required columns, return with headers for manual mapping
          if (unmappedRequired.length > 0) {
            return {
              success: false,
              classes: [],
              confidence: 0,
              error: `Could not auto-detect columns: ${unmappedRequired.join(', ')}. Please map the columns manually.`,
              errorType: 'mapping_required',
              rawHeaders,
              detectedMapping,
              suggestColumnMapping: true,
              previewRows: data.slice(1, 6).map(row => row.map(cell => String(cell || '')))
            };
          }
          
          // Parse rows into classes
          const classes: any[] = [];
          const warnings: string[] = [];
          const rowErrors: { row: number; error: string }[] = [];
          
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell)) continue; // Skip empty rows
            
            const getValue = (field: string) => {
              const idx = detectedMapping[field];
              return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
            };
            
            const name = getValue('name');
            const dayRaw = getValue('day');
            const startTimeRaw = getValue('startTime');
            const endTimeRaw = getValue('endTime');
            
            // Validate required fields
            if (!name) {
              rowErrors.push({ row: i + 1, error: 'Missing class name' });
              continue;
            }
            
            // Parse day - handle multiple days separated by comma or slash
            const dayParts = dayRaw.split(/[,\/&]/).map(d => d.trim()).filter(Boolean);
            const days = dayParts.map(normalizeDay).filter(Boolean) as string[];
            
            if (days.length === 0) {
              rowErrors.push({ row: i + 1, error: `Invalid day format: "${dayRaw}"` });
              continue;
            }
            
            // Parse times
            const startTime = parseTime(startTimeRaw);
            const endTime = parseTime(endTimeRaw);
            
            if (!startTime) {
              rowErrors.push({ row: i + 1, error: `Invalid start time: "${startTimeRaw}"` });
              continue;
            }
            
            if (!endTime) {
              rowErrors.push({ row: i + 1, error: `Invalid end time: "${endTimeRaw}"` });
              continue;
            }
            
            // Get optional fields
            const instructor = getValue('instructor') || undefined;
            const room = getValue('room') || undefined;
            const level = getValue('level') || 'All Levels';
            const capacityStr = getValue('capacity');
            const capacity = capacityStr ? parseInt(capacityStr) : undefined;
            
            // Create a single class entry with multiple days instead of separate entries
            // This prevents duplicate class cards for recurring classes
            const classKey = `${name}|${startTime}|${endTime}|${instructor || ''}|${level}|${capacity || 20}`;
            
            // Check if we already have this class with different days
            const existingClass = classes.find(c => 
              c.name === name &&
              c.startTime === startTime &&
              c.endTime === endTime &&
              c.instructor === instructor &&
              c.level === level &&
              c.maxCapacity === (capacity || 20)
            );
            
            if (existingClass) {
              // Add days to existing class entry
              const daysArray = Array.isArray(existingClass.dayOfWeek) 
                ? existingClass.dayOfWeek 
                : [existingClass.dayOfWeek];
              
              for (const day of days) {
                if (!daysArray.includes(day)) {
                  daysArray.push(day);
                }
              }
              
              // Sort days in week order
              const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              daysArray.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
              
              existingClass.dayOfWeek = daysArray;
            } else {
              // Create new class entry with all days
              classes.push({
                name,
                dayOfWeek: days.length === 1 ? days[0] : days,
                startTime,
                endTime,
                instructor,
                location: room,
                level,
                maxCapacity: capacity || 20,
              });
            }
          }
          
          console.log('[Schedule Extract] Parsed', classes.length, 'classes,', rowErrors.length, 'errors');
          
          // Calculate confidence based on success rate
          const totalRows = data.length - 1;
          const successRate = totalRows > 0 ? (totalRows - rowErrors.length) / totalRows : 0;
          const confidence = Math.round(successRate * 100) / 100;
          
          if (classes.length === 0) {
            return {
              success: false,
              classes: [],
              confidence: 0,
              error: rowErrors.length > 0 
                ? `Could not parse any classes. Errors: ${rowErrors.slice(0, 3).map(e => `Row ${e.row}: ${e.error}`).join('; ')}` 
                : 'No valid class data found in the file.',
              errorType: 'parse_error',
              rawHeaders,
              detectedMapping,
              rowErrors: rowErrors.slice(0, 10),
            };
          }
          
          // Add warnings for row errors
          if (rowErrors.length > 0) {
            warnings.push(`${rowErrors.length} row(s) had errors and were skipped`);
          }
          
          // Check for duplicates against existing classes in the database
          const { getDb } = await import('./db');
          const { classes: classesTable } = await import('../drizzle/schema');
          const { eq, and } = await import('drizzle-orm');
          
          const db = await getDb();
          if (db) {
            try {
              // Get organization ID from context
              const organizationId = ctx.user?.organizationId;
              if (!organizationId) {
                console.warn('[Schedule Extract] No organization ID in context');
                return {
                  success: true,
                  classes,
                  confidence,
                  warnings,
                  rawHeaders,
                  detectedMapping,
                };
              }
              
              // Fetch existing classes for this organization
              const existingClasses = await db.select().from(classesTable).where(eq(classesTable.organizationId, organizationId));
              
              // Mark duplicates in the extracted classes
              for (const extractedClass of classes) {
                const dayOfWeekStr = Array.isArray(extractedClass.dayOfWeek) 
                  ? extractedClass.dayOfWeek.join(',') 
                  : extractedClass.dayOfWeek;
                
                // Check if a class with the same day and time already exists
                const duplicate = existingClasses.find(existing => {
                  const existingDays = existing.dayOfWeek?.split(',') || [];
                  const extractedDays = dayOfWeekStr?.split(',') || [];
                  
                  // Check if any day overlaps
                  const hasOverlappingDay = extractedDays.some(day => 
                    existingDays.includes(day.trim())
                  );
                  
                  // Check if time matches (within 5 minutes tolerance)
                  const timesMatch = existing.startTime === extractedClass.startTime;
                  
                  return hasOverlappingDay && timesMatch;
                });
                
                if (duplicate) {
                  extractedClass.isDuplicate = true;
                  extractedClass.duplicateOf = duplicate.id;
                }
              }
              
              const duplicateCount = classes.filter(c => c.isDuplicate).length;
              if (duplicateCount > 0) {
                warnings.push(`${duplicateCount} class(es) may be duplicates of existing classes`);
              }
            } catch (dbError) {
              console.error('[Schedule Extract] Error checking duplicates:', dbError);
              // Don't fail the entire extraction if duplicate check fails
              warnings.push('Could not check for duplicate classes');
            }
          }
          
          // Create a Kai conversation for approval workflow
          const { kaiConversations, kaiMessages } = await import('../drizzle/schema');
          
          // Get organization ID from context - try multiple sources
          const organizationId = ctx.currentOrganizationId || ctx.organizationId || ctx.user?.organizationId;
          console.log('[Schedule Extract] Organization context:', { 
            organizationId, 
            currentOrgId: ctx.currentOrganizationId,
            ctxOrgId: ctx.organizationId, 
            userOrgId: ctx.user?.organizationId 
          });
          if (!organizationId) {
            console.warn('[Schedule Extract] No organization ID, returning classes directly');
            return {
              success: true,
              classes,
              confidence,
              warnings,
              rawHeaders,
              detectedMapping,
              rowErrors: rowErrors.slice(0, 10),
            };
          }
          
          try {
            // Create conversation for schedule approval
            const conversationTitle = `Schedule Import: ${input.fileName}`;
            const conversationResult = await db.insert(kaiConversations).values({
              organizationId,
              userId: ctx.user.id,
              title: conversationTitle,
              preview: `${classes.length} classes extracted from ${input.fileName}`,
              category: 'operations',
              priority: 'attention', // This puts it in PENDING column
              status: 'active',
              lastMessageAt: new Date().toISOString(),
            });
            
            const conversationId = Number(conversationResult.insertId);
            
            // Create summary message with schedule details
            const duplicateCount = classes.filter(c => c.isDuplicate).length;
            const nonDuplicateCount = classes.length - duplicateCount;
            
            let summaryText = `📋 **Schedule Import Ready for Approval**\n\n`;
            summaryText += `**File:** ${input.fileName}\n`;
            summaryText += `**Total Classes:** ${classes.length}\n`;
            summaryText += `**New Classes:** ${nonDuplicateCount}\n`;
            if (duplicateCount > 0) {
              summaryText += `**Duplicates:** ${duplicateCount} (will be skipped)\n`;
            }
            summaryText += `\n**Classes to Import:**\n`;
            
            // List first 10 classes
            const classesToShow = classes.filter(c => !c.isDuplicate).slice(0, 10);
            classesToShow.forEach(cls => {
              const days = Array.isArray(cls.dayOfWeek) ? cls.dayOfWeek.join(', ') : cls.dayOfWeek;
              summaryText += `• ${cls.name} - ${days} ${cls.startTime}-${cls.endTime}`;
              if (cls.instructor) summaryText += ` (${cls.instructor})`;
              summaryText += `\n`;
            });
            
            if (nonDuplicateCount > 10) {
              summaryText += `\n... and ${nonDuplicateCount - 10} more\n`;
            }
            
            if (warnings.length > 0) {
              summaryText += `\n⚠️ **Warnings:**\n${warnings.map(w => `• ${w}`).join('\n')}`;
            }
            
            // Store extracted classes in message metadata for later approval
            const metadata = JSON.stringify({
              extractedClasses: classes,
              fileName: input.fileName,
              confidence,
              warnings,
              detectedMapping,
            });
            
            await db.insert(kaiMessages).values({
              conversationId,
              organizationId,
              role: 'assistant',
              content: summaryText,
              metadata,
            });
            
            console.log('[Schedule Extract] Created conversation', conversationId, 'for approval');
            
            return {
              success: true,
              conversationId,
              classes,
              confidence,
              warnings,
              rawHeaders,
              detectedMapping,
              rowErrors: rowErrors.slice(0, 10),
            };
          } catch (convError) {
            console.error('[Schedule Extract] Failed to create conversation:', convError);
            // Fall back to returning classes directly
            return {
              success: true,
              classes,
              confidence,
              warnings,
              rawHeaders,
              detectedMapping,
              rowErrors: rowErrors.slice(0, 10),
            };
          }
        } catch (error: any) {
          console.error('[Schedule Extract] Error:', error);
          
          // Provide specific error messages based on error type
          let errorMessage = 'Failed to extract schedule';
          let errorType = 'unknown';
          
          if (error.message?.includes('fetch') || error.message?.includes('storage')) {
            errorMessage = `Could not read the file: ${error.message}`;
            errorType = 'file_access';
          } else if (error.message?.includes('sheet') || error.message?.includes('workbook') || error.message?.includes('xlsx')) {
            errorMessage = 'Could not parse the spreadsheet. Please ensure it\'s a valid Excel or CSV file.';
            errorType = 'parse_error';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return {
            success: false,
            classes: [],
            confidence: 0,
            error: errorMessage,
            errorType,
            rawHeaders: [],
          };
        }
      }),

    // Create classes from extracted schedule
    createClassesFromSchedule: orgScopedProcedure
      .input(z.object({
        classes: z.array(z.object({
          name: z.string(),
          dayOfWeek: z.union([z.string(), z.array(z.string())]),
          startTime: z.string(),
          endTime: z.string(),
          instructor: z.string().optional(),
          location: z.string().optional(),
          level: z.string().optional(),
          maxCapacity: z.number().optional(),
          notes: z.string().optional(),
        }))
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { classes } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) {
          return { success: false, createdCount: 0, error: 'Database not available' };
        }
        
        // Get organization ID from context
        const organizationId = ctx.currentOrganizationId;
        if (!organizationId) {
          return { success: false, createdCount: 0, error: 'Organization not found' };
        }
        
        // Helper to format 24h time to 12h display format
        const formatTime = (time24: string): string => {
          const [hours, minutes] = time24.split(':').map(Number);
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const h12 = hours % 12 || 12;
          return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        
        let createdCount = 0;
        const errors: string[] = [];
        const createdIds: number[] = [];
        
        try {
          // Store classes with their days (single or multiple)
          for (const cls of input.classes) {
            // Convert dayOfWeek to comma-separated string for storage
            const dayOfWeekStr = Array.isArray(cls.dayOfWeek) 
              ? cls.dayOfWeek.join(',')
              : cls.dayOfWeek;
            try {
              // Format time for display (e.g., "4:00 PM - 5:00 PM")
              const timeDisplay = `${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}`;
              
              console.log('[CreateClasses] Creating:', cls.name, dayOfWeekStr, timeDisplay);
              
              // Only use fields that exist in the schema
              const result = await db.insert(classes).values({
                name: cls.name,
                dayOfWeek: dayOfWeekStr,
                time: timeDisplay,
                instructor: cls.instructor || null,
                capacity: cls.maxCapacity || 20,
                isActive: 1,
                enrolled: 0,
                organizationId: organizationId,
              });
              
              // Get the inserted ID
              if (result.insertId) {
                createdIds.push(Number(result.insertId));
              }
              
              createdCount++;
            } catch (error: any) {
              console.error(`[CreateClasses] Failed to create class ${cls.name}:`, error);
              errors.push(`Failed to create ${cls.name}: ${error.message}`);
            }
          }
        
          console.log('[CreateClasses] Created', createdCount, 'classes, IDs:', createdIds);
        } catch (error: any) {
          console.error('[CreateClasses] Outer error:', error);
          return {
            success: false,
            createdCount: createdCount,
            createdIds: createdIds,
            error: error.message || 'Failed to create classes',
            errors: errors.length > 0 ? errors : undefined
          };
        }
        
        return {
          success: createdCount > 0,
          createdCount,
          createdIds,
          errors: errors.length > 0 ? errors : undefined
        };
      }),
  }),

  // Student document import router — parse any file type and bulk-insert students
  studentImport: router({
    /**
     * Parse a student roster from any uploaded file (PDF, Excel, CSV, image of handwritten list).
     * Uses the LLM vision/file API to extract student records and returns a preview array
     * for the user to review before committing.
     */
    parseStudentsFromDocument: orgScopedProcedure
      .input(z.object({
        fileUrl: z.string().optional(),
        storageKey: z.string().optional(),
        fileType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        const { storageGetBuffer } = await import('./storage');

        const lowerName = input.fileName.toLowerCase();
        const lowerType = input.fileType.toLowerCase();

        const isSpreadsheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') ||
          lowerName.endsWith('.csv') || lowerType.includes('spreadsheet') || lowerType.includes('csv');
        const isImage = lowerType.startsWith('image/') || lowerName.endsWith('.jpg') ||
          lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.webp');
        const isPdf = lowerName.endsWith('.pdf') || lowerType.includes('pdf');

        try {
          if (isSpreadsheet) {
            // Parse Excel/CSV with xlsx library, then use LLM to intelligently map columns
            const xlsx = await import('xlsx');
            let arrayBuffer: ArrayBuffer;
            if (input.storageKey) {
              arrayBuffer = await storageGetBuffer(input.storageKey);
            } else if (input.fileUrl) {
              const resp = await fetch(input.fileUrl);
              if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
              arrayBuffer = await resp.arrayBuffer();
            } else {
              throw new Error('No file URL or storage key provided');
            }
            const workbook = xlsx.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
            const fileContent = rows.map((r: any[]) => r.join('\t')).join('\n');

            const llmResponse = await invokeLLM({
              maxTokens: 4096,
              messages: [
                {
                  role: 'system',
                  content: 'You are a data extraction assistant. Extract ALL student records from the provided tabular data — include every single row, do not stop early or truncate the list. Return ONLY a valid JSON array of objects with these fields (use null for missing values): firstName, lastName, email, phone, dateOfBirth (YYYY-MM-DD format or null), beltRank, program, guardianName, guardianPhone. Do not include any explanation, markdown, or code fences — just the raw JSON array.'
                },
                {
                  role: 'user',
                  content: `Extract ALL student records from this data (include every row, do not truncate):\n\n${fileContent.substring(0, 12000)}`
                }
              ]
            });

            const raw = llmResponse.choices?.[0]?.message?.content || '';
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Could not extract student data from spreadsheet');
            const parsed = JSON.parse(jsonMatch[0]);
            return { success: true, students: parsed, source: 'spreadsheet', fileName: input.fileName };

          } else if (isPdf || isImage) {
            // For PDFs: use pdfjs-dist + canvas to render each page to PNG, then send
            // as base64 image_url blocks to GPT-4o vision.
            // OpenAI's image_url endpoint only accepts png/jpeg/gif/webp — PDFs cannot
            // be sent directly. This is a pure Node.js approach, no system binaries needed.
            let fileBytes: Buffer;
            if (input.storageKey) {
              const ab = await storageGetBuffer(input.storageKey);
              fileBytes = Buffer.from(ab);
            } else if (input.fileUrl) {
              const resp = await fetch(input.fileUrl);
              if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
              fileBytes = Buffer.from(await resp.arrayBuffer());
            } else {
              throw new Error('No file URL or storage key provided');
            }

            if (isPdf) {
              // PDF: extract text directly using pdfjs-dist (pure Node.js, no system binaries).
              // Text extraction is 100% accurate, fast, and never gets truncated by token limits.
              // Vision rendering is reserved for image files (jpg, png, webp) only.
              const { pdfToText } = await import('./pdfToText');
              const pdfText = await pdfToText(new Uint8Array(fileBytes));
              if (!pdfText.trim()) throw new Error('PDF contains no extractable text — try uploading a spreadsheet or a clearer scan');
              console.log('[studentImport.pdf] extracted text length:', pdfText.length);
              const textResponse = await invokeLLM({
                maxTokens: 8192,
                messages: [
                  {
                    role: 'user',
                    content: `Extract ALL student/person records from the following roster text — include every single row, do not stop early or skip any. Return ONLY a valid JSON array of objects with these fields (use null for missing values): firstName, lastName, email, phone, dateOfBirth (YYYY-MM-DD format or null), beltRank, program, guardianName, guardianPhone. Do not include any explanation, markdown, or code fences — just the raw JSON array.\n\nROSTER TEXT:\n${pdfText}`
                  }
                ]
              });
              const raw = textResponse.choices?.[0]?.message?.content || '';
              console.log('[studentImport.pdf] raw response length:', raw.length, 'finish_reason:', textResponse.choices?.[0]?.finish_reason);
              const jsonMatch = raw.match(/\[[\s\S]*\]/);
              if (!jsonMatch) throw new Error('Could not extract student data from document');
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('[studentImport.pdf] parsed student count:', parsed.length);
              return { success: true, students: parsed, source: 'vision', fileName: input.fileName };
            } else {
              // Image file — send directly to GPT-4o vision
              const mimeType = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') ? 'image/jpeg'
                : lowerName.endsWith('.webp') ? 'image/webp'
                : 'image/png';
              const imageBlock = {
                type: 'image_url' as const,
                image_url: { url: `data:${mimeType};base64,${fileBytes.toString('base64')}`, detail: 'high' as const },
              };
              const visionResponse = await invokeLLM({
                maxTokens: 8192,
                messages: [
                  {
                    role: 'user',
                    content: [
                      imageBlock,
                      {
                        type: 'text',
                        text: 'Extract ALL student/person records from this image — include every single row visible in the table, do not stop early or truncate the list. Return ONLY a valid JSON array of objects with these fields (use null for missing values): firstName, lastName, email, phone, dateOfBirth (YYYY-MM-DD format or null), beltRank, program, guardianName, guardianPhone. Do not include any explanation, markdown, or code fences — just the raw JSON array.'
                      }
                    ]
                  }
                ]
              });
              const raw = visionResponse.choices?.[0]?.message?.content || '';
              console.log('[studentImport.vision] raw response length:', raw.length, 'finish_reason:', visionResponse.choices?.[0]?.finish_reason);
              const jsonMatch = raw.match(/\[[\s\S]*\]/);
              if (!jsonMatch) throw new Error('Could not extract student data from document');
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('[studentImport.vision] parsed student count:', parsed.length);
              return { success: true, students: parsed, source: 'vision', fileName: input.fileName };
            }

          } else {
            throw new Error(`Unsupported file type: ${input.fileType}. Please upload a PDF, Excel (.xlsx/.xls), CSV, or image file.`);
          }

        } catch (err: any) {
          console.error('[studentImport.parseStudentsFromDocument] Error:', err);
          return { success: false, students: [], error: err.message, fileName: input.fileName };
        }
      }),

    /**
     * Bulk insert confirmed student records into the students table.
     * Called after the user reviews and approves the parsed preview.
     */
    bulkImportStudents: orgScopedProcedure
      .input(z.object({
        students: z.array(z.object({
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          dateOfBirth: z.string().nullable().optional(),
          beltRank: z.string().nullable().optional(),
          program: z.string().nullable().optional(),
          guardianName: z.string().nullable().optional(),
          guardianPhone: z.string().nullable().optional(),
        }))
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import('./db');
        const { students } = await import('../drizzle/schema');
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const orgId = ctx.currentOrganizationId;
        if (!orgId) throw new Error('Organization context missing');

        let insertedCount = 0;
        const errors: string[] = [];

        for (const student of input.students) {
          try {
            await db.insert(students).values({
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email || null,
              phone: student.phone || null,
              dateOfBirth: student.dateOfBirth || null,
              beltRank: student.beltRank || null,
              program: student.program || null,
              guardianName: student.guardianName || null,
              guardianPhone: student.guardianPhone || null,
              status: 'Active',
              organizationId: orgId,
            });
            insertedCount++;
          } catch (err: any) {
            errors.push(`${student.firstName} ${student.lastName}: ${err.message}`);
          }
        }

        return {
          success: insertedCount > 0,
          insertedCount,
          totalRequested: input.students.length,
          errors: errors.length > 0 ? errors : undefined,
        };
      }),
  }),

  // Document analysis router — intelligently classify any uploaded document and suggest routing
  documentAnalysis: router({
    /**
     * Analyze any uploaded document (PDF, image, spreadsheet) and determine what type it is.
     * Returns a classification (students, programs, schedule, invoice, waiver, unknown) plus
     * a human-readable summary and suggested actions for Kai to present.
     */
    analyzeDocument: orgScopedProcedure
      .input(z.object({
        fileUrl: z.string().optional(),
        storageKey: z.string().optional(),
        fileType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        const { storageGetBuffer } = await import('./storage');

        const lowerName = input.fileName.toLowerCase();
        const lowerType = input.fileType.toLowerCase();
        const isPdf = lowerName.endsWith('.pdf') || lowerType.includes('pdf');
        const isSpreadsheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') ||
          lowerName.endsWith('.csv') || lowerType.includes('spreadsheet') || lowerType.includes('csv');
        const isImage = lowerType.startsWith('image/');

        try {
          let documentText = '';

          if (isPdf) {
            // Extract text from PDF
            let fileBytes: Buffer;
            if (input.storageKey) {
              const ab = await storageGetBuffer(input.storageKey);
              fileBytes = Buffer.from(ab);
            } else if (input.fileUrl) {
              const resp = await fetch(input.fileUrl);
              if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
              fileBytes = Buffer.from(await resp.arrayBuffer());
            } else {
              throw new Error('No file URL or storage key provided');
            }
            const { pdfToText } = await import('./pdfToText');
            documentText = await pdfToText(new Uint8Array(fileBytes));
          } else if (isSpreadsheet) {
            // Extract text from spreadsheet
            const xlsx = await import('xlsx');
            let arrayBuffer: ArrayBuffer;
            if (input.storageKey) {
              arrayBuffer = await storageGetBuffer(input.storageKey);
            } else if (input.fileUrl) {
              const resp = await fetch(input.fileUrl);
              if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
              arrayBuffer = await resp.arrayBuffer();
            } else {
              throw new Error('No file URL or storage key provided');
            }
            const workbook = xlsx.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
            documentText = rows.map((r: any[]) => r.join('\t')).join('\n');
          } else if (isImage) {
            // For images, use vision to describe the content
            let fileBytes: Buffer;
            if (input.storageKey) {
              const ab = await storageGetBuffer(input.storageKey);
              fileBytes = Buffer.from(ab);
            } else if (input.fileUrl) {
              const resp = await fetch(input.fileUrl);
              if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
              fileBytes = Buffer.from(await resp.arrayBuffer());
            } else {
              throw new Error('No file URL or storage key provided');
            }
            const mimeType = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') ? 'image/jpeg'
              : lowerName.endsWith('.webp') ? 'image/webp' : 'image/png';
            const visionResponse = await invokeLLM({
              maxTokens: 2048,
              messages: [{
                role: 'user',
                content: [
                  { type: 'image_url' as const, image_url: { url: `data:${mimeType};base64,${fileBytes.toString('base64')}`, detail: 'high' as const } },
                  { type: 'text', text: 'Describe the content of this document in detail. What type of document is it? What information does it contain?' }
                ]
              }]
            });
            documentText = visionResponse.choices?.[0]?.message?.content || '';
          }

          if (!documentText.trim()) {
            return {
              success: false,
              documentType: 'unknown',
              summary: 'Could not extract text from this document.',
              suggestedActions: [],
              extractedText: ''
            };
          }

          // Ask the AI to classify the document and suggest actions
          const classificationResponse = await invokeLLM({
            maxTokens: 1024,
            messages: [
              {
                role: 'system',
                content: `You are Kai, an AI assistant for a martial arts / fitness school management system (DojoFlow). 
Analyze the provided document content and determine:
1. What TYPE of document it is (one of: students, programs, schedule, invoice, waiver, leads, staff, unknown)
2. A brief 1-2 sentence SUMMARY of what the document contains
3. What ACTIONS should be suggested to the user

Document types and their EXACT action strings (use these EXACT values in the action field):
- students: [{"label": "👥 Import students to roster", "action": "import_students"}, {"label": "💬 Review student list", "action": "ask_kai"}]
- programs: [{"label": "📋 Import programs to Programs page", "action": "import_programs"}, {"label": "🔍 Review program list", "action": "ask_kai"}]
- merchandise: [{"label": "🛍️ Import items to Merchandise", "action": "import_merchandise"}, {"label": "🔍 Review item list", "action": "ask_kai"}]
- schedule: [{"label": "📅 Import class schedule", "action": "import_schedule"}, {"label": "💬 Review schedule", "action": "ask_kai"}]
- invoice: [{"label": "💬 Ask Kai about this document", "action": "ask_kai"}]
- waiver: [{"label": "💬 Ask Kai about this document", "action": "ask_kai"}]
- leads: [{"label": "👥 Import leads", "action": "import_students"}, {"label": "💬 Review prospect list", "action": "ask_kai"}]
- staff: [{"label": "💬 Ask Kai about this document", "action": "ask_kai"}]
- unknown: [{"label": "💬 Ask Kai about this document", "action": "ask_kai"}]

Respond ONLY with valid JSON in this exact format:
{
  "documentType": "programs",
  "summary": "This document contains 3 martial arts programs with names, durations, and descriptions.",
  "suggestedActions": [
    { "label": "📋 Import programs to Programs page", "action": "import_programs" },
    { "label": "💬 Ask Kai about this document", "action": "ask_kai" }
  ]
}`
              },
              {
                role: 'user',
                content: `Analyze this document (filename: ${input.fileName}):\n\n${documentText.substring(0, 6000)}`
              }
            ]
          });

          const raw = classificationResponse.choices?.[0]?.message?.content || '';
          console.log('[documentAnalysis] raw classification:', raw.substring(0, 500));

          // Parse the JSON response
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            return {
              success: true,
              documentType: 'unknown',
              summary: 'I\'ve read the document but couldn\'t determine its type. You can ask me questions about it.',
              suggestedActions: [{ label: '💬 Ask Kai about this document', action: 'ask_kai' }],
              extractedText: documentText.substring(0, 3000)
            };
          }

          const classification = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            documentType: classification.documentType || 'unknown',
            summary: classification.summary || 'Document analyzed successfully.',
            suggestedActions: classification.suggestedActions || [{ label: '💬 Ask Kai about this document', action: 'ask_kai' }],
            extractedText: documentText.substring(0, 3000)
          };

        } catch (err: any) {
          console.error('[documentAnalysis.analyzeDocument] Error:', err);
          return {
            success: false,
            documentType: 'unknown',
            summary: `Error analyzing document: ${err.message}`,
            suggestedActions: [{ label: '💬 Ask Kai about this document', action: 'ask_kai' }],
            extractedText: ''
          };
        }
      }),

    /**
     * Extract structured program data from a document and return it for preview before import.
     */
    extractPrograms: orgScopedProcedure
      .input(z.object({
        fileUrl: z.string().optional(),
        storageKey: z.string().optional(),
        fileType: z.string(),
        fileName: z.string(),
        extractedText: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        const { storageGetBuffer } = await import('./storage');

        try {
          let documentText = input.extractedText || '';

          if (!documentText) {
            const lowerName = input.fileName.toLowerCase();
            const lowerType = input.fileType.toLowerCase();
            const isPdf = lowerName.endsWith('.pdf') || lowerType.includes('pdf');
            const isSpreadsheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') ||
              lowerName.endsWith('.csv') || lowerType.includes('spreadsheet') || lowerType.includes('csv');

            if (isPdf) {
              let fileBytes: Buffer;
              if (input.storageKey) {
                const ab = await storageGetBuffer(input.storageKey);
                fileBytes = Buffer.from(ab);
              } else if (input.fileUrl) {
                const resp = await fetch(input.fileUrl);
                if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
                fileBytes = Buffer.from(await resp.arrayBuffer());
              } else {
                throw new Error('No file URL or storage key provided');
              }
              const { pdfToText } = await import('./pdfToText');
              documentText = await pdfToText(new Uint8Array(fileBytes));
            } else if (isSpreadsheet) {
              const xlsx = await import('xlsx');
              let arrayBuffer: ArrayBuffer;
              if (input.storageKey) {
                arrayBuffer = await storageGetBuffer(input.storageKey);
              } else if (input.fileUrl) {
                const resp = await fetch(input.fileUrl);
                if (!resp.ok) throw new Error(`Failed to fetch file: ${resp.status}`);
                arrayBuffer = await resp.arrayBuffer();
              } else {
                throw new Error('No file URL or storage key provided');
              }
              const workbook = xlsx.read(arrayBuffer, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];
              documentText = rows.map((r: any[]) => r.join('\t')).join('\n');
            }
          }

          if (!documentText.trim()) {
            return { success: false, programs: [], error: 'Could not extract text from document.' };
          }

          const extractionResponse = await invokeLLM({
            maxTokens: 4096,
            messages: [
              {
                role: 'system',
                content: `You are a data extraction assistant for a martial arts school management system.
Extract all programs/classes/memberships from the provided document.
For each program, extract as much detail as possible.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "name": "Karate Basics",
    "type": "membership",
    "ageRange": "6-12",
    "price": 9900,
    "billing": "monthly",
    "description": "Introduction to fundamental Karate techniques.",
    "maxSize": 20
  }
]

Field rules:
- name: required string
- type: one of "membership", "class_pack", "drop_in", "private" (default: "membership")
- ageRange: string like "6-12", "Adults", "All Ages", or null
- price: integer in CENTS (e.g. $99 = 9900), or null if not found
- billing: one of "monthly", "weekly", "per_session", "one_time", or null
- description: string or null
- maxSize: integer or null

Do NOT invent data not in the document. If a field is missing, use null.`
              },
              {
                role: 'user',
                content: `Extract all programs from this document (filename: ${input.fileName}):\n\n${documentText.substring(0, 8000)}`
              }
            ]
          });

          const raw = extractionResponse.choices?.[0]?.message?.content || '';
          const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (!jsonMatch) {
            return { success: false, programs: [], error: 'Could not parse program data from document.' };
          }

          const programs = JSON.parse(jsonMatch[0]);
          return { success: true, programs, error: null };

        } catch (err: any) {
          console.error('[documentAnalysis.extractPrograms] Error:', err);
          return { success: false, programs: [], error: err.message };
        }
      }),

    /**
     * Extract structured merchandise items from a document and return them for preview before import.
     */
    extractMerchandise: orgScopedProcedure
      .input(z.object({
        fileUrl: z.string(),
        extractedText: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { invokeLLM } = await import('./llm');

          let documentText = input.extractedText || '';

          // If no pre-extracted text, fetch and parse the file
          if (!documentText && input.fileUrl) {
            const axios = await import('axios');
            const response = await axios.default.get(input.fileUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            const pdfParse = await import('pdf-parse');
            const parsed = await pdfParse.default(buffer);
            documentText = parsed.text;
          }

          if (!documentText.trim()) {
            return { success: false, items: [], error: 'Could not extract text from document.' };
          }

          const extractionResponse = await invokeLLM({
            maxTokens: 2048,
            messages: [
              {
                role: 'system',
                content: `You are an AI assistant that extracts merchandise/product data from documents for a martial arts school management system.
Extract all merchandise items from the provided document text.
For each item, extract:
- name: product name (string, required)
- type: one of "uniform", "gear", "belt", "equipment", "other" (string, required)
- defaultPrice: price as a number (e.g. 29.99), or null if not found
- description: brief description (string, optional)
- stockQuantity: stock quantity as a number, or null if not found

Respond ONLY with a valid JSON array of objects. Example:
[{"name":"White Gi Uniform","type":"uniform","defaultPrice":59.99,"description":"Traditional white karate gi","stockQuantity":50}]`
              },
              {
                role: 'user',
                content: `Extract all merchandise items from this document:\n\n${documentText.substring(0, 6000)}`
              }
            ]
          });

          const raw = extractionResponse.choices?.[0]?.message?.content || '';
          const jsonMatch = raw.match(/\[[\s\S]*\]/);
          if (!jsonMatch) {
            return { success: false, items: [], error: 'Could not parse merchandise data from document.' };
          }

          const items = JSON.parse(jsonMatch[0]);
          return { success: true, items, error: null };

        } catch (err: any) {
          console.error('[documentAnalysis.extractMerchandise] Error:', err);
          return { success: false, items: [], error: err.message };
        }
      }),
  }),

  // Programs management router
  programs: router({
    // Get all programs
    list: publicProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { programs } = await import("../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get organization ID from context for multi-tenancy
      const organizationId = ctx.currentOrganizationId;
      
      // SECURITY: Require organization ID for multi-tenancy - no org = empty list
      if (!organizationId) {
        console.log('[programs.list] No organization ID found, returning empty list for data isolation');
        return [];
      }
      
      const result = await db.select().from(programs)
        .where(eq(programs.organizationId, organizationId))
        .orderBy(desc(programs.createdAt));
      return result;
    }),

    // Get a single program by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.select().from(programs).where(eq(programs.id, input.id));
        return result[0] || null;
      }),

    // Create a new program
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["membership", "class_pack", "drop_in", "private"]),
        ageRange: z.string().optional(),
        billing: z.enum(["monthly", "weekly", "per_session", "one_time"]).optional(),
        price: z.number().optional(),
        contractLength: z.string().optional(),
        maxSize: z.number().optional(),
        isCoreProgram: z.boolean().optional(),
        showOnKiosk: z.boolean().optional(),
        allowAutopilot: z.boolean().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // SECURITY: Require organization ID for multi-tenancy
        const organizationId = ctx.currentOrganizationId;
        if (!organizationId) {
          throw new Error('Organization ID required for program creation');
        }
        
        const result = await db.insert(programs).values({
          organizationId,
          name: input.name,
          type: input.type,
          ageRange: input.ageRange,
          billing: input.billing,
          price: input.price,
          contractLength: input.contractLength,
          maxSize: input.maxSize || 20,
          isCoreProgram: input.isCoreProgram ? 1 : 0,
          showOnKiosk: input.showOnKiosk !== false ? 1 : 0,
          allowAutopilot: input.allowAutopilot ? 1 : 0,
          description: input.description,
          isActive: 1,
        });
        
        return { success: true, id: Number(result.insertId) };
      }),

    // Update an existing program
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["membership", "class_pack", "drop_in", "private"]).optional(),
        ageRange: z.string().optional(),
        billing: z.enum(["monthly", "weekly", "per_session", "one_time"]).optional(),
        price: z.number().optional(),
        contractLength: z.string().optional(),
        maxSize: z.number().optional(),
        isCoreProgram: z.boolean().optional(),
        showOnKiosk: z.boolean().optional(),
        allowAutopilot: z.boolean().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { id, ...updates } = input;
        
        // Convert boolean fields to int
        const dbUpdates: any = { ...updates };
        if (typeof updates.isCoreProgram === 'boolean') dbUpdates.isCoreProgram = updates.isCoreProgram ? 1 : 0;
        if (typeof updates.showOnKiosk === 'boolean') dbUpdates.showOnKiosk = updates.showOnKiosk ? 1 : 0;
        if (typeof updates.allowAutopilot === 'boolean') dbUpdates.allowAutopilot = updates.allowAutopilot ? 1 : 0;
        if (typeof updates.isActive === 'boolean') dbUpdates.isActive = updates.isActive ? 1 : 0;
        
        await db.update(programs)
          .set(dbUpdates)
          .where(eq(programs.id, id));
        
        return { success: true };
      }),

    // Delete a program
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { programs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db.delete(programs).where(eq(programs.id, input.id));
        
        return { success: true };
      }),
  }),
  
  // Smart Enrollment (Typeform-style + Kai-ready architecture)
  enrollment: router({    
    // Create new enrollment (draft)
    create: publicProcedure
      .input(z.object({
        source: z.enum(['kai', 'form', 'staff']).default('form'),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const result = await db.insert(enrollments).values({
          source: input.source,
          status: 'draft',
          firstName: '',
          lastName: '',
        });
        
        // MySQL returns insertId in different formats depending on driver
        const enrollmentId = Number(result[0]?.insertId || result.insertId);
        
        // Fetch the created enrollment
        const { eq } = await import("drizzle-orm");
        const [enrollment] = await db.select().from(enrollments)
          .where(eq(enrollments.id, enrollmentId))
          .limit(1);
        
        return { success: true, enrollmentId: enrollment.id, enrollment };
      }),
    
    // Update enrollment step-by-step (Kai-ready: external control)
    updateStep: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
        stepId: z.string(), // e.g., 'student_info', 'contact_info', 'parent_info'
        data: z.any(), // Step-specific data
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Map stepId to database fields
        const updateData: any = {};
        
        switch (input.stepId) {
          case 'student_info':
            if (input.data.firstName) updateData.firstName = input.data.firstName;
            if (input.data.lastName) updateData.lastName = input.data.lastName;
            if (input.data.dateOfBirth) updateData.dateOfBirth = new Date(input.data.dateOfBirth);
            if (input.data.age) updateData.age = input.data.age;
            break;
          
          case 'contact_info':
            if (input.data.phone) updateData.phone = input.data.phone;
            if (input.data.email) updateData.email = input.data.email;
            if (input.data.streetAddress) updateData.streetAddress = input.data.streetAddress;
            if (input.data.city) updateData.city = input.data.city;
            if (input.data.state) updateData.state = input.data.state;
            if (input.data.zipCode) updateData.zipCode = input.data.zipCode;
            break;
          
          case 'parent_info':
            if (input.data.guardianName) updateData.guardianName = input.data.guardianName;
            if (input.data.guardianRelationship) updateData.guardianRelationship = input.data.guardianRelationship;
            if (input.data.guardianPhone) updateData.guardianPhone = input.data.guardianPhone;
            if (input.data.guardianEmail) updateData.guardianEmail = input.data.guardianEmail;
            break;
          
          case 'program_interest':
            if (input.data.programInterest) updateData.programInterest = input.data.programInterest;
            if (input.data.experienceLevel) updateData.experienceLevel = input.data.experienceLevel;
            if (input.data.classType) updateData.classType = input.data.classType;
            break;
          
          case 'goals_motivation':
            if (input.data.goals) updateData.goals = input.data.goals;
            if (input.data.motivation) updateData.motivation = input.data.motivation;
            break;
          
          case 'medical_info':
            if (input.data.allergies) updateData.allergies = input.data.allergies;
            if (input.data.medicalConditions) updateData.medicalConditions = input.data.medicalConditions;
            if (input.data.emergencyContactName) updateData.emergencyContactName = input.data.emergencyContactName;
            if (input.data.emergencyContactPhone) updateData.emergencyContactPhone = input.data.emergencyContactPhone;
            break;
          
          case 'pricing':
            if (input.data.selectedMembershipPlan) updateData.selectedMembershipPlan = input.data.selectedMembershipPlan;
            if (input.data.pricingNotes) updateData.pricingNotes = input.data.pricingNotes;
            break;
          
          case 'waiver':
            if (input.data.waiverSigned !== undefined) updateData.waiverSigned = input.data.waiverSigned;
            if (input.data.waiverSignature) updateData.waiverSignature = input.data.waiverSignature;
            if (input.data.waiverSignedAt) updateData.waiverSignedAt = new Date(input.data.waiverSignedAt);
            if (input.data.consentGiven !== undefined) updateData.consentGiven = input.data.consentGiven;
            break;
        }
        
        updateData.updatedAt = new Date();
        
        await db.update(enrollments)
          .set(updateData)
          .where(eq(enrollments.id, input.enrollmentId));
        
        return { success: true };
      }),
    
    // Get enrollment by ID (for resume capability)
    get: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const enrollment = await db.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId)).limit(1);
        
        if (enrollment.length === 0) {
          throw new Error('Enrollment not found');
        }
        
        return { enrollment: enrollment[0] };
      }),
    
    // Submit enrollment (finalize)
    submit: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments, leads, students } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get enrollment
        const enrollment = await db.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId)).limit(1);
        
        if (enrollment.length === 0) {
          throw new Error('Enrollment not found');
        }
        
        const enroll = enrollment[0];
        
        // Validate required fields
        if (!enroll.firstName || !enroll.lastName) {
          throw new Error('Student name is required');
        }
        
        if (!enroll.waiverSigned) {
          throw new Error('Waiver must be signed');
        }
        
        // Create lead record
        const [lead] = await db.insert(leads).values({
          firstName: enroll.firstName,
          lastName: enroll.lastName,
          email: enroll.email || '',
          phone: enroll.phone || '',
          status: 'New Lead',
          source: enroll.source === 'kai' ? 'Kai Enrollment' : 'Kiosk Enrollment',
          notes: `Program Interest: ${enroll.programInterest || 'Not specified'}\nExperience: ${enroll.experienceLevel || 'Not specified'}\nGoals: ${enroll.goals || 'Not specified'}`,
          createdAt:new Date().toISOString(),
        }).returning();
        
        // Update enrollment status
        await db.update(enrollments)
          .set({ 
            status: 'submitted',
            submittedAt:new Date().toISOString(),
          })
          .where(eq(enrollments.id, input.enrollmentId));
        
        return { 
          success: true, 
          leadId: lead.id,
          message: 'Enrollment submitted successfully! Our staff will contact you soon.'
        };
      }),
    
    // Kai-guided conversation
    kaiConverse: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
        userMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { enrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");
        
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Get current enrollment state
        const enrollment = await db.select().from(enrollments)
          .where(eq(enrollments.id, input.enrollmentId))
          .limit(1);
        
        if (enrollment.length === 0) {
          throw new Error('Enrollment not found');
        }
        
        const currentData = enrollment[0];
        
        // Build conversation context
        const conversationHistory = currentData.conversationTranscript 
          ? JSON.parse(currentData.conversationTranscript as string)
          : [];
        
        // Determine what fields are still needed
        const missingFields = [];
        if (!currentData.firstName || !currentData.lastName) missingFields.push('student_name');
        if (!currentData.dateOfBirth && !currentData.age) missingFields.push('date_of_birth_or_age');
        if (!currentData.phone && !currentData.email) missingFields.push('contact_info');
        if (!currentData.streetAddress) missingFields.push('address');
        
        // Check if guardian info needed (if under 18)
        const needsGuardian = currentData.age && currentData.age < 18;
        if (needsGuardian && !currentData.guardianName) missingFields.push('guardian_info');
        
        if (!currentData.programInterest) missingFields.push('program_interest');
        if (!currentData.experienceLevel) missingFields.push('experience_level');
        if (!currentData.goals) missingFields.push('goals_motivation');
        if (!currentData.emergencyContactName) missingFields.push('emergency_contact');
        if (!currentData.selectedMembershipPlan) missingFields.push('membership_plan');
        if (!currentData.waiverSigned) missingFields.push('waiver_signature');
        
        const isComplete = missingFields.length === 0;
        
        // Build system prompt for Kai
        const systemPrompt = `You are Kai, a friendly enrollment assistant for DojoFlow martial arts school.

Your role:
- Guide the user through enrollment by asking ONE question at a time
- Extract information from user responses using the provided JSON schema
- Be conversational but efficient
- Adapt questions based on previous answers (e.g., skip parent info if adult)
- Never ask for information already collected

Current enrollment progress:
${JSON.stringify({
  firstName: currentData.firstName,
  lastName: currentData.lastName,
  age: currentData.age,
  dateOfBirth: currentData.dateOfBirth,
  phone: currentData.phone,
  email: currentData.email,
  address: currentData.streetAddress ? 'collected' : 'missing',
  guardianInfo: needsGuardian ? (currentData.guardianName ? 'collected' : 'missing') : 'not needed',
  programInterest: currentData.programInterest,
  experienceLevel: currentData.experienceLevel,
  goals: currentData.goals ? 'collected' : 'missing',
  emergencyContact: currentData.emergencyContactName ? 'collected' : 'missing',
  membershipPlan: currentData.selectedMembershipPlan,
  waiverSigned: currentData.waiverSigned,
}, null, 2)}

Missing fields: ${missingFields.join(', ')}

Instructions:
1. If user just provided information, acknowledge it warmly
2. Ask for the NEXT missing field using natural language
3. Extract any information from the user's message into the JSON response
4. Keep responses brief (2-3 sentences max)
5. For waiver, explain it's required and ask for digital signature confirmation
6. When all fields collected, congratulate them and confirm submission

Membership plans available:
- Kids (Ages 6-12): $99/month
- Teens (Ages 13-17): $119/month  
- Adults (18+): $139/month
- Family (2+ members): $249/month`;
        
        // Call LLM with structured output
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: input.userMessage },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'enrollment_extraction',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  kai_response: { type: 'string', description: 'Kai\'s conversational response to the user' },
                  extracted_data: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      dateOfBirth: { type: 'string' },
                      age: { type: 'number' },
                      phone: { type: 'string' },
                      email: { type: 'string' },
                      streetAddress: { type: 'string' },
                      city: { type: 'string' },
                      state: { type: 'string' },
                      zipCode: { type: 'string' },
                      guardianName: { type: 'string' },
                      guardianRelationship: { type: 'string' },
                      guardianPhone: { type: 'string' },
                      guardianEmail: { type: 'string' },
                      programInterest: { type: 'string' },
                      experienceLevel: { type: 'string' },
                      classType: { type: 'string' },
                      goals: { type: 'string' },
                      motivation: { type: 'string' },
                      allergies: { type: 'string' },
                      medicalConditions: { type: 'string' },
                      emergencyContactName: { type: 'string' },
                      emergencyContactPhone: { type: 'string' },
                      selectedMembershipPlan: { type: 'string' },
                      waiverSigned: { type: 'boolean' },
                      consentGiven: { type: 'boolean' },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  is_complete: { type: 'boolean', description: 'True if all required fields are now collected' },
                },
                required: ['kai_response', 'extracted_data', 'is_complete'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const result = JSON.parse(response.choices[0].message.content || '{}');
        
        // Update enrollment with extracted data
        const updateData: any = {};
        const extracted = result.extracted_data || {};
        
        if (extracted.firstName) updateData.firstName = extracted.firstName;
        if (extracted.lastName) updateData.lastName = extracted.lastName;
        if (extracted.dateOfBirth) updateData.dateOfBirth = new Date(extracted.dateOfBirth);
        if (extracted.age) updateData.age = extracted.age;
        if (extracted.phone) updateData.phone = extracted.phone;
        if (extracted.email) updateData.email = extracted.email;
        if (extracted.streetAddress) updateData.streetAddress = extracted.streetAddress;
        if (extracted.city) updateData.city = extracted.city;
        if (extracted.state) updateData.state = extracted.state;
        if (extracted.zipCode) updateData.zipCode = extracted.zipCode;
        if (extracted.guardianName) updateData.guardianName = extracted.guardianName;
        if (extracted.guardianRelationship) updateData.guardianRelationship = extracted.guardianRelationship;
        if (extracted.guardianPhone) updateData.guardianPhone = extracted.guardianPhone;
        if (extracted.guardianEmail) updateData.guardianEmail = extracted.guardianEmail;
        if (extracted.programInterest) updateData.programInterest = extracted.programInterest;
        if (extracted.experienceLevel) updateData.experienceLevel = extracted.experienceLevel;
        if (extracted.classType) updateData.classType = extracted.classType;
        if (extracted.goals) updateData.goals = extracted.goals;
        if (extracted.motivation) updateData.motivation = extracted.motivation;
        if (extracted.allergies) updateData.allergies = extracted.allergies;
        if (extracted.medicalConditions) updateData.medicalConditions = extracted.medicalConditions;
        if (extracted.emergencyContactName) updateData.emergencyContactName = extracted.emergencyContactName;
        if (extracted.emergencyContactPhone) updateData.emergencyContactPhone = extracted.emergencyContactPhone;
        if (extracted.selectedMembershipPlan) updateData.selectedMembershipPlan = extracted.selectedMembershipPlan;
        if (extracted.waiverSigned !== undefined) {
          updateData.waiverSigned = extracted.waiverSigned ? 1 : 0;
          if (extracted.waiverSigned) {
            updateData.waiverSignedAt = new Date();
          }
        }
        if (extracted.consentGiven !== undefined) updateData.consentGiven = extracted.consentGiven ? 1 : 0;
        
        // Update conversation history
        conversationHistory.push(
          { role: 'user', content: input.userMessage },
          { role: 'assistant', content: result.kai_response }
        );
        updateData.conversationTranscript = JSON.stringify(conversationHistory);
        
        // Save to database
        await db.update(enrollments)
          .set(updateData)
          .where(eq(enrollments.id, input.enrollmentId));
        
        // If complete, submit enrollment
        if (result.is_complete) {
          // Auto-submit
          const updatedEnrollment = await db.select().from(enrollments)
            .where(eq(enrollments.id, input.enrollmentId))
            .limit(1);
          
          if (updatedEnrollment.length > 0 && updatedEnrollment[0].waiverSigned) {
            const { leads } = await import("../drizzle/schema");
            const enroll = updatedEnrollment[0];
            
            // Create lead
            await db.insert(leads).values({
              firstName: enroll.firstName,
              lastName: enroll.lastName,
              email: enroll.email || '',
              phone: enroll.phone || '',
              status: 'New Lead',
              source: 'Kai Enrollment',
              notes: `Program Interest: ${enroll.programInterest || 'Not specified'}\nExperience: ${enroll.experienceLevel || 'Not specified'}\nGoals: ${enroll.goals || 'Not specified'}`,
              createdAt:new Date().toISOString(),
            });
            
            // Update enrollment status
            await db.update(enrollments)
              .set({ 
                status: 'submitted',
                submittedAt:new Date().toISOString(),
              })
              .where(eq(enrollments.id, input.enrollmentId));
          }
        }
        
        return {
          kaiResponse: result.kai_response,
          extractedData: extracted,
          isComplete: result.is_complete || false,
        };
      }),
    
    // Validate step data (reusable by Kai)
    validateStep: publicProcedure
      .input(z.object({
        stepId: z.string(),
        data: z.any(),
      }))
      .query(({ input }) => {
        const errors: string[] = [];
        
        switch (input.stepId) {
          case 'student_info':
            if (!input.data.firstName) errors.push('First name is required');
            if (!input.data.lastName) errors.push('Last name is required');
            if (!input.data.dateOfBirth && !input.data.age) errors.push('Date of birth or age is required');
            break;
          
          case 'contact_info':
            if (!input.data.phone && !input.data.email) errors.push('Phone or email is required');
            if (input.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.data.email)) {
              errors.push('Invalid email format');
            }
            break;
          
          case 'parent_info':
            // Only required if student is under 18
            if (input.data.requiresGuardian) {
              if (!input.data.guardianName) errors.push('Guardian name is required for students under 18');
              if (!input.data.guardianPhone && !input.data.guardianEmail) {
                errors.push('Guardian contact information is required');
              }
            }
            break;
          
          case 'waiver':
            if (!input.data.waiverSigned) errors.push('Waiver must be signed');
            if (!input.data.consentGiven) errors.push('Consent must be given');
            break;
        }
        
        return { valid: errors.length === 0, errors };
      }),
  }),
  }),
  reports: router({
    getDashboard: protectedProcedure
      .query(async ({ ctx }) => {
        try {
        const orgId = ctx.currentOrganizationId;
        const { students: studentsTable, studentTuition, studentAttendance, programEnrollments: programEnrollmentsTable, programs: programsTable, classes: classesTable } = await import('../drizzle/schema');
        const { getDb } = await import('./db');
        const { eq, and, gte, lte, lt, sql, desc, count, sum, or } = await import('drizzle-orm');
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Money collected - all time
        const paidAll = await db.select({ total: sum(studentTuition.amount) }).from(studentTuition).where(eq(studentTuition.status, 'paid'));
        const moneyCollectedTotal = Number(paidAll[0]?.total || 0);

        // Money collected - this month
        const paidThisMonth = await db.select({ total: sum(studentTuition.amount) }).from(studentTuition).where(and(eq(studentTuition.status, 'paid'), gte(studentTuition.paidDate, thisMonthStart.toISOString())));
        const moneyCollectedThisMonth = Number(paidThisMonth[0]?.total || 0);

        // Money collected - last month
        const paidLastMonth = await db.select({ total: sum(studentTuition.amount) }).from(studentTuition).where(and(eq(studentTuition.status, 'paid'), gte(studentTuition.paidDate, lastMonthStart.toISOString()), lte(studentTuition.paidDate, lastMonthEnd.toISOString())));
        const moneyCollectedLastMonth = Number(paidLastMonth[0]?.total || 0);

        // Delinquent accounts (overdue or past-due pending)
        const delinquentRows = await db.select({ studentId: studentTuition.studentId, totalOwed: sum(studentTuition.amount) }).from(studentTuition).where(or(eq(studentTuition.status, 'overdue'), and(eq(studentTuition.status, 'pending'), lt(studentTuition.dueDate, now.toISOString())))).groupBy(studentTuition.studentId);
        const delinquentWithNames = await Promise.all(delinquentRows.slice(0, 20).map(async (d) => {
          const s = await db.select({ firstName: studentsTable.firstName, lastName: studentsTable.lastName, email: studentsTable.email }).from(studentsTable).where(eq(studentsTable.id, d.studentId)).limit(1);
          return { studentId: d.studentId, name: s[0] ? `${s[0].firstName} ${s[0].lastName}` : 'Unknown', email: s[0]?.email || '', amountOwed: Number(d.totalOwed || 0) };
        }));

        // Attendance last 30 days
        const attendanceLast30 = await db.select({ date: sql<string>`DATE(${studentAttendance.classDate}) as classDay`, attended: sql<number>`SUM(CASE WHEN ${studentAttendance.status} = 'attended' THEN 1 ELSE 0 END) as attended`, missed: sql<number>`SUM(CASE WHEN ${studentAttendance.status} = 'missed' THEN 1 ELSE 0 END) as missed` }).from(studentAttendance).where(gte(studentAttendance.classDate, thirtyDaysAgo.toISOString())).groupBy(sql`classDay`).orderBy(sql`classDay`);
        const totalAttended30 = attendanceLast30.reduce((s, r) => s + Number(r.attended || 0), 0);
        const totalMissed30 = attendanceLast30.reduce((s, r) => s + Number(r.missed || 0), 0);
        const attendanceRate30 = totalAttended30 + totalMissed30 > 0 ? Math.round((totalAttended30 / (totalAttended30 + totalMissed30)) * 100) : 0;

        // All-time attendance
        const allTimeAtt = await db.select({ attended: sql<number>`SUM(CASE WHEN ${studentAttendance.status} = 'attended' THEN 1 ELSE 0 END)`, missed: sql<number>`SUM(CASE WHEN ${studentAttendance.status} = 'missed' THEN 1 ELSE 0 END)` }).from(studentAttendance);
        const attendanceRateAllTime = (Number(allTimeAtt[0]?.attended || 0) + Number(allTimeAtt[0]?.missed || 0)) > 0 ? Math.round((Number(allTimeAtt[0]?.attended || 0) / (Number(allTimeAtt[0]?.attended || 0) + Number(allTimeAtt[0]?.missed || 0))) * 100) : 0;

        // Most/least popular classes
        const classAtt = await db.select({ classId: studentAttendance.classId, className: studentAttendance.className, attendanceCount: count() }).from(studentAttendance).where(eq(studentAttendance.status, 'attended')).groupBy(studentAttendance.classId, studentAttendance.className).orderBy(desc(count()));
        const mostPopularClass = classAtt[0] || null;
        const leastPopularClass = classAtt.length > 1 ? classAtt[classAtt.length - 1] : null;

        // Program enrollments
        const progEnroll = await db.select({ programId: programEnrollmentsTable.programId, enrollmentCount: count() }).from(programEnrollmentsTable).where(eq(programEnrollmentsTable.status, 'active')).groupBy(programEnrollmentsTable.programId).orderBy(desc(count()));
        const progWithNames = await Promise.all(progEnroll.map(async (pe) => {
          const prog = await db.select({ name: programsTable.name, type: programsTable.type, maxSize: programsTable.maxSize }).from(programsTable).where(eq(programsTable.id, pe.programId)).limit(1);
          const cnt = Number(pe.enrollmentCount);
          const maxSz = prog[0]?.maxSize || 20;
          return { programId: pe.programId, name: prog[0]?.name || `Program #${pe.programId}`, type: prog[0]?.type || 'unknown', maxSize: maxSz, enrollmentCount: cnt, fillRate: Math.round((cnt / maxSz) * 100) };
        }));
        const mostPopularProgram = progWithNames[0] || null;
        const underperformingPrograms = progWithNames.filter(p => p.fillRate < 30).slice(0, 5);

        // Active students
        const activeStudentsRes = await db.select({ count: count() }).from(studentsTable).where(orgId ? and(eq(studentsTable.status, 'Active'), eq(studentsTable.organizationId, orgId)) : eq(studentsTable.status, 'Active'));
        const activeStudents = Number(activeStudentsRes[0]?.count || 0);

        // New students this month
        const newStudentsRes = await db.select({ count: count() }).from(studentsTable).where(gte(studentsTable.createdAt, thisMonthStart.toISOString()));
        const newStudentsCount = Number(newStudentsRes[0]?.count || 0);

        // Monthly revenue trend (last 6 months)
        const monthlyRevenueTrend: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
          const mRev = await db.select({ total: sum(studentTuition.amount) }).from(studentTuition).where(and(eq(studentTuition.status, 'paid'), gte(studentTuition.paidDate, mStart.toISOString()), lte(studentTuition.paidDate, mEnd.toISOString())));
          monthlyRevenueTrend.push({ month: mStart.toLocaleString('default', { month: 'short', year: '2-digit' }), revenue: Number(mRev[0]?.total || 0) });
        }

        console.log('[getDashboard] returning stats:', JSON.stringify({ moneyCollectedTotal, moneyCollectedThisMonth, activeStudents, delinquentCount: delinquentRows.length, orgId }));
        return {
          moneyCollectedTotal,
          moneyCollectedThisMonth,
          moneyCollectedLastMonth,
          delinquentAccounts: delinquentWithNames,
          delinquentCount: delinquentRows.length,
          delinquentTotalOwed: delinquentWithNames.reduce((s, d) => s + d.amountOwed, 0),
          attendanceLast30Days: attendanceLast30,
          totalAttended30,
          totalMissed30,
          attendanceRate30,
          attendanceRateAllTime,
          mostPopularClass,
          leastPopularClass,
          classAttendanceCounts: classAtt.slice(0, 10),
          mostPopularProgram,
          underperformingPrograms,
          programEnrollments: progWithNames,
          activeStudents,
          newStudentsCount,
          monthlyRevenueTrend,
        };
        } catch (err) {
          console.error('[getDashboard] Error:', err);
          throw err;
        }
      }),

    sendPaymentReminder: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        method: z.enum(['sms', 'email', 'both']),
        customMessage: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const orgId = ctx.currentOrganizationId;
        const { students: studentsTable, studentTuition } = await import('../drizzle/schema');
        const { getDb: getDbInner } = await import('./db');
        const { eq: eqInner, and: andInner, or: orInner } = await import('drizzle-orm');
        const dbInner = await getDbInner();
        if (!dbInner) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Get student info
        const studentRows = await dbInner.select().from(studentsTable)
          .where(andInner(eqInner(studentsTable.id, input.studentId), eqInner(studentsTable.organizationId, orgId)))
          .limit(1);
        if (!studentRows[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'Student not found' });
        const s = studentRows[0];

        // Get outstanding tuition amount
        const tuitionRows = await dbInner.select().from(studentTuition)
          .where(andInner(
            eqInner(studentTuition.studentId, input.studentId),
            orInner(eqInner(studentTuition.status, 'pending'), eqInner(studentTuition.status, 'overdue'))
          ));
        const totalOwedCents = tuitionRows.reduce((sum, t) => sum + (t.amount || 0), 0);
        const fmt$ = (cents: number) => `$${(cents / 100).toFixed(2)}`;

        const studentName = [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student';
        const defaultMsg = `Hi ${studentName}, this is a friendly reminder that you have an outstanding balance of ${fmt$(totalOwedCents)} with your dojo. Please contact us to arrange payment. Thank you!`;
        const message = input.customMessage || defaultMsg;
        const subject = `Payment Reminder — Outstanding Balance of ${fmt$(totalOwedCents)}`;

        const results: { sms?: string; email?: string } = {};

        if (input.method === 'sms' || input.method === 'both') {
          if (s.phone) {
            try {
              const { sendSMS } = await import('./services/twilio.js');
              await sendSMS(s.phone, message);
              results.sms = 'sent';
            } catch (e: any) {
              results.sms = `failed: ${e.message}`;
            }
          } else {
            results.sms = 'no phone on file';
          }
        }

        if (input.method === 'email' || input.method === 'both') {
          if (s.email) {
            try {
              const { sendEmail } = await import('./services/sendgrid.js');
              const html = `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px"><h2 style="color:#C8102E">Payment Reminder</h2><p>Hi <strong>${studentName}</strong>,</p><p>${message}</p><p style="font-size:12px;color:#888">This message was sent by your dojo via DojoFlow.</p></div>`;
              await sendEmail(s.email, subject, html, message);
              results.email = 'sent';
            } catch (e: any) {
              results.email = `failed: ${e.message}`;
            }
          } else {
            results.email = 'no email on file';
          }
        }

        // ─── Record reminder in history log ──────────────────────────────
        try {
          const { paymentReminders } = await import('../drizzle/schema');
          await dbInner.insert(paymentReminders).values({
            orgId,
            studentId: input.studentId,
            method: input.method,
            smsStatus: results.sms ?? null,
            emailStatus: results.email ?? null,
            messagePreview: message.slice(0, 500),
            sentByUserId: ctx.userId ?? null,
          });
        } catch (_logErr) {
          // Non-fatal: log failure should not block the response
        }
        return { success: true, results, studentName, totalOwedCents };
      }),

    // ─── Get most recent reminder per student ────────────────────────────
    getReminderHistory: protectedProcedure
      .input(z.object({
        studentIds: z.array(z.number()).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const orgId = ctx.currentOrganizationId;
        const { paymentReminders } = await import('../drizzle/schema');
        const { getDb: getDbInner } = await import('./db');
        const { eq: eqInner, and: andInner, inArray, desc } = await import('drizzle-orm');
        const dbInner = await getDbInner();
        if (!dbInner) return [];
        let rows;
        if (input?.studentIds && input.studentIds.length > 0) {
          rows = await dbInner.select().from(paymentReminders)
            .where(andInner(eqInner(paymentReminders.orgId, orgId), inArray(paymentReminders.studentId, input.studentIds)))
            .orderBy(desc(paymentReminders.sentAt));
        } else {
          rows = await dbInner.select().from(paymentReminders)
            .where(eqInner(paymentReminders.orgId, orgId))
            .orderBy(desc(paymentReminders.sentAt));
        }
        // Return the most recent reminder per student
        const byStudent: Record<number, typeof rows[0]> = {};
        for (const row of rows) {
          if (!byStudent[row.studentId]) byStudent[row.studentId] = row;
        }
        return Object.values(byStudent);
      }),
  }),
});

export type AppRouter = typeof appRouter;
