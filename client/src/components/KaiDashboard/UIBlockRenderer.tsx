/**
 * UIBlock Renderer for Kai Chat
 * Renders different types of UI blocks (cards, tables, actions) in the chat
 */

import React from 'react';
import styles from './KaiDashboard.module.css';

export interface UIBlock {
  type: 'card' | 'table' | 'action' | 'alert' | 'metric';
  title?: string;
  data: any;
  actions?: Array<{
    label: string;
    action: string;
    onClick?: () => void;
  }>;
}

interface UIBlockRendererProps {
  blocks: UIBlock[];
  debugMode?: boolean;
}

/**
 * Render a single card block
 */
const CardBlock: React.FC<{ block: UIBlock }> = ({ block }) => {
  const data = block.data || {};

  return (
    <div className={styles.uiCard}>
      {block.title && <h3 className={styles.cardTitle}>{block.title}</h3>}
      <div className={styles.cardContent}>
        {typeof data === 'object' ? (
          <div className={styles.cardData}>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className={styles.cardRow}>
                <span className={styles.cardLabel}>{key}:</span>
                <span className={styles.cardValue}>{String(value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>{String(data)}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Render a table block
 */
const TableBlock: React.FC<{ block: UIBlock }> = ({ block }) => {
  const data = Array.isArray(block.data) ? block.data : [block.data];

  if (data.length === 0) {
    return <div className={styles.uiAlert}>No data to display</div>;
  }

  const columns = Object.keys(data[0] || {});

  return (
    <div className={styles.uiTable}>
      {block.title && <h3 className={styles.tableTitle}>{block.title}</h3>}
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={`${idx}-${col}`}>{String(row[col] || '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Render an action block (buttons/chips)
 */
const ActionBlock: React.FC<{ block: UIBlock }> = ({ block }) => {
  return (
    <div className={styles.uiActions}>
      {block.actions?.map((action, idx) => (
        <button
          key={idx}
          className={styles.actionButton}
          onClick={action.onClick}
          title={action.action}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Render a metric block
 */
const MetricBlock: React.FC<{ block: UIBlock }> = ({ block }) => {
  const data = block.data || {};

  return (
    <div className={styles.uiMetric}>
      {block.title && <h3 className={styles.metricTitle}>{block.title}</h3>}
      <div className={styles.metricValue}>{String(data.value || data)}</div>
      {data.unit && <div className={styles.metricUnit}>{data.unit}</div>}
      {data.trend && (
        <div className={`${styles.metricTrend} ${data.trend > 0 ? styles.positive : styles.negative}`}>
          {data.trend > 0 ? '↑' : '↓'} {Math.abs(data.trend)}%
        </div>
      )}
    </div>
  );
};

/**
 * Render an alert block
 */
const AlertBlock: React.FC<{ block: UIBlock }> = ({ block }) => {
  return (
    <div className={styles.uiAlert}>
      {block.title && <h4 className={styles.alertTitle}>{block.title}</h4>}
      <p>{String(block.data)}</p>
    </div>
  );
};

/**
 * Main UIBlock Renderer
 */
export const UIBlockRenderer: React.FC<UIBlockRendererProps> = ({ blocks, debugMode = false }) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className={styles.uiBlocksContainer}>
      {debugMode && (
        <div className={styles.debugInfo}>
          <small>
            Executed: {blocks.length} UIBlocks rendered
          </small>
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={idx} className={styles.uiBlock}>
          {block.type === 'card' && <CardBlock block={block} />}
          {block.type === 'table' && <TableBlock block={block} />}
          {block.type === 'action' && <ActionBlock block={block} />}
          {block.type === 'metric' && <MetricBlock block={block} />}
          {block.type === 'alert' && <AlertBlock block={block} />}
        </div>
      ))}
    </div>
  );
};

export default UIBlockRenderer;
