import React from 'react';
import { KioskConfig } from '../../../shared/kioskConfig';
import KioskHome from '../KioskHome';
import KioskLayout from '../KioskLayout';

interface KioskPreviewLiveProps {
  config: KioskConfig;
  isLoading?: boolean;
}

/**
 * KioskPreviewLive - Local React component for live preview
 * 
 * Renders the kiosk UI using the provided config without iframe or API calls.
 * Updates instantly as the user edits the configuration.
 */
export default function KioskPreviewLive({ config, isLoading = false }: KioskPreviewLiveProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-white border-r-white animate-spin" />
          </div>
          <p className="text-white/60 text-sm">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative">
      <KioskLayout config={config}>
        <KioskHome config={config} />
      </KioskLayout>
      
      {/* Debug HUD - Shows live config values */}
      <div style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        fontSize: 12,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: 8,
        borderRadius: 8,
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: 300,
        wordBreak: 'break-word'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>LIVE CONFIG DEBUG</div>
        <div>accentColor: <span style={{ color: config?.theme?.accentColor || '#ef4444' }}>{config?.theme?.accentColor || '#ef4444'}</span></div>
        <div>blur: {config?.background?.blur || 0}px</div>
        <div>dim: {config?.background?.dim || 0}%</div>
        <div>bgType: {config?.background?.type || 'color'}</div>
        <div>bgColor: {config?.background?.color || '#fff'}</div>
      </div>
    </div>
  );
}
