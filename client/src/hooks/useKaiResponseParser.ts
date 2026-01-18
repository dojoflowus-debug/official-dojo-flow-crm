import { useCallback } from 'react';
import { InfoPanelData } from '@/components/InfoPanel';

/**
 * Hook to parse Kai responses and extract structured data for InfoPanel
 * Detects patterns like:
 * - [ABSENCE_REPORT:...] → Absence report with student data
 * - [STUDENT_PROFILE:...] → Individual student profile
 * - [SUMMARY_STATS:...] → Summary metrics
 */

export interface AbsenceReportData {
  type: 'absence_report';
  students: Array<{
    id: number;
    name: string;
    rank: string;
    program: string;
    photoUrl?: string;
    absences: number;
    attended: number;
    attendanceRate: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
  }>;
  summary: {
    totalStudents: number;
    totalAbsences: number;
    averageAttendanceRate: number;
    criticalCount: number;
    highCount: number;
  };
}

export interface StudentProfileData {
  type: 'student_profile';
  id: number;
  name: string;
  rank: string;
  program: string;
  photoUrl?: string;
  attendance: number;
  absences: number;
  attendanceRate: number;
  atRisk: boolean;
  recommendations: number;
}

export interface SummaryStatsData {
  type: 'summary_stats';
  items: Array<{
    label: string;
    value: number;
    accent: 'blue' | 'red' | 'yellow' | 'green';
  }>;
}

export type StructuredData = AbsenceReportData | StudentProfileData | SummaryStatsData;

export function useKaiResponseParser() {
  /**
   * Parse Kai response for structured data blocks
   * Returns InfoPanelData if structured data is found, null otherwise
   */
  const parseResponse = useCallback((content: string): InfoPanelData | null => {
    // Check for ABSENCE_REPORT pattern
    const absenceReportMatch = content.match(/\[ABSENCE_REPORT:([\s\S]*?)\[\/ABSENCE_REPORT\]/);
    if (absenceReportMatch) {
      try {
        const reportData = JSON.parse(absenceReportMatch[1]) as AbsenceReportData;
        return convertAbsenceReportToInfoPanel(reportData);
      } catch (error) {
        console.error('[KaiResponseParser] Failed to parse absence report:', error);
      }
    }

    // Check for STUDENT_PROFILE pattern
    const profileMatch = content.match(/\[STUDENT_PROFILE:([\s\S]*?)\[\/STUDENT_PROFILE\]/);
    if (profileMatch) {
      try {
        const profileData = JSON.parse(profileMatch[1]) as StudentProfileData;
        return convertStudentProfileToInfoPanel(profileData);
      } catch (error) {
        console.error('[KaiResponseParser] Failed to parse student profile:', error);
      }
    }

    // Check for SUMMARY_STATS pattern
    const statsMatch = content.match(/\[SUMMARY_STATS:([\s\S]*?)\[\/SUMMARY_STATS\]/);
    if (statsMatch) {
      try {
        const statsData = JSON.parse(statsMatch[1]) as SummaryStatsData;
        return convertSummaryStatsToInfoPanel(statsData);
      } catch (error) {
        console.error('[KaiResponseParser] Failed to parse summary stats:', error);
      }
    }

    return null;
  }, []);

  return { parseResponse };
}

/**
 * Convert AbsenceReportData to InfoPanelData format
 */
function convertAbsenceReportToInfoPanel(report: AbsenceReportData): InfoPanelData {
  // Use first student as the main card
  const firstStudent = report.students[0];
  
  return {
    studentCard: firstStudent ? {
      id: firstStudent.id.toString(),
      name: firstStudent.name,
      rank: firstStudent.rank,
      program: firstStudent.program,
      photoUrl: firstStudent.photoUrl,
      attendance: firstStudent.attendanceRate,
      absences: firstStudent.absences,
      atRisk: firstStudent.riskLevel === 'critical' || firstStudent.riskLevel === 'high',
      recommendations: 0,
    } : undefined,
    summaryCards: [
      {
        id: '1',
        label: 'Students',
        value: report.summary.totalStudents,
        accent: 'blue',
      },
      {
        id: '2',
        label: 'AT Risk',
        value: report.summary.criticalCount + report.summary.highCount,
        accent: 'red',
      },
      {
        id: '3',
        label: 'Avg Attendance',
        value: Math.round(report.summary.averageAttendanceRate),
        accent: 'yellow',
      },
    ],
    reportCards: [
      {
        id: '1',
        title: 'Absence Alert',
        description: `${report.students.length} students with 10+ days absence detected`,
        type: 'warning',
      },
      {
        id: '2',
        title: 'Critical Risk',
        description: `${report.summary.criticalCount} student(s) need immediate intervention`,
        type: 'error',
      },
    ],
  };
}

/**
 * Convert StudentProfileData to InfoPanelData format
 */
function convertStudentProfileToInfoPanel(profile: StudentProfileData): InfoPanelData {
  return {
    studentCard: {
      id: profile.id.toString(),
      name: profile.name,
      rank: profile.rank,
      program: profile.program,
      photoUrl: profile.photoUrl,
      attendance: profile.attendanceRate,
      absences: profile.absences,
      atRisk: profile.atRisk,
      recommendations: profile.recommendations,
    },
    summaryCards: [
      {
        id: '1',
        label: 'Attendance',
        value: Math.round(profile.attendanceRate),
        accent: 'blue',
      },
      {
        id: '2',
        label: 'Absences',
        value: profile.absences,
        accent: profile.atRisk ? 'red' : 'yellow',
      },
    ],
    reportCards: profile.atRisk ? [
      {
        id: '1',
        title: 'At-Risk Alert',
        description: 'This student requires attention',
        type: 'warning',
      },
    ] : [],
  };
}

/**
 * Convert SummaryStatsData to InfoPanelData format
 */
function convertSummaryStatsToInfoPanel(stats: SummaryStatsData): InfoPanelData {
  return {
    summaryCards: stats.items.map((item, idx) => ({
      id: idx.toString(),
      label: item.label,
      value: item.value,
      accent: item.accent,
    })),
    reportCards: [],
  };
}
