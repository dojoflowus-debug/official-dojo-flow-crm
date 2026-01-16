/**
 * Kai Debug Overlay Component
 * Dev-only overlay showing AI execution details
 */

import React from 'react';
import styles from './KaiDebugOverlay.module.css';

export interface KaiDebugState {
  aiProvider?: string;
  endpointHit?: boolean;
  lastRequestId?: string;
  statusCode?: number | null;
  modelName?: string;
  orgId?: number;
  userId?: number;
  routerIntent?: string;
  toolCallsExecuted?: number;
  uiBlocksReturned?: number;
  lastMessage?: string;
  lastResponse?: string;
  timestamp?: string;
  error?: string;
}

interface KaiDebugOverlayProps {
  debugState: KaiDebugState;
  isDev?: boolean;
}

export function KaiDebugOverlay({ debugState, isDev = true }: KaiDebugOverlayProps) {
  if (!isDev || process.env.NODE_ENV === 'production') {
    return null;
  }

  const isConnected = debugState.endpointHit && debugState.aiProvider !== 'none';

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <div className={styles.title}>🐛 DEBUG</div>
        <div className={`${styles.status} ${isConnected ? styles.connected : styles.disconnected}`}>
          {debugState.aiProvider || 'none'}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.item}>
          <span className={styles.label}>aiProvider:</span>
          <span className={styles.value}>{debugState.aiProvider || 'N/A'}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>endpointHit:</span>
          <span className={`${styles.value} ${debugState.endpointHit ? styles.true : styles.false}`}>
            {debugState.endpointHit ? 'YES' : 'NO'}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>statusCode:</span>
          <span className={`${styles.value} ${debugState.statusCode === 200 ? styles.success : styles.error}`}>
            {debugState.statusCode || 'N/A'}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>routerIntent:</span>
          <span className={styles.value}>{debugState.routerIntent || 'N/A'}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>toolCalls:</span>
          <span className={`${styles.value} ${(debugState.toolCallsExecuted || 0) > 0 ? styles.success : ''}`}>
            {debugState.toolCallsExecuted || 0}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>uiBlocks:</span>
          <span className={`${styles.value} ${(debugState.uiBlocksReturned || 0) > 0 ? styles.success : ''}`}>
            {debugState.uiBlocksReturned || 0}
          </span>
        </div>
      </div>

      {debugState.error && (
        <div className={styles.error}>
          <strong>Error:</strong> {debugState.error}
        </div>
      )}
    </div>
  );
}
