/**
 * Kai Data Service
 * Provides real-time data access for the Kai AI assistant
 * Uses the local tRPC API endpoints
 */

// Use relative path for API calls to work with the current server
const API_BASE = '';

export const kaiDataService = {
  /**
   * Get all students data via tRPC
   */
  async getStudents() {
    console.log('[KaiDataService] getStudents() called');
    try {
      console.log('[KaiDataService] Fetching from /api/trpc/students.list');
      const response = await fetch(`${API_BASE}/api/trpc/students.list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('[KaiDataService] Response status:', response.status, response.statusText);
      if (response.ok) {
        const result = await response.json();
        console.log('[KaiDataService] Students result:', result);
        // tRPC wraps the response in a result object
        const students = result?.result?.data || [];
        console.log('[KaiDataService] Student count:', students.length);
        return {
          success: true,
          data: students,
          count: students.length
        };
      }
      console.error('[KaiDataService] Response not OK:', response.status);
      return { success: false, error: 'Failed to fetch students' };
    } catch (error) {
      console.error('[KaiDataService] Error fetching students:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Get all leads data via tRPC
   */
  async getLeads() {
    try {
      const response = await fetch(`${API_BASE}/api/trpc/leads.list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        const leads = result?.result?.data || [];
        return {
          success: true,
          data: leads,
          count: leads.length
        };
      }
      return { success: false, error: 'Failed to fetch leads' };
    } catch (error) {
      console.error('Error fetching leads:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Get all classes data via tRPC
   */
  async getClasses() {
    try {
      const response = await fetch(`${API_BASE}/api/trpc/classes.list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const result = await response.json();
        const classes = result?.result?.data || [];
        return {
          success: true,
          data: classes,
          count: classes.length
        };
      }
      return { success: false, error: 'Failed to fetch classes' };
    } catch (error) {
      console.error('Error fetching classes:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Get attendance data
   */
  async getAttendance() {
    try {
      // Attendance might not have a dedicated endpoint, return empty for now
      return {
        success: true,
        data: [],
        count: 0
      };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Get comprehensive dashboard stats via tRPC
   */
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE}/api/trpc/dashboard.stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const stats = result?.result?.data || {};
        
        return {
          success: true,
          data: {
            totalStudents: stats.total_students || 0,
            activeStudents: stats.total_students || 0,
            overduePayments: 0,
            totalLeads: stats.total_leads || 0,
            hotLeads: 0,
            totalClasses: stats.todays_classes?.length || 0,
            totalAttendance: 0,
            monthlyRevenue: stats.monthly_revenue || 0
          }
        };
      }
      
      // Fallback: fetch individual data
      const [students, leads, classes] = await Promise.all([
        this.getStudents(),
        this.getLeads(),
        this.getClasses()
      ]);

      const studentData = students.success ? students.data : [];
      const leadsData = leads.success ? leads.data : [];
      const classesData = classes.success ? classes.data : [];

      // Calculate stats
      const activeStudents = studentData.filter((s: any) => s.status === 'Active').length;
      const overduePayments = studentData.filter((s: any) => s.membershipStatus === 'Overdue').length;
      const hotLeads = leadsData.filter((l: any) => l.status === 'Hot').length;
      
      // Calculate monthly revenue (sum of all paid memberships)
      const monthlyRevenue = studentData
        .filter((s: any) => s.membershipStatus === 'Paid')
        .reduce((sum: number, s: any) => sum + (s.monthlyFee || 150), 0);

      return {
        success: true,
        data: {
          totalStudents: studentData.length,
          activeStudents,
          overduePayments,
          totalLeads: leadsData.length,
          hotLeads,
          totalClasses: classesData.length,
          totalAttendance: 0,
          monthlyRevenue
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, error: (error as Error).message };
    }
  }
};

export default kaiDataService;
