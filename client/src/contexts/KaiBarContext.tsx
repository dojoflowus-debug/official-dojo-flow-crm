import React, { createContext, useContext, useState, useCallback } from 'react';

export interface KaiBarAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url?: string;
  uploading?: boolean;
  error?: string;
}

interface KaiBarContextType {
  messageInput: string;
  setMessageInput: (value: string) => void;
  attachments: KaiBarAttachment[];
  addAttachment: (attachment: KaiBarAttachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  expandedInput: boolean;
  setExpandedInput: (expanded: boolean) => void;
  onSendMessage?: (input: string, attachments: KaiBarAttachment[]) => Promise<void>;
  setOnSendMessage: (handler: (input: string, attachments: KaiBarAttachment[]) => Promise<void>) => void;
}

const KaiBarContext = createContext<KaiBarContextType | undefined>(undefined);

export function KaiBarProvider({ children }: { children: React.ReactNode }) {
  const [messageInput, setMessageInput] = useState('');
  const [attachments, setAttachments] = useState<KaiBarAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedInput, setExpandedInput] = useState(false);
  const [onSendMessage, setOnSendMessage] = useState<((input: string, attachments: KaiBarAttachment[]) => Promise<void>) | undefined>(() => undefined);

  const addAttachment = useCallback((attachment: KaiBarAttachment) => {
    setAttachments(prev => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  // Wrapper to properly set function state
  const setOnSendMessageWrapper = useCallback((handler: (input: string, attachments: KaiBarAttachment[]) => Promise<void>) => {
    setOnSendMessage(() => handler);
  }, []);

  const value: KaiBarContextType = {
    messageInput,
    setMessageInput,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    isLoading,
    setIsLoading,
    expandedInput,
    setExpandedInput,
    onSendMessage,
    setOnSendMessage: setOnSendMessageWrapper,
  };

  return (
    <KaiBarContext.Provider value={value}>
      {children}
    </KaiBarContext.Provider>
  );
}

export function useKaiBar() {
  const context = useContext(KaiBarContext);
  if (!context) {
    throw new Error('useKaiBar must be used within KaiBarProvider');
  }
  return context;
}
