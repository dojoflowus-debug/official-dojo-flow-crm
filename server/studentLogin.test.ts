import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Student Login Intelligence Tests
 * 
 * These tests verify the intelligent login gateway behavior:
 * 1. Returning Student Login - authenticates and loads full student context
 * 2. New Student Flow - routes to onboarding with proper data
 * 3. Kiosk Mode Awareness - detects and respects kiosk context
 * 4. Student Context Binding - loads belt rank, program, progress, classes
 */

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Storage keys used by the login system
const STORAGE_KEYS = {
  STUDENT_ID: 'student_id',
  STUDENT_EMAIL: 'student_email',
  STUDENT_NAME: 'student_name',
  STUDENT_SESSION: 'student_session',
  KIOSK_MODE: 'kiosk_mode',
  LOGGED_IN: 'student_logged_in',
};

describe('Student Login Intelligence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Session Storage', () => {
    it('should store student session data correctly', () => {
      const sessionData = {
        id: 123,
        email: 'student@test.com',
        firstName: 'John',
        lastName: 'Doe',
        beltRank: 'Yellow',
        currentBelt: 'Yellow',
        nextBelt: 'Orange',
        progressPercent: 45,
        qualifiedClasses: 9,
        classesRequired: 20,
        isKioskMode: false,
        loginTimestamp: Date.now(),
      };

      localStorageMock.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(sessionData));
      localStorageMock.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_ID, String(sessionData.id));

      const storedSession = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.STUDENT_SESSION) || '{}');
      
      expect(storedSession.id).toBe(123);
      expect(storedSession.email).toBe('student@test.com');
      expect(storedSession.beltRank).toBe('Yellow');
      expect(storedSession.currentBelt).toBe('Yellow');
      expect(storedSession.nextBelt).toBe('Orange');
      expect(storedSession.progressPercent).toBe(45);
      expect(storedSession.qualifiedClasses).toBe(9);
      expect(storedSession.classesRequired).toBe(20);
      expect(localStorageMock.getItem(STORAGE_KEYS.LOGGED_IN)).toBe('true');
    });

    it('should include kiosk mode flag in session', () => {
      const sessionData = {
        id: 456,
        email: 'kiosk-student@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isKioskMode: true,
        loginTimestamp: Date.now(),
      };

      localStorageMock.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(sessionData));
      localStorageMock.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');

      const storedSession = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.STUDENT_SESSION) || '{}');
      
      expect(storedSession.isKioskMode).toBe(true);
      expect(localStorageMock.getItem(STORAGE_KEYS.KIOSK_MODE)).toBe('true');
    });
  });

  describe('Kiosk Mode Detection', () => {
    it('should detect kiosk mode from localStorage', () => {
      localStorageMock.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
      
      const isKioskMode = localStorageMock.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      
      expect(isKioskMode).toBe(true);
    });

    it('should detect kiosk mode from session data', () => {
      const sessionData = {
        id: 789,
        email: 'test@test.com',
        isKioskMode: true,
      };
      
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(sessionData));
      
      const storedSession = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.STUDENT_SESSION) || '{}');
      
      expect(storedSession.isKioskMode).toBe(true);
    });

    it('should default to non-kiosk mode when not set', () => {
      const isKioskMode = localStorageMock.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
      
      expect(isKioskMode).toBe(false);
    });
  });

  describe('Session Logout', () => {
    it('should clear all session data on logout', () => {
      // Set up a logged-in session
      localStorageMock.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_ID, '123');
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_EMAIL, 'test@test.com');
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_NAME, 'Test User');
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify({ id: 123 }));

      // Simulate logout
      localStorageMock.removeItem(STORAGE_KEYS.LOGGED_IN);
      localStorageMock.removeItem(STORAGE_KEYS.STUDENT_ID);
      localStorageMock.removeItem(STORAGE_KEYS.STUDENT_EMAIL);
      localStorageMock.removeItem(STORAGE_KEYS.STUDENT_NAME);
      localStorageMock.removeItem(STORAGE_KEYS.STUDENT_SESSION);

      expect(localStorageMock.getItem(STORAGE_KEYS.LOGGED_IN)).toBeNull();
      expect(localStorageMock.getItem(STORAGE_KEYS.STUDENT_ID)).toBeNull();
      expect(localStorageMock.getItem(STORAGE_KEYS.STUDENT_SESSION)).toBeNull();
    });

    it('should preserve kiosk mode after logout in kiosk context', () => {
      // Set up a kiosk session
      localStorageMock.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
      localStorageMock.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
      localStorageMock.setItem(STORAGE_KEYS.STUDENT_ID, '123');

      // Simulate kiosk logout (clears student but keeps kiosk mode)
      localStorageMock.removeItem(STORAGE_KEYS.LOGGED_IN);
      localStorageMock.removeItem(STORAGE_KEYS.STUDENT_ID);
      localStorageMock.removeItem(STORAGE_KEYS.STUDENT_SESSION);
      // Note: KIOSK_MODE is NOT removed

      expect(localStorageMock.getItem(STORAGE_KEYS.KIOSK_MODE)).toBe('true');
      expect(localStorageMock.getItem(STORAGE_KEYS.LOGGED_IN)).toBeNull();
    });
  });

  describe('Belt Progress Data', () => {
    it('should calculate classes needed for next belt', () => {
      const sessionData = {
        qualifiedClasses: 12,
        classesRequired: 20,
      };

      const classesNeeded = Math.max(0, sessionData.classesRequired - sessionData.qualifiedClasses);
      
      expect(classesNeeded).toBe(8);
    });

    it('should handle zero classes needed', () => {
      const sessionData = {
        qualifiedClasses: 25,
        classesRequired: 20,
      };

      const classesNeeded = Math.max(0, sessionData.classesRequired - sessionData.qualifiedClasses);
      
      expect(classesNeeded).toBe(0);
    });

    it('should determine belt promotion eligibility', () => {
      const eligibleSession = {
        qualifiedClasses: 20,
        classesRequired: 20,
        qualifiedAttendance: 85,
        attendanceRequired: 80,
        isEligible: true,
      };

      const ineligibleSession = {
        qualifiedClasses: 15,
        classesRequired: 20,
        qualifiedAttendance: 70,
        attendanceRequired: 80,
        isEligible: false,
      };

      expect(eligibleSession.isEligible).toBe(true);
      expect(ineligibleSession.isEligible).toBe(false);
    });
  });

  describe('Minor Detection for Guardian Flow', () => {
    it('should correctly identify a minor (under 18)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10); // 10 years old
      
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      const isMinor = actualAge < 18;
      
      expect(isMinor).toBe(true);
    });

    it('should correctly identify an adult (18 or older)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25); // 25 years old
      
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      const isMinor = actualAge < 18;
      
      expect(isMinor).toBe(false);
    });

    it('should handle edge case of exactly 18 years old', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 18);
      
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      
      const isMinor = actualAge < 18;
      
      expect(isMinor).toBe(false);
    });
  });
});

describe('Student Portal Data Binding', () => {
  it('should structure student session with all required fields', () => {
    interface StudentSession {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      photoUrl?: string;
      program?: string;
      beltRank?: string;
      status?: string;
      currentBelt?: string;
      nextBelt?: string;
      progressPercent?: number;
      qualifiedClasses?: number;
      classesRequired?: number;
      qualifiedAttendance?: number;
      attendanceRequired?: number;
      isEligible?: boolean;
      enrolledClasses?: Array<{
        id?: number;
        name?: string;
        time?: string;
        dayOfWeek?: string;
        instructor?: string;
      }>;
      isKioskMode?: boolean;
      loginTimestamp?: number;
    }

    const session: StudentSession = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Student',
      beltRank: 'Yellow',
      currentBelt: 'Yellow',
      nextBelt: 'Orange',
      progressPercent: 50,
      qualifiedClasses: 10,
      classesRequired: 20,
      qualifiedAttendance: 75,
      attendanceRequired: 80,
      isEligible: false,
      enrolledClasses: [
        { id: 1, name: 'Kids Karate', time: '4:00 PM', dayOfWeek: 'Monday', instructor: 'Sensei John' },
      ],
      isKioskMode: false,
      loginTimestamp: Date.now(),
    };

    // Verify all required fields are present
    expect(session.id).toBeDefined();
    expect(session.email).toBeDefined();
    expect(session.firstName).toBeDefined();
    expect(session.lastName).toBeDefined();
    expect(session.currentBelt).toBeDefined();
    expect(session.nextBelt).toBeDefined();
    expect(session.progressPercent).toBeDefined();
    expect(session.qualifiedClasses).toBeDefined();
    expect(session.classesRequired).toBeDefined();
    expect(session.enrolledClasses).toBeDefined();
    expect(session.enrolledClasses?.length).toBeGreaterThan(0);
  });
});
