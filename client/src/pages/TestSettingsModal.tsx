import { useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';
import { SettingsPortalModal } from '@/components/modals/SettingsPortalModal';

export default function TestSettingsModal() {
  const { openSettings } = useModal();

  useEffect(() => {
    // Automatically open Settings modal with 'mail' tab when page loads
    openSettings({ initialTab: 'mail' });
  }, [openSettings]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Settings Modal - Dojo Flow Messaging</h1>
      <p>The Settings modal should open automatically with the Dojo Flow Messaging tab.</p>
      <button 
        onClick={() => openSettings({ initialTab: 'mail' })}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Open Settings (Dojo Flow Messaging)
      </button>
      <SettingsPortalModal />
    </div>
  );
}
