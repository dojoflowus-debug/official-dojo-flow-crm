import React, { createContext, useContext, useState, ReactNode } from 'react';

type SettingsTab = 'account' | 'school' | 'settings' | 'usage' | 'billing' | 'scheduled' | 'mail' | 'data' | 'cloud' | 'personalization' | 'connectors' | 'help' | 'profile' | 'payments' | 'pc-bank-card' | 'api-keys';

interface ModalContextType {
  settingsOpen: boolean;
  activeTab: SettingsTab;
  openSettings: (tabOrOptions?: SettingsTab | { initialTab?: SettingsTab }) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const openSettings = (tabOrOptions?: SettingsTab | { initialTab?: SettingsTab }) => {
    if (typeof tabOrOptions === 'string') {
      setActiveTab(tabOrOptions);
    } else if (tabOrOptions?.initialTab) {
      setActiveTab(tabOrOptions.initialTab);
    } else {
      // Always reset to account tab when opening without a specific tab
      setActiveTab('account');
    }
    setSettingsOpen(true);
  };
  const closeSettings = () => setSettingsOpen(false);

  return (
    <ModalContext.Provider value={{ settingsOpen, activeTab, openSettings, closeSettings, setActiveTab }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}

export type { SettingsTab };
