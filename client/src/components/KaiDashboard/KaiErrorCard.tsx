import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import styles from './KaiErrorCard.module.css';
import { KaiDebugState } from './KaiDebugOverlay';

interface KaiErrorCardProps {
  error: string;
  debugInfo?: KaiDebugState;
  onRetry?: () => void;
  onShowDebug?: () => void;
}

export function KaiErrorCard({ error, debugInfo, onRetry, onShowDebug }: KaiErrorCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <AlertCircle size={20} className={styles.icon} />
        <div className={styles.title}>Kai is not connected</div>
      </div>
      <div className={styles.message}>
        {debugInfo?.endpointHit === false
          ? 'Kai is not connected to the AI runtime. Check env vars + API key + route wiring.'
          : error}
      </div>
      <div className={styles.actions}>
        {onRetry && (
          <button className={styles.btn} onClick={onRetry}>
            Retry
          </button>
        )}
        {onShowDebug && (
          <button className={`${styles.btn} ${styles.secondary}`} onClick={() => setShowDetails(!showDetails)}>
            <ChevronDown size={16} />
            Debug Details
          </button>
        )}
      </div>
      {showDetails && debugInfo && (
        <div className={styles.details}>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
