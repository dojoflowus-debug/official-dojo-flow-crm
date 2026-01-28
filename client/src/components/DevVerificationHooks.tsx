import { useEffect, useState } from 'react'
import { useModal } from '@/contexts/ModalContext'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'

// Dev-only component for testing billing flows
export function DevVerificationHooks() {
  const isDev = process.env.NODE_ENV !== 'production' || new URLSearchParams(window.location.search).get('debug') === '1'
  const { openSettings } = useModal()
  const { user } = useAuth()
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Update debug info
  useEffect(() => {
    if (!isDev) return

    const params = new URLSearchParams(window.location.search)
    setDebugInfo({
      creditSuccess: params.get('credits') === 'success',
      creditCancel: params.get('credits') === 'cancel',
      userId: user?.id,
      orgId: user?.activeOrgId,
      url: window.location.href,
    })
  }, [isDev, user])

  // Hotkey listener
  useEffect(() => {
    if (!isDev) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+C: Open Add Credit Modal
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
        e.preventDefault()
        console.log('[DEV] Opening Add Credit Modal...')
        openSettings({ initialTab: 'account' })
        // Simulate opening the Add Credit modal
        const addCreditBtn = document.querySelector('button:has-text("Add credit")')
        if (addCreditBtn) {
          (addCreditBtn as HTMLButtonElement).click()
        }
      }

      // Ctrl+Shift+B: Open Billing Portal
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyB') {
        e.preventDefault()
        console.log('[DEV] Opening Billing Portal...')
        openSettings({ initialTab: 'account' })
        // Simulate clicking Manage button
        const manageBtn = document.querySelector('button:has-text("Manage")')
        if (manageBtn) {
          (manageBtn as HTMLButtonElement).click()
        }
      }

      // Ctrl+Shift+D: Toggle Debug Panel
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault()
        setShowDebugPanel(!showDebugPanel)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDev, openSettings, showDebugPanel])

  if (!isDev) return null

  return (
    <>
      {/* Debug Panel */}
      {showDebugPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '400px',
            fontSize: '12px',
            color: '#fff',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#4ade80' }}>
            DEV DEBUG PANEL
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#fbbf24' }}>Hotkeys:</div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              Ctrl+Shift+C: Open Add Credit Modal
            </div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              Ctrl+Shift+B: Open Billing Portal
            </div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              Ctrl+Shift+D: Toggle Debug Panel
            </div>
          </div>
          <div style={{ marginBottom: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
            <div style={{ color: '#fbbf24' }}>Current State:</div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              User ID: {debugInfo.userId || 'N/A'}
            </div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              Org ID: {debugInfo.orgId || 'N/A'}
            </div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              Credits Success: {debugInfo.creditSuccess ? '✅' : '❌'}
            </div>
            <div style={{ color: '#9ca3af', marginLeft: '8px' }}>
              Credits Cancel: {debugInfo.creditCancel ? '✅' : '❌'}
            </div>
          </div>
          <button
            onClick={() => setShowDebugPanel(false)}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Hotkey hint */}
      {!showDebugPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
          onClick={() => setShowDebugPanel(true)}
        >
          [DEV] Ctrl+Shift+D for debug
        </div>
      )}
    </>
  )
}
