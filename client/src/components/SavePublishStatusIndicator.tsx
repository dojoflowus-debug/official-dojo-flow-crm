/**
 * SavePublishStatusIndicator Component
 * 
 * Displays "Last saved" and "Last published" status lines
 * Shows relative time (e.g., "2 minutes ago") or absolute time on hover
 * Updates in real-time as saves/publishes occur
 */

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface SavePublishStatusIndicatorProps {
  lastSavedTime: string | null;
  lastPublishedTime: string | null;
  draftVersion?: number;
  publishedVersion?: number;
  hasUnsavedChanges?: boolean;
}

/**
 * Format ISO timestamp to relative time string (e.g., "2 minutes ago")
 */
function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (err) {
    return 'unknown';
  }
}

/**
 * Format ISO timestamp to absolute time string (e.g., "Jan 15, 2:30 PM")
 */
function formatAbsoluteTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (err) {
    return 'unknown';
  }
}

export const SavePublishStatusIndicator: React.FC<SavePublishStatusIndicatorProps> = ({
  lastSavedTime,
  lastPublishedTime,
  draftVersion = 0,
  publishedVersion = 0,
  hasUnsavedChanges = false,
}) => {
  const [relativeTime, setRelativeTime] = useState<{ saved: string; published: string }>({
    saved: lastSavedTime ? formatRelativeTime(lastSavedTime) : 'never',
    published: lastPublishedTime ? formatRelativeTime(lastPublishedTime) : 'never',
  });

  // Update relative time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime({
        saved: lastSavedTime ? formatRelativeTime(lastSavedTime) : 'never',
        published: lastPublishedTime ? formatRelativeTime(lastPublishedTime) : 'never',
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [lastSavedTime, lastPublishedTime]);

  return (
    <div className="flex flex-col gap-2 text-xs mt-4 pt-3 border-t" style={{borderColor: 'rgba(255,255,255,0.06)'}}>
      {/* Last Saved Status */}
      <div className="flex items-center gap-2" title={lastSavedTime ? formatAbsoluteTime(lastSavedTime) : 'Not saved yet'}>
        <Clock className="w-3 h-3" style={{color: 'rgba(255,255,255,0.5)'}} />
        <span style={{color: 'rgba(255,255,255,0.6)'}}>
          Last saved: <span style={{color: 'rgba(255,255,255,0.8)'}}>{relativeTime.saved}</span>
        </span>
        {draftVersion > 0 && (
          <span style={{color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem'}}>
            (v{draftVersion})
          </span>
        )}
      </div>

      {/* Last Published Status */}
      <div className="flex items-center gap-2" title={lastPublishedTime ? formatAbsoluteTime(lastPublishedTime) : 'Not published yet'}>
        <CheckCircle2 className="w-3 h-3" style={{color: publishedVersion > 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(255,255,255,0.3)'}} />
        <span style={{color: 'rgba(255,255,255,0.6)'}}>
          Last published: <span style={{color: 'rgba(255,255,255,0.8)'}}>{relativeTime.published}</span>
        </span>
        {publishedVersion > 0 && (
          <span style={{color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem'}}>
            (v{publishedVersion})
          </span>
        )}
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 mt-1" style={{color: 'rgba(239, 68, 68, 0.8)'}}>
          <AlertCircle className="w-3 h-3" />
          <span>Unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default SavePublishStatusIndicator;
