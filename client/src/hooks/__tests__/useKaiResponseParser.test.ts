import { renderHook } from '@testing-library/react';
import { useKaiResponseParser } from '../useKaiResponseParser';

describe('useKaiResponseParser', () => {
  it('should parse absence report and return InfoPanelData', () => {
    const { result } = renderHook(() => useKaiResponseParser());
    
    const absenceReportJson = JSON.stringify({
      type: 'absence_report',
      students: [
        {
          id: 1,
          name: 'Ashley Walters',
          rank: 'Yellow Belt',
          program: 'Ki Martial Arts VA',
          photoUrl: 'https://example.com/photo.jpg',
          absences: 18,
          attended: 39,
          attendanceRate: 68.4,
          riskLevel: 'critical'
        },
        {
          id: 2,
          name: 'Marcus Johnson',
          rank: 'Orange Belt',
          program: 'Ki Martial Arts VA',
          absences: 16,
          attended: 45,
          attendanceRate: 73.8,
          riskLevel: 'high'
        }
      ],
      summary: {
        totalStudents: 8,
        totalAbsences: 112,
        averageAttendanceRate: 75.5,
        criticalCount: 2,
        highCount: 3
      }
    });
    
    const response = `Here are the students with 10+ days absence:\n[ABSENCE_REPORT:${absenceReportJson}[/ABSENCE_REPORT]`;
    
    const infoPanelData = result.current.parseResponse(response);
    
    expect(infoPanelData).not.toBeNull();
    expect(infoPanelData?.studentCard?.name).toBe('Ashley Walters');
    expect(infoPanelData?.summaryCards).toHaveLength(3);
    expect(infoPanelData?.reportCards).toHaveLength(2);
  });

  it('should return null for responses without structured data', () => {
    const { result } = renderHook(() => useKaiResponseParser());
    
    const response = 'This is a regular message without any structured data.';
    const infoPanelData = result.current.parseResponse(response);
    
    expect(infoPanelData).toBeNull();
  });

  it('should parse student profile data', () => {
    const { result } = renderHook(() => useKaiResponseParser());
    
    const profileJson = JSON.stringify({
      type: 'student_profile',
      id: 1,
      name: 'Ashley Walters',
      rank: 'Yellow Belt',
      program: 'Ki Martial Arts VA',
      photoUrl: 'https://example.com/photo.jpg',
      attendance: 68,
      absences: 18,
      attendanceRate: 68.4,
      atRisk: true,
      recommendations: 8
    });
    
    const response = `Student profile:\n[STUDENT_PROFILE:${profileJson}[/STUDENT_PROFILE]`;
    
    const infoPanelData = result.current.parseResponse(response);
    
    expect(infoPanelData).not.toBeNull();
    expect(infoPanelData?.studentCard?.name).toBe('Ashley Walters');
    expect(infoPanelData?.studentCard?.atRisk).toBe(true);
  });

  it('should parse summary stats data', () => {
    const { result } = renderHook(() => useKaiResponseParser());
    
    const statsJson = JSON.stringify({
      type: 'summary_stats',
      items: [
        { label: 'Total Students', value: 120, accent: 'blue' },
        { label: 'At-Risk', value: 15, accent: 'red' },
        { label: 'Avg Attendance', value: 85, accent: 'green' }
      ]
    });
    
    const response = `Summary:\n[SUMMARY_STATS:${statsJson}[/SUMMARY_STATS]`;
    
    const infoPanelData = result.current.parseResponse(response);
    
    expect(infoPanelData).not.toBeNull();
    expect(infoPanelData?.summaryCards).toHaveLength(3);
    expect(infoPanelData?.summaryCards?.[0].value).toBe(120);
  });
});
