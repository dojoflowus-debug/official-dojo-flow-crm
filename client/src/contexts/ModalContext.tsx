import React, { createContext, useContext, useState, ReactNode } from 'react';

type SettingsTab = 'account' | 'settings' | 'usage' | 'billing' | 'scheduled' | 'mail' | 'data' | 'cloud' | 'personalization' | 'connectors' | 'help' | 'profile' | 'payments';

interface ModalContextType {
  settingsOpen: boolean;
  activeTab: SettingsTab;
  openSettings: (options?: { initialTab?: SettingsTab }) => void;
  closeSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const openSettings = (options?: { initialTab?: SettingsTab }) => {
    if (options?.initialTab) {
      setActiveTab(options.initialTab);
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
