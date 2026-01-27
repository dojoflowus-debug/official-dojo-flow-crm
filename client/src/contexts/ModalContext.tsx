import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  return (
    <ModalContext.Provider value={{ settingsOpen, openSettings, closeSettings }}>
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
