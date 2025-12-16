import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

// Student session data structure
export interface StudentSession {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string;
  // Program & Belt data
  program?: string;
  beltRank?: string;
  status?: string;
  // Belt progress
  currentBelt?: string;
  nextBelt?: string;
  progressPercent?: number;
  qualifiedClasses?: number;
  classesRequired?: number;
  qualifiedAttendance?: number;
  attendanceRequired?: number;
  isEligible?: boolean;
  nextEvaluationDate?: string;
  // Enrollment data
  enrolledClasses?: Array<{
    id?: number;
    name?: string;
    time?: string;
    dayOfWeek?: string;
    instructor?: string;
  }>;
  // Session metadata
  isKioskMode?: boolean;
  loginTimestamp?: number;
}

interface StudentSessionContextType {
  session: StudentSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isKioskMode: boolean;
  // Actions
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setKioskMode: (enabled: boolean) => void;
}

const StudentSessionContext = createContext<StudentSessionContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  STUDENT_ID: 'student_id',
  STUDENT_EMAIL: 'student_email',
  STUDENT_NAME: 'student_name',
  STUDENT_SESSION: 'student_session',
  KIOSK_MODE: 'kiosk_mode',
  LOGGED_IN: 'student_logged_in',
};

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isKioskMode, setIsKioskModeState] = useState(false);

  // tRPC queries and mutations
  const getByEmailQuery = trpc.studentPortal.getByEmail.useQuery(
    { email: session?.email || '' },
    { enabled: false }
  );
  
  const getDashboardDataQuery = trpc.studentPortal.getDashboardData.useQuery(
    { studentId: session?.id || 0 },
    { enabled: false }
  );

  // Initialize session from localStorage on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const storedSession = localStorage.getItem(STORAGE_KEYS.STUDENT_SESSION);
        const isLoggedIn = localStorage.getItem(STORAGE_KEYS.LOGGED_IN);
        const kioskMode = localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
        
        setIsKioskModeState(kioskMode);
        
        if (storedSession && isLoggedIn === 'true') {
          const parsed = JSON.parse(storedSession) as StudentSession;
          setSession(parsed);
          
          // Refresh session data in background if session is older than 5 minutes
          const sessionAge = Date.now() - (parsed.loginTimestamp || 0);
          if (sessionAge > 5 * 60 * 1000) {
            // Will refresh in background
          }
        }
      } catch (error) {
        console.error('Failed to restore student session:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };
    
    initSession();
  }, []);

  // Clear session data
  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_ID);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_NAME);
    localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
  }, []);

  // Save session to localStorage
  const saveSession = useCallback((sessionData: StudentSession) => {
    const enrichedSession = {
      ...sessionData,
      loginTimestamp: Date.now(),
      isKioskMode,
    };
    
    setSession(enrichedSession);
    localStorage.setItem(STORAGE_KEYS.STUDENT_ID, String(sessionData.id));
    localStorage.setItem(STORAGE_KEYS.STUDENT_EMAIL, sessionData.email);
    localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, `${sessionData.firstName} ${sessionData.lastName}`);
    localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(enrichedSession));
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
  }, [isKioskMode]);

  // Login function - authenticates and loads full student context
  const login = useCallback(async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Step 1: Find student by email
      const studentResult = await getByEmailQuery.refetch();
      
      if (!studentResult.data?.student) {
        setIsLoading(false);
        return { success: false, error: 'No student found with this email. Please contact the front desk.' };
      }
      
      const student = studentResult.data.student;
      
      // Step 2: Load full dashboard data (belt progress, classes, etc.)
      const dashboardResult = await getDashboardDataQuery.refetch();
      
      // Build complete session object
      const fullSession: StudentSession = {
        id: student.id,
        email: student.email || email,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        phone: student.phone || undefined,
        photoUrl: student.photoUrl || undefined,
        program: student.program || undefined,
        beltRank: student.beltRank || 'White',
        status: student.status || 'active',
        isKioskMode,
      };
      
      // Enrich with dashboard data if available
      if (dashboardResult.data) {
        const { beltProgress, enrolledClasses } = dashboardResult.data;
        
        if (beltProgress) {
          fullSession.currentBelt = beltProgress.currentBelt || student.beltRank || 'White';
          fullSession.nextBelt = beltProgress.nextBelt || 'Yellow';
          fullSession.progressPercent = beltProgress.progressPercent || 0;
          fullSession.qualifiedClasses = beltProgress.qualifiedClasses || 0;
          fullSession.classesRequired = beltProgress.classesRequired || 20;
          fullSession.qualifiedAttendance = beltProgress.qualifiedAttendance || 0;
          fullSession.attendanceRequired = beltProgress.attendanceRequired || 80;
          fullSession.isEligible = beltProgress.isEligible === 1;
          fullSession.nextEvaluationDate = beltProgress.nextEvaluationDate || undefined;
        }
        
        if (enrolledClasses) {
          fullSession.enrolledClasses = enrolledClasses;
        }
      }
      
      // Save complete session
      saveSession(fullSession);
      setIsLoading(false);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }, [getByEmailQuery, getDashboardDataQuery, isKioskMode, saveSession]);

  // Logout function
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  // Refresh session data from server
  const refreshSession = useCallback(async () => {
    if (!session?.id) return;
    
    try {
      const dashboardResult = await getDashboardDataQuery.refetch();
      
      if (dashboardResult.data) {
        const { student, beltProgress, enrolledClasses } = dashboardResult.data;
        
        const updatedSession: StudentSession = {
          ...session,
          firstName: student.firstName || session.firstName,
          lastName: student.lastName || session.lastName,
          phone: student.phone || session.phone,
          photoUrl: student.photoUrl || session.photoUrl,
          program: student.program || session.program,
          beltRank: student.beltRank || session.beltRank,
          status: student.status || session.status,
        };
        
        if (beltProgress) {
          updatedSession.currentBelt = beltProgress.currentBelt || session.currentBelt;
          updatedSession.nextBelt = beltProgress.nextBelt || session.nextBelt;
          updatedSession.progressPercent = beltProgress.progressPercent || session.progressPercent;
          updatedSession.qualifiedClasses = beltProgress.qualifiedClasses || session.qualifiedClasses;
          updatedSession.classesRequired = beltProgress.classesRequired || session.classesRequired;
          updatedSession.qualifiedAttendance = beltProgress.qualifiedAttendance || session.qualifiedAttendance;
          updatedSession.attendanceRequired = beltProgress.attendanceRequired || session.attendanceRequired;
          updatedSession.isEligible = beltProgress.isEligible === 1;
          updatedSession.nextEvaluationDate = beltProgress.nextEvaluationDate || session.nextEvaluationDate;
        }
        
        if (enrolledClasses) {
          updatedSession.enrolledClasses = enrolledClasses;
        }
        
        saveSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, [session, getDashboardDataQuery, saveSession]);

  // Set kiosk mode
  const setKioskMode = useCallback((enabled: boolean) => {
    setIsKioskModeState(enabled);
    localStorage.setItem(STORAGE_KEYS.KIOSK_MODE, String(enabled));
    
    if (session) {
      const updatedSession = { ...session, isKioskMode: enabled };
      setSession(updatedSession);
      localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(updatedSession));
    }
  }, [session]);

  const value: StudentSessionContextType = {
    session,
    isLoading,
    isAuthenticated: !!session,
    isKioskMode,
    login,
    logout,
    refreshSession,
    setKioskMode,
  };

  return (
    <StudentSessionContext.Provider value={value}>
      {children}
    </StudentSessionContext.Provider>
  );
}

export function useStudentSession() {
  const context = useContext(StudentSessionContext);
  if (context === undefined) {
    throw new Error('useStudentSession must be used within a StudentSessionProvider');
  }
  return context;
}

// Hook to check if user should be redirected based on login state
export function useStudentAuth() {
  const { session, isLoading, isAuthenticated, isKioskMode } = useStudentSession();
  
  return {
    isLoading,
    isAuthenticated,
    isKioskMode,
    student: session,
    // Computed properties for UI
    beltRank: session?.currentBelt || session?.beltRank || 'White',
    nextBelt: session?.nextBelt || 'Yellow',
    progressPercent: session?.progressPercent || 0,
    classesToNextRank: Math.max(0, (session?.classesRequired || 20) - (session?.qualifiedClasses || 0)),
    attendancePercent: session?.qualifiedAttendance || 0,
    isEligibleForPromotion: session?.isEligible || false,
    enrolledClassCount: session?.enrolledClasses?.length || 0,
  };
}
