/**
 * Structured Data Detection
 * Detects when users paste structured data (like rosters) and provides parsing utilities
 */

export type DetectedDataType = 
  | 'student_roster'
  | 'class_schedule'
  | 'lead_list'
  | 'unknown';

export interface DetectedStructuredData {
  type: DetectedDataType;
  confidence: number;
  headers: string[];
  rows: Record<string, string>[];
  rawText: string;
  summary: string;
}

// Common header patterns for different data types
const ROSTER_HEADERS = [
  'name', 'first name', 'last name', 'firstname', 'lastname',
  'student', 'student name', 'email', 'phone', 'belt', 'rank',
  'age', 'dob', 'date of birth', 'birthday', 'guardian', 'parent',
  'contact', 'address', 'program', 'level'
];

const SCHEDULE_HEADERS = [
  'class', 'time', 'day', 'instructor', 'room', 'location',
  'start', 'end', 'duration', 'program', 'level', 'schedule'
];

const LEAD_HEADERS = [
  'lead', 'prospect', 'source', 'status', 'interest',
  'inquiry', 'trial', 'follow up', 'followup'
];

/**
 * Detect if text contains structured data (headers + rows)
 */
export function detectStructuredData(text: string): DetectedStructuredData | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  
  const lines = trimmed.split('\n').filter(line => line.trim());
  if (lines.length < 2) return null; // Need at least header + 1 row
  
  // Try to detect delimiter
  const firstLine = lines[0];
  let delimiter = detectDelimiter(firstLine);
  if (!delimiter) return null;
  
  // Parse headers
  const headers = parseRow(firstLine, delimiter);
  if (headers.length < 2) return null; // Need at least 2 columns
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i], delimiter);
    if (values.length === 0) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  if (rows.length === 0) return null;
  
  // Determine data type based on headers
  const { type, confidence } = classifyDataType(headers);
  
  // Generate summary
  const summary = generateSummary(type, rows.length, headers);
  
  return {
    type,
    confidence,
    headers,
    rows,
    rawText: trimmed,
    summary
  };
}

/**
 * Detect the delimiter used in the text
 */
function detectDelimiter(line: string): string | null {
  // Check for common delimiters
  const delimiters = ['\t', ',', '|', ';'];
  
  for (const delimiter of delimiters) {
    const parts = line.split(delimiter);
    if (parts.length >= 2) {
      // Verify it's consistent (not just random occurrence)
      return delimiter;
    }
  }
  
  // Check for multiple spaces (fixed-width format)
  if (/\s{2,}/.test(line)) {
    return '  '; // Double space
  }
  
  return null;
}

/**
 * Parse a row with the given delimiter
 */
function parseRow(line: string, delimiter: string): string[] {
  if (delimiter === '  ') {
    // Fixed-width: split on 2+ spaces
    return line.split(/\s{2,}/).map(v => v.trim()).filter(v => v);
  }
  
  // Handle quoted values
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

/**
 * Classify the data type based on headers
 */
function classifyDataType(headers: string[]): { type: DetectedDataType; confidence: number } {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // Count matches for each type
  let rosterScore = 0;
  let scheduleScore = 0;
  let leadScore = 0;
  
  for (const header of lowerHeaders) {
    if (ROSTER_HEADERS.some(rh => header.includes(rh))) rosterScore++;
    if (SCHEDULE_HEADERS.some(sh => header.includes(sh))) scheduleScore++;
    if (LEAD_HEADERS.some(lh => header.includes(lh))) leadScore++;
  }
  
  // Determine type based on highest score
  const maxScore = Math.max(rosterScore, scheduleScore, leadScore);
  
  if (maxScore === 0) {
    return { type: 'unknown', confidence: 0.3 };
  }
  
  const confidence = Math.min(0.95, 0.5 + (maxScore / headers.length) * 0.5);
  
  if (rosterScore >= scheduleScore && rosterScore >= leadScore) {
    return { type: 'student_roster', confidence };
  } else if (scheduleScore >= leadScore) {
    return { type: 'class_schedule', confidence };
  } else {
    return { type: 'lead_list', confidence };
  }
}

/**
 * Generate a human-readable summary
 */
function generateSummary(type: DetectedDataType, rowCount: number, headers: string[]): string {
  const typeLabels: Record<DetectedDataType, string> = {
    'student_roster': 'student roster',
    'class_schedule': 'class schedule',
    'lead_list': 'lead list',
    'unknown': 'data'
  };
  
  return `Detected ${typeLabels[type]} with ${rowCount} ${rowCount === 1 ? 'entry' : 'entries'} (columns: ${headers.slice(0, 4).join(', ')}${headers.length > 4 ? '...' : ''})`;
}

/**
 * Check if text looks like structured data (quick check)
 */
export function looksLikeStructuredData(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  const lines = trimmed.split('\n').filter(line => line.trim());
  if (lines.length < 2) return false;
  
  // Check if first line has delimiters
  const firstLine = lines[0];
  const hasDelimiter = /[\t,|;]/.test(firstLine) || /\s{2,}/.test(firstLine);
  
  // Check if multiple lines have similar structure
  if (hasDelimiter && lines.length >= 2) {
    const delimiter = detectDelimiter(firstLine);
    if (delimiter) {
      const firstCols = parseRow(firstLine, delimiter).length;
      const secondCols = parseRow(lines[1], delimiter).length;
      // Similar column count suggests structured data
      return Math.abs(firstCols - secondCols) <= 1 && firstCols >= 2;
    }
  }
  
  return false;
}
