/**
 * Setup Wizard Utilities
 * Handles file parsing, column detection, and data validation
 */

import * as XLSX from 'xlsx';

export interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

export interface ColumnDetection {
  columnName: string;
  targetField: string;
  confidence: number;
  dataType: 'text' | 'number' | 'date' | 'enum' | 'boolean';
}

export interface ParseResult {
  rows: ParsedRow[];
  columns: string[];
  detectedMappings: ColumnDetection[];
  errors: string[];
}

/**
 * Parse Excel or CSV file
 */
export async function parseSpreadsheet(
  buffer: Buffer,
  mimeType: string,
  importType: 'programs' | 'classes' | 'pricing' | 'staff' | 'locations'
): Promise<ParseResult> {
  try {
    let workbook;
    
    if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') {
      // Parse CSV
      const text = buffer.toString('utf-8');
      workbook = XLSX.read(text, { type: 'string' });
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      // Parse Excel
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in file');
    }
    
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet);
    
    if (rows.length === 0) {
      throw new Error('No data rows found in file');
    }
    
    const columns = Object.keys(rows[0]);
    const detectedMappings = detectColumns(columns, importType);
    
    return {
      rows,
      columns,
      detectedMappings,
      errors: [],
    };
  } catch (error) {
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Detect column mappings based on header names and import type
 */
export function detectColumns(
  columns: string[],
  importType: 'programs' | 'classes' | 'pricing' | 'staff' | 'locations'
): ColumnDetection[] {
  const mappings: ColumnDetection[] = [];
  
  const columnPatterns: Record<string, { field: string; patterns: RegExp[]; dataType: ColumnDetection['dataType'] }[]> = {
    programs: [
      { field: 'name', patterns: [/^name$/i, /^program\s*name$/i, /^title$/i], dataType: 'text' },
      { field: 'type', patterns: [/^type$/i, /^program\s*type$/i, /^category$/i], dataType: 'enum' },
      { field: 'ageRange', patterns: [/^age\s*range$/i, /^ages?$/i, /^age\s*group$/i], dataType: 'text' },
      { field: 'price', patterns: [/^price$/i, /^cost$/i, /^fee$/i], dataType: 'number' },
      { field: 'maxSize', patterns: [/^max\s*size$/i, /^capacity$/i, /^max\s*students$/i], dataType: 'number' },
      { field: 'description', patterns: [/^description$/i, /^desc$/i, /^notes$/i], dataType: 'text' },
    ],
    classes: [
      { field: 'name', patterns: [/^name$/i, /^class\s*name$/i, /^title$/i], dataType: 'text' },
      { field: 'program', patterns: [/^program$/i, /^program\s*name$/i], dataType: 'text' },
      { field: 'dayOfWeek', patterns: [/^day$/i, /^day\s*of\s*week$/i, /^schedule$/i], dataType: 'enum' },
      { field: 'time', patterns: [/^time$/i, /^start\s*time$/i, /^class\s*time$/i], dataType: 'text' },
      { field: 'instructor', patterns: [/^instructor$/i, /^teacher$/i, /^coach$/i], dataType: 'text' },
      { field: 'capacity', patterns: [/^capacity$/i, /^max\s*students$/i, /^size$/i], dataType: 'number' },
      { field: 'level', patterns: [/^level$/i, /^belt\s*level$/i, /^difficulty$/i], dataType: 'text' },
      { field: 'room', patterns: [/^room$/i, /^location$/i, /^studio$/i], dataType: 'text' },
    ],
    pricing: [
      { field: 'name', patterns: [/^name$/i, /^plan\s*name$/i, /^title$/i], dataType: 'text' },
      { field: 'price', patterns: [/^price$/i, /^cost$/i, /^amount$/i], dataType: 'number' },
      { field: 'billing', patterns: [/^billing$/i, /^cycle$/i, /^frequency$/i], dataType: 'enum' },
      { field: 'contractLength', patterns: [/^contract\s*length$/i, /^term$/i, /^duration$/i], dataType: 'text' },
      { field: 'description', patterns: [/^description$/i, /^details$/i, /^notes$/i], dataType: 'text' },
    ],
    staff: [
      { field: 'firstName', patterns: [/^first\s*name$/i, /^first$/i, /^given\s*name$/i], dataType: 'text' },
      { field: 'lastName', patterns: [/^last\s*name$/i, /^last$/i, /^surname$/i], dataType: 'text' },
      { field: 'email', patterns: [/^email$/i, /^e-mail$/i], dataType: 'text' },
      { field: 'phone', patterns: [/^phone$/i, /^phone\s*number$/i, /^mobile$/i], dataType: 'text' },
      { field: 'role', patterns: [/^role$/i, /^position$/i, /^title$/i], dataType: 'enum' },
      { field: 'specialties', patterns: [/^specialties?$/i, /^expertise$/i, /^skills$/i], dataType: 'text' },
    ],
    locations: [
      { field: 'name', patterns: [/^name$/i, /^location\s*name$/i, /^studio$/i], dataType: 'text' },
      { field: 'address', patterns: [/^address$/i, /^street$/i], dataType: 'text' },
      { field: 'city', patterns: [/^city$/i], dataType: 'text' },
      { field: 'state', patterns: [/^state$/i, /^province$/i], dataType: 'text' },
      { field: 'zipCode', patterns: [/^zip\s*code$/i, /^postal\s*code$/i, /^zip$/i], dataType: 'text' },
      { field: 'phone', patterns: [/^phone$/i, /^phone\s*number$/i], dataType: 'text' },
    ],
  };
  
  const patterns = columnPatterns[importType] || [];
  
  for (const column of columns) {
    for (const pattern of patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(column)) {
          mappings.push({
            columnName: column,
            targetField: pattern.field,
            confidence: 0.9,
            dataType: pattern.dataType,
          });
          break;
        }
      }
    }
  }
  
  return mappings;
}

/**
 * Validate and transform row data based on mappings
 */
export function validateAndTransformRow(
  row: ParsedRow,
  mappings: Record<string, string>,
  importType: 'programs' | 'classes' | 'pricing' | 'staff' | 'locations'
): { data: Record<string, any>; errors: string[] } {
  const errors: string[] = [];
  const data: Record<string, any> = {};
  
  // Define required fields per import type
  const requiredFields: Record<string, string[]> = {
    programs: ['name'],
    classes: ['name', 'program'],
    pricing: ['name', 'price'],
    staff: ['firstName', 'lastName', 'email'],
    locations: ['name', 'address', 'city', 'state', 'zipCode'],
  };
  
  const required = requiredFields[importType] || [];
  
  // Map and validate fields
  for (const [sourceColumn, targetField] of Object.entries(mappings)) {
    const value = row[sourceColumn];
    
    if (value === undefined || value === null || value === '') {
      if (required.includes(targetField)) {
        errors.push(`Missing required field: ${targetField}`);
      }
      continue;
    }
    
    // Type-specific validation
    if (targetField === 'price' || targetField === 'capacity' || targetField === 'maxSize') {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        errors.push(`Invalid number for ${targetField}: ${value}`);
        continue;
      }
      data[targetField] = num;
    } else if (targetField === 'dayOfWeek') {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!validDays.includes(String(value))) {
        errors.push(`Invalid day of week: ${value}`);
        continue;
      }
      data[targetField] = value;
    } else if (targetField === 'type' && importType === 'programs') {
      const validTypes = ['membership', 'class_pack', 'drop_in', 'private'];
      if (!validTypes.includes(String(value).toLowerCase())) {
        errors.push(`Invalid program type: ${value}`);
        continue;
      }
      data[targetField] = String(value).toLowerCase();
    } else if (targetField === 'billing' && importType === 'pricing') {
      const validBilling = ['monthly', 'weekly', 'per_session', 'one_time'];
      if (!validBilling.includes(String(value).toLowerCase())) {
        errors.push(`Invalid billing cycle: ${value}`);
        continue;
      }
      data[targetField] = String(value).toLowerCase();
    } else if (targetField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        errors.push(`Invalid email format: ${value}`);
        continue;
      }
      data[targetField] = String(value).toLowerCase();
    } else {
      data[targetField] = String(value).trim();
    }
  }
  
  // Check for required fields
  for (const field of required) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return { data, errors };
}

/**
 * Detect conflicts in imported data
 */
export interface ConflictDetection {
  type: 'overlapping_class' | 'duplicate_name' | 'invalid_data' | 'belt_rank_mismatch' | 'capacity_invalid';
  severity: 'warning' | 'error';
  message: string;
  affectedRows: number[];
}

export function detectConflicts(
  rows: ParsedRow[],
  mappings: Record<string, string>,
  importType: 'programs' | 'classes' | 'pricing' | 'staff' | 'locations'
): ConflictDetection[] {
  const conflicts: ConflictDetection[] = [];
  const seenNames = new Map<string, number[]>();
  
  rows.forEach((row, index) => {
    const { data, errors } = validateAndTransformRow(row, mappings, importType);
    
    // Check for validation errors
    if (errors.length > 0) {
      conflicts.push({
        type: 'invalid_data',
        severity: 'error',
        message: `Row ${index + 1}: ${errors.join('; ')}`,
        affectedRows: [index],
      });
    }
    
    // Check for duplicate names
    if (data.name) {
      const name = String(data.name).toLowerCase();
      if (seenNames.has(name)) {
        seenNames.get(name)!.push(index);
      } else {
        seenNames.set(name, [index]);
      }
    }
    
    // Check for overlapping classes
    if (importType === 'classes' && data.dayOfWeek && data.time) {
      // This would be checked against existing classes in the database
      // For now, just check within imported data
    }
    
    // Check capacity
    if (data.capacity && data.capacity <= 0) {
      conflicts.push({
        type: 'capacity_invalid',
        severity: 'error',
        message: `Row ${index + 1}: Invalid capacity (must be > 0)`,
        affectedRows: [index],
      });
    }
  });
  
  // Report duplicate names
  for (const [name, indices] of seenNames) {
    if (indices.length > 1) {
      conflicts.push({
        type: 'duplicate_name',
        severity: 'warning',
        message: `Duplicate name "${name}" found in rows ${indices.map(i => i + 1).join(', ')}`,
        affectedRows: indices,
      });
    }
  }
  
  return conflicts;
}

/**
 * Generate preview data for UI
 */
export function generatePreview(
  rows: ParsedRow[],
  mappings: Record<string, string>,
  limit: number = 5
): ParsedRow[] {
  return rows.slice(0, limit).map(row => {
    const preview: ParsedRow = {};
    for (const [sourceColumn, targetField] of Object.entries(mappings)) {
      preview[targetField] = row[sourceColumn] || '';
    }
    return preview;
  });
}
