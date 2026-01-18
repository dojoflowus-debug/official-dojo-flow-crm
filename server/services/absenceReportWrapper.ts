/**
 * Absence Report Wrapper Service
 * 
 * Detects absence report queries and wraps results in structured data blocks
 * for the InfoPanel to display
 */

import type { Database } from 'better-sqlite3';

export interface AbsenceReportData {
  studentId: number;
  name: string;
  absenceCount: number;
  attendanceRate: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  program: string;
  beltRank: string;
  lastAbsenceDate?: string;
  photoUrl?: string;
}

export interface StructuredDataBlock {
  type: 'absence_report' | 'student_list' | 'summary_card';
  label: string;
  data?: AbsenceReportData[];
  summary?: {
    totalStudents: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
  };
}

/**
 * Detect if the user message is asking for an absence report
 */
export function isAbsenceReportQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const absenceKeywords = [
    'absence', 'absent', 'inactive', 'inactive students',
    '14 days', '10 days', 'days absence', 'days off',
    'not attending', 'missing class', 'flag students',
    'recovery protocol', 'at-risk', 'at risk'
  ];
  
  return absenceKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Query students with 10+ days of absence
 */
export async function getStudentsWithAbsences(
  db: Database,
  organizationId: number,
  minAbsenceDays: number = 10
): Promise<AbsenceReportData[]> {
  try {
    // Query students with absence data
    const query = `
      SELECT 
        s.id,
        s.firstName,
        s.lastName,
        s.program,
        s.beltRank,
        s.photoUrl,
        COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as absenceCount,
        COUNT(sa.id) as totalAttendanceRecords,
        MAX(sa.date) as lastAbsenceDate
      FROM students s
      LEFT JOIN studentAttendance sa ON s.id = sa.studentId
      WHERE s.organizationId = ?
      GROUP BY s.id
      HAVING absenceCount >= ?
      ORDER BY absenceCount DESC
      LIMIT 50
    `;
    
    const stmt = db.prepare(query);
    const results = stmt.all(organizationId, minAbsenceDays) as any[];
    
    // Transform results to match our interface
    return results.map(row => {
      const attendanceRate = row.totalAttendanceRecords > 0 
        ? ((row.totalAttendanceRecords - row.absenceCount) / row.totalAttendanceRecords) * 100
        : 100;
      
      // Determine risk level based on absence count and attendance rate
      let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (row.absenceCount >= 20 || attendanceRate < 30) {
        riskLevel = 'critical';
      } else if (row.absenceCount >= 15 || attendanceRate < 50) {
        riskLevel = 'high';
      } else if (row.absenceCount >= 10 || attendanceRate < 70) {
        riskLevel = 'medium';
      }
      
      return {
        studentId: row.id,
        name: `${row.firstName} ${row.lastName}`,
        absenceCount: row.absenceCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        riskLevel,
        program: row.program || 'Unknown',
        beltRank: row.beltRank || 'White',
        lastAbsenceDate: row.lastAbsenceDate,
        photoUrl: row.photoUrl,
      };
    });
  } catch (error) {
    console.error('[AbsenceReportWrapper] Error querying absence data:', error);
    return [];
  }
}

/**
 * Wrap absence report data in structured blocks for InfoPanel
 */
export function wrapAbsenceReportData(
  students: AbsenceReportData[]
): StructuredDataBlock[] {
  if (students.length === 0) {
    return [];
  }
  
  // Count risk levels
  const summary = {
    totalStudents: students.length,
    criticalCount: students.filter(s => s.riskLevel === 'critical').length,
    highCount: students.filter(s => s.riskLevel === 'high').length,
    mediumCount: students.filter(s => s.riskLevel === 'medium').length,
  };
  
  return [
    {
      type: 'absence_report',
      label: 'Students with 10+ Days Absence',
      data: students,
    },
    {
      type: 'summary_card',
      label: 'Absence Report Summary',
      summary,
    },
  ];
}

/**
 * Process a message and return structured data blocks if it's an absence report query
 */
export async function processAbsenceReportQuery(
  message: string,
  db: Database,
  organizationId: number
): Promise<StructuredDataBlock[] | null> {
  if (!isAbsenceReportQuery(message)) {
    return null;
  }
  
  console.log('[AbsenceReportWrapper] Processing absence report query');
  
  const students = await getStudentsWithAbsences(db, organizationId);
  console.log('[AbsenceReportWrapper] Found', students.length, 'students with absences');
  
  if (students.length === 0) {
    return null;
  }
  
  return wrapAbsenceReportData(students);
}
