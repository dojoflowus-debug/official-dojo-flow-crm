/**
 * Kai Metric Handler
 * Processes natural language metric queries and returns formatted responses
 */

import { classifyIntent } from './kai-nlp-router';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { students, leads, classes, studentAttendance, studentTuition } from "../drizzle/schema";

export interface MetricQuery {
  query: string;
  procedure: string;
  confidence: number;
  module: string;
}

export interface MetricResponse {
  success: boolean;
  data?: any;
  message: string;
  procedure: string;
  followUp?: string[];
}

/**
 * Process a natural language metric query
 */
export async function processMetricQuery(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const classification = classifyIntent(query);

    if (!classification) {
      return {
        success: false,
        message: "I'm not sure what metrics you are looking for. Try asking about revenue, students, classes, check-ins, or overdue accounts.",
        procedure: 'unknown',
      };
    }

    const response = await routeToMetricHandler(
      classification.procedure,
      query,
      organizationId
    );

    return response;
  } catch (error) {
    console.error('[Kai] Metric query error:', error);
    return {
      success: false,
      message: 'Something went wrong — please try again.',
      procedure: 'error',
    };
  }
}

/**
 * Route query to appropriate metric handler
 */
async function routeToMetricHandler(
  procedure: string,
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  switch (procedure) {
    case 'getRevenueSummary':
      return handleRevenueSummary(query, organizationId);
    case 'getOverdueAccounts':
      return handleOverdueAccounts(query, organizationId);
    case 'listClasses':
      return handleListClasses(query, organizationId);
    case 'getClassCapacity':
      return handleClassCapacity(query, organizationId);
    case 'getAttendanceSummary':
      return handleAttendanceSummary(query, organizationId);
    case 'getKioskToday':
      return handleKioskToday(query, organizationId);
    case 'getNewVisitors':
      return handleNewVisitors(query, organizationId);
    case 'searchStudents':
      return handleStudentMetrics(query, organizationId);
    case 'listAtRiskStudents':
      return handleAtRiskStudents(query, organizationId);
    case 'searchLeads':
      return handleLeadMetrics(query, organizationId);
    default:
      return {
        success: false,
        message: `I recognize this is about ${procedure}, but I need more specific information.`,
        procedure,
      };
  }
}

/**
 * Handle revenue summary queries
 */
async function handleRevenueSummary(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const tuitionData = await db
      .select()
      .from(studentTuition)
      .where(eq(studentTuition.organizationId, organizationId));

    const totalRevenue = tuitionData.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
    const paidCount = tuitionData.filter((t) => t.status === 'paid').length;
    const pendingCount = tuitionData.filter((t) => t.status === 'pending').length;

    const message = `Your dojo has earned $${(totalRevenue / 100).toLocaleString()} in revenue. You have ${paidCount} paid invoices and ${pendingCount} pending. Would you like to see details about overdue accounts?`;

    return {
      success: true,
      data: { totalRevenue, paidCount, pendingCount },
      message,
      procedure: 'getRevenueSummary',
      followUp: ['Show me overdue accounts', 'What is my monthly revenue?'],
    };
  } catch (error) {
    console.error('[Kai] Revenue summary error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving revenue data. Please try again.',
      procedure: 'getRevenueSummary',
    };
  }
}

/**
 * Handle overdue accounts queries
 */
async function handleOverdueAccounts(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const overdueData = await db
      .select()
      .from(studentTuition)
      .where(eq(studentTuition.organizationId, organizationId));

    const overdue = overdueData.filter((t) => t.status === 'overdue');
    const totalOverdue = overdue.reduce((sum, t) => sum + (t.amountDue || 0), 0);

    if (overdue.length === 0) {
      return {
        success: true,
        data: { count: 0, total: 0 },
        message: 'Great news! You have no overdue accounts. All payments are current.',
        procedure: 'getOverdueAccounts',
        followUp: ['Show me revenue summary', 'How many students do I have?'],
      };
    }

    const message = `You have ${overdue.length} overdue account(s) totaling $${(totalOverdue / 100).toLocaleString()}. The oldest overdue account is ${overdue[0].daysOverdue || 'unknown'} days past due.`;

    return {
      success: true,
      data: { count: overdue.length, total: totalOverdue, accounts: overdue },
      message,
      procedure: 'getOverdueAccounts',
      followUp: ['List all overdue accounts', 'Show me revenue summary'],
    };
  } catch (error) {
    console.error('[Kai] Overdue accounts error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving overdue account data. Please try again.',
      procedure: 'getOverdueAccounts',
    };
  }
}

/**
 * Handle class listing queries
 */
async function handleListClasses(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const classList = await db
      .select()
      .from(classes)
      .where(eq(classes.organizationId, organizationId));

    if (classList.length === 0) {
      return {
        success: true,
        data: { count: 0 },
        message: 'You currently have no classes scheduled. Would you like to create one?',
        procedure: 'listClasses',
      };
    }

    const totalEnrolled = classList.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
    const message = `You have ${classList.length} class(es) with ${totalEnrolled} students enrolled.`;

    return {
      success: true,
      data: { count: classList.length, classes: classList, totalEnrolled },
      message,
      procedure: 'listClasses',
      followUp: ['Show me class capacity', 'What is the attendance rate?'],
    };
  } catch (error) {
    console.error('[Kai] List classes error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving class data. Please try again.',
      procedure: 'listClasses',
    };
  }
}

/**
 * Handle class capacity queries
 */
async function handleClassCapacity(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const classList = await db
      .select()
      .from(classes)
      .where(eq(classes.organizationId, organizationId));

    const capacityStats = classList.map((c) => ({
      name: c.name,
      enrolled: c.enrolledCount || 0,
      capacity: c.capacity || 0,
      utilization: Math.round(((c.enrolledCount || 0) / (c.capacity || 1)) * 100),
    }));

    const fullClasses = capacityStats.filter((c) => c.utilization >= 100);
    const avgUtilization = Math.round(
      capacityStats.reduce((sum, c) => sum + c.utilization, 0) / capacityStats.length
    );

    const message = `Your classes have ${avgUtilization}% average utilization. ${fullClasses.length} class(es) are at capacity.`;

    return {
      success: true,
      data: { stats: capacityStats, fullClasses },
      message,
      procedure: 'getClassCapacity',
      followUp: ['Which classes are full?', 'Show me all classes'],
    };
  } catch (error) {
    console.error('[Kai] Class capacity error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving class capacity data. Please try again.',
      procedure: 'getClassCapacity',
    };
  }
}

/**
 * Handle attendance summary queries
 */
async function handleAttendanceSummary(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const attendanceData = await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.organizationId, organizationId));

    const attended = attendanceData.filter((a) => a.status === 'attended').length;
    const missed = attendanceData.filter((a) => a.status === 'missed').length;
    const excused = attendanceData.filter((a) => a.status === 'excused').length;

    const total = attended + missed + excused;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

    const message = `Your attendance rate is ${attendanceRate}%. Out of ${total} total records, ${attended} attended, ${missed} missed, and ${excused} were excused.`;

    return {
      success: true,
      data: { attended, missed, excused, total, attendanceRate },
      message,
      procedure: 'getAttendanceSummary',
      followUp: ['Show me attendance trends', 'Which students are at risk?'],
    };
  } catch (error) {
    console.error('[Kai] Attendance summary error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving attendance data. Please try again.',
      procedure: 'getAttendanceSummary',
    };
  }
}

/**
 * Handle kiosk today queries
 */
async function handleKioskToday(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const todayCheckins = await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.organizationId, organizationId));

    const todayCount = todayCheckins.filter((a) => {
      const checkInDate = new Date(a.checkInTime || new Date());
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    }).length;

    const message = `You have had ${todayCount} check-in(s) today. Keep an eye on attendance throughout the day!`;

    return {
      success: true,
      data: { count: todayCount },
      message,
      procedure: 'getKioskToday',
      followUp: ['Show me todays attendance', 'Who checked in?'],
    };
  } catch (error) {
    console.error('[Kai] Kiosk today error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving todays check-in data. Please try again.',
      procedure: 'getKioskToday',
    };
  }
}

/**
 * Handle new visitors queries
 */
async function handleNewVisitors(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const studentList = await db
      .select()
      .from(students)
      .where(eq(students.organizationId, organizationId));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newStudents = studentList.filter((s) => {
      const createdDate = new Date(s.createdAt || new Date());
      return createdDate > thirtyDaysAgo;
    });

    const message = `You have gained ${newStudents.length} new student(s) in the last 30 days. Great growth!`;

    return {
      success: true,
      data: { count: newStudents.length, students: newStudents },
      message,
      procedure: 'getNewVisitors',
      followUp: ['Show me all students', 'What is my student retention rate?'],
    };
  } catch (error) {
    console.error('[Kai] New visitors error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving new visitor data. Please try again.',
      procedure: 'getNewVisitors',
    };
  }
}

/**
 * Handle student metrics queries
 */
async function handleStudentMetrics(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const studentList = await db
      .select()
      .from(students)
      .where(eq(students.organizationId, organizationId));

    const activeStudents = studentList.filter((s) => s.status === 'Active').length;

    const message = `You have ${studentList.length} total students, with ${activeStudents} currently active. Your student base is growing!`;

    return {
      success: true,
      data: { total: studentList.length, active: activeStudents },
      message,
      procedure: 'searchStudents',
      followUp: ['Show me at-risk students', 'What is my student retention?'],
    };
  } catch (error) {
    console.error('[Kai] Student metrics error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving student data. Please try again.',
      procedure: 'searchStudents',
    };
  }
}

/**
 * Handle at-risk students queries
 */
async function handleAtRiskStudents(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const studentList = await db
      .select()
      .from(students)
      .where(eq(students.organizationId, organizationId));

    const atRisk = studentList.filter(
      (s) => s.status === 'At Risk' || s.status === 'Inactive'
    );

    if (atRisk.length === 0) {
      return {
        success: true,
        data: { count: 0 },
        message: 'Excellent! You have no at-risk students. All students are engaged.',
        procedure: 'listAtRiskStudents',
      };
    }

    const message = `You have ${atRisk.length} at-risk student(s). Consider reaching out to offer support.`;

    return {
      success: true,
      data: { count: atRisk.length, students: atRisk },
      message,
      procedure: 'listAtRiskStudents',
      followUp: ['Show me all students', 'What is the attendance rate?'],
    };
  } catch (error) {
    console.error('[Kai] At-risk students error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving at-risk student data. Please try again.',
      procedure: 'listAtRiskStudents',
    };
  }
}

/**
 * Handle lead metrics queries
 */
async function handleLeadMetrics(
  query: string,
  organizationId: number
): Promise<MetricResponse> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const leadList = await db
      .select()
      .from(leads)
      .where(eq(leads.organizationId, organizationId));

    const hotLeads = leadList.filter((l) => l.status === 'Hot').length;
    const warmLeads = leadList.filter((l) => l.status === 'Warm').length;

    const message = `You have ${leadList.length} total leads. ${hotLeads} are hot leads ready to convert, and ${warmLeads} are warm leads. Keep nurturing these opportunities!`;

    return {
      success: true,
      data: { total: leadList.length, hot: hotLeads, warm: warmLeads },
      message,
      procedure: 'searchLeads',
      followUp: ['Show me hot leads', 'What is my conversion rate?'],
    };
  } catch (error) {
    console.error('[Kai] Lead metrics error:', error);
    return {
      success: false,
      message: 'I had trouble retrieving lead data. Please try again.',
      procedure: 'searchLeads',
    };
  }
}
