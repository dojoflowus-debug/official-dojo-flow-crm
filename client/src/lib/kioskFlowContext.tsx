import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type KioskScreen = 
  | 'home'
  | 'attract'
  | 'check-in-search'
  | 'check-in-select'
  | 'check-in-class'
  | 'check-in-success'
  | 'start-training-lead'
  | 'start-training-program'
  | 'start-training-schedule'
  | 'start-training-confirmation'
  | 'staff-login-pin'
  | 'staff-tools';

export interface KioskFlowState {
  currentScreen: KioskScreen;
  flowData: Record<string, any>;
  isStaffMode: boolean;
  lastActivityTime: number;
  isIdle: boolean;
}

interface KioskFlowContextType {
  state: KioskFlowState;
  navigateTo: (screen: KioskScreen, data?: Record<string, any>) => void;
  updateFlowData: (data: Record<string, any>) => void;
  goHome: () => void;
  goBack: () => void;
  enterStaffMode: () => void;
  exitStaffMode: () => void;
  recordActivity: () => void;
}

const KioskFlowContext = createContext<KioskFlowContextType | undefined>(undefined);

export function KioskFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KioskFlowState>({
    currentScreen: 'home',
    flowData: {},
    isStaffMode: false,
    lastActivityTime: Date.now(),
    isIdle: false,
  });

  const [screenStack, setScreenStack] = useState<KioskScreen[]>(['home']);

  // Idle timer: 30s to attract mode, 60s to auto-reset
  useEffect(() => {
    const idleTimer = setInterval(() => {
      const timeSinceActivity = Date.now() - state.lastActivityTime;
      
      if (timeSinceActivity > 60000 && state.currentScreen !== 'home' && state.currentScreen !== 'attract') {
        // Auto-reset to home after 60s
        setState(prev => ({
          ...prev,
          currentScreen: 'home',
          flowData: {},
          isIdle: false,
        }));
        setScreenStack(['home']);
      } else if (timeSinceActivity > 30000 && state.currentScreen === 'home' && !state.isStaffMode) {
        // Show attract mode after 30s
        setState(prev => ({ ...prev, currentScreen: 'attract', isIdle: true }));
      }
    }, 1000);

    return () => clearInterval(idleTimer);
  }, [state.lastActivityTime, state.currentScreen, state.isStaffMode]);

  const recordActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastActivityTime: Date.now(),
      isIdle: false,
    }));
    
    // If in attract mode, return to home on activity
    if (state.currentScreen === 'attract') {
      setState(prev => ({ ...prev, currentScreen: 'home' }));
    }
  }, [state.currentScreen]);

  const navigateTo = useCallback((screen: KioskScreen, data?: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      currentScreen: screen,
      flowData: data ? { ...prev.flowData, ...data } : prev.flowData,
      lastActivityTime: Date.now(),
      isIdle: false,
    }));
    
    setScreenStack(prev => [...prev, screen]);
  }, []);

  const updateFlowData = useCallback((data: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      flowData: { ...prev.flowData, ...data },
      lastActivityTime: Date.now(),
    }));
  }, []);

  const goHome = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentScreen: 'home',
      flowData: {},
      lastActivityTime: Date.now(),
      isIdle: false,
    }));
    setScreenStack(['home']);
  }, []);

  const goBack = useCallback(() => {
    if (screenStack.length > 1) {
      const newStack = screenStack.slice(0, -1);
      const previousScreen = newStack[newStack.length - 1];
      
      setState(prev => ({
        ...prev,
        currentScreen: previousScreen,
        lastActivityTime: Date.now(),
        isIdle: false,
      }));
      
      setScreenStack(newStack);
    }
  }, [screenStack]);

  const enterStaffMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStaffMode: true,
      currentScreen: 'staff-login-pin',
      lastActivityTime: Date.now(),
    }));
  }, []);

  const exitStaffMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isStaffMode: false,
      currentScreen: 'home',
      flowData: {},
      lastActivityTime: Date.now(),
    }));
    setScreenStack(['home']);
  }, []);

  const value: KioskFlowContextType = {
    state,
    navigateTo,
    updateFlowData,
    goHome,
    goBack,
    enterStaffMode,
    exitStaffMode,
    recordActivity,
  };

  return (
    <KioskFlowContext.Provider value={value}>
      {children}
    </KioskFlowContext.Provider>
  );
}

export function useKioskFlow() {
  const context = useContext(KioskFlowContext);
  if (!context) {
    throw new Error('useKioskFlow must be used within KioskFlowProvider');
  }
  return context;
}
