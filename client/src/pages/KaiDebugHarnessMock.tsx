/**
 * Kai Debug Harness (Mock)
 * Client-side mock test page for debug overlay + UIBlock rendering
 * Route: /dev/kai-debug-mock (dev-only)
 * NO server/router changes required
 */

import React, { useState } from 'react';
import { useKaiSendMock } from '@/hooks/useKaiSendMock';
import { KaiDebugOverlay } from '@/components/KaiDashboard/KaiDebugOverlay';
import { KaiErrorCard } from '@/components/KaiDashboard/KaiErrorCard';
import { Send, Loader2 } from 'lucide-react';
import styles from './KaiDebugHarnessMock.module.css';

const TEST_QUERIES = [
  {
    label: 'How many students do I have?',
    query: 'How many students do I have?',
  },
  {
    label: 'Identify high-risk students',
    query: 'Identify high-risk students. Recommend intervention.',
  },
  {
    label: 'How many new leads this week?',
    query: 'How many new leads this week?',
  },
];

export default function KaiDebugHarnessMock() {
  const [query, setQuery] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);
  const kaiSend = useKaiSendMock();

  const handleSend = async () => {
    if (!query.trim()) return;
    await kaiSend.send(query);
    setQuery('');
  };

  const handleTestQuery = async (testQuery: string) => {
    setQuery(testQuery);
    await kaiSend.send(testQuery);
  };

  return (
    <div className={styles.container}>
      {/* Debug Overlay */}
      <KaiDebugOverlay
        debugState={kaiSend.debugState || {
          aiProvider: 'none',
          endpointHit: false,
          lastRequestId: '',
          statusCode: null,
          modelName: '',
          orgId: 1,
          userId: 1,
          routerIntent: '',
          toolCallsExecuted: 0,
          uiBlocksReturned: 0,
          lastMessage: '',
          lastResponse: '',
          timestamp: new Date().toISOString(),
        }}
        isDev={true}
      />

      <div className={styles.header}>
        <h1>🥋 Kai Debug Harness (Mock)</h1>
        <p>Client-side mock responses - no server changes</p>
      </div>

      {/* Test Buttons */}
      <div className={styles.testButtons}>
        {TEST_QUERIES.map((test, idx) => (
          <button
            key={idx}
            className={styles.testBtn}
            onClick={() => handleTestQuery(test.query)}
            disabled={kaiSend.isLoading}
          >
            {test.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          placeholder="Ask Kai something..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSend();
            }
          }}
          disabled={kaiSend.isLoading}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!query.trim() || kaiSend.isLoading}
        >
          {kaiSend.isLoading ? (
            <Loader2 className={styles.spinner} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      {/* Error Display */}
      {kaiSend.error && (
        <KaiErrorCard
          error={kaiSend.error}
          debugInfo={kaiSend.debugState || undefined}
          onRetry={() => handleSend()}
          onShowDebug={() => {
            console.log('Debug State:', kaiSend.debugState);
          }}
        />
      )}

      {/* Response Display */}
      {kaiSend.response && (
        <div className={styles.responseArea}>
          <div className={styles.responseHeader}>
            <h3>Response</h3>
            <button
              className={styles.toggleBtn}
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson ? 'Hide' : 'Show'} Raw JSON
            </button>
          </div>

          {showRawJson ? (
            <pre className={styles.rawJson}>
              {JSON.stringify(kaiSend.response, null, 2)}
            </pre>
          ) : (
            <div className={styles.renderedResponse}>
              <div className={styles.responseText}>
                <strong>Response:</strong> {kaiSend.response.response}
              </div>

              {kaiSend.response.procedure && (
                <div className={styles.procedureInfo}>
                  <strong>Procedure:</strong> {kaiSend.response.procedure}
                </div>
              )}

              {kaiSend.response.uiBlocks && kaiSend.response.uiBlocks.length > 0 && (
                <div className={styles.uiBlocks}>
                  <strong>UI Blocks ({kaiSend.response.uiBlocks.length}):</strong>
                  {kaiSend.response.uiBlocks.map((block, idx) => (
                    <div key={idx} className={styles.uiBlock}>
                      <div className={styles.blockType}>{block.type}</div>
                      <pre className={styles.blockData}>
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Debug Info Panel */}
      {kaiSend.debugState && (
        <div className={styles.debugPanel}>
          <h3>Debug State</h3>
          <div className={styles.debugGrid}>
            <div className={styles.debugItem}>
              <span className={styles.label}>AI Provider:</span>
              <span className={styles.value}>{kaiSend.debugState.aiProvider}</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.label}>Endpoint Hit:</span>
              <span className={`${styles.value} ${kaiSend.debugState.endpointHit ? styles.success : styles.error}`}>
                {kaiSend.debugState.endpointHit ? 'YES' : 'NO'}
              </span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.label}>Status Code:</span>
              <span className={styles.value}>{kaiSend.debugState.statusCode}</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.label}>Router Intent:</span>
              <span className={styles.value}>{kaiSend.debugState.routerIntent || 'N/A'}</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.label}>Tool Calls:</span>
              <span className={styles.value}>{kaiSend.debugState.toolCallsExecuted}</span>
            </div>
            <div className={styles.debugItem}>
              <span className={styles.label}>UI Blocks:</span>
              <span className={styles.value}>{kaiSend.debugState.uiBlocksReturned}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
