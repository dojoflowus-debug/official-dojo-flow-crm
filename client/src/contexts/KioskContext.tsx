import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface KioskContextType {
  isKioskMode: boolean;
  schoolId: string | null;
  schoolName: string | null;
  schoolLogo: string | null;
  lockSchool: (id: string, name: string, logo?: string) => void;
  unlockSchool: () => void;
  isSchoolLocked: boolean;
}

const KioskContext = createContext<KioskContextType | undefined>(undefined);

const KIOSK_STORAGE_KEY = 'dojoflow_kiosk_config';

interface KioskConfig {
  schoolId: string;
  schoolName: string;
  schoolLogo?: string;
  lockedAt: number;
}

export function KioskProvider({ children }: { children: ReactNode }) {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  // Load kiosk config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(KIOSK_STORAGE_KEY);
    if (stored) {
      try {
        const config: KioskConfig = JSON.parse(stored);
        setIsKioskMode(true);
        setSchoolId(config.schoolId);
        setSchoolName(config.schoolName);
        setSchoolLogo(config.schoolLogo || null);
      } catch (error) {
        console.error('Failed to parse kiosk config:', error);
        localStorage.removeItem(KIOSK_STORAGE_KEY);
      }
    }

    // Check URL parameters for kiosk mode
    const params = new URLSearchParams(window.location.search);
    const urlSchoolId = params.get('schoolId');
    const urlSchoolName = params.get('schoolName');
    const urlSchoolLogo = params.get('schoolLogo');
    
    if (urlSchoolId && urlSchoolName) {
      lockSchool(urlSchoolId, urlSchoolName, urlSchoolLogo || undefined);
    }
  }, []);

  const lockSchool = (id: string, name: string, logo?: string) => {
    const config: KioskConfig = {
      schoolId: id,
      schoolName: name,
      schoolLogo: logo,
      lockedAt: Date.now(),
    };
    
    localStorage.setItem(KIOSK_STORAGE_KEY, JSON.stringify(config));
    setIsKioskMode(true);
    setSchoolId(id);
    setSchoolName(name);
    setSchoolLogo(logo || null);
  };

  const unlockSchool = () => {
    localStorage.removeItem(KIOSK_STORAGE_KEY);
    setIsKioskMode(false);
    setSchoolId(null);
    setSchoolName(null);
    setSchoolLogo(null);
  };

  const value: KioskContextType = {
    isKioskMode,
    schoolId,
    schoolName,
    schoolLogo,
    lockSchool,
    unlockSchool,
    isSchoolLocked: isKioskMode && !!schoolId,
  };

  return (
    <KioskContext.Provider value={value}>
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const context = useContext(KioskContext);
  if (context === undefined) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return context;
}
