import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: false } });

// Tables to check
const tables = ['dojo_settings', 'organizations', 'users', 'classes'];

for (const table of tables) {
  try {
    const [rows] = await conn.execute(`DESCRIBE ${table}`);
    const existingCols = new Set(rows.map(r => r.Field));
    console.log(`\n${table}: ${existingCols.size} columns`);
    
    // Find the table definition in schema.ts
    const schema = readFileSync('drizzle/schema.ts', 'utf-8');
    const tableVarMatch = schema.match(new RegExp(`export const \\w+ = mysqlTable\\("${table}",\\s*\\{([\\s\\S]*?)\\}[,)]`));
    if (!tableVarMatch) {
      console.log(`  Could not find ${table} in schema`);
      continue;
    }
    
    const colBlock = tableVarMatch[1];
    const colMatches = [...colBlock.matchAll(/(\w+):\s*(?:varchar|text|int|tinyint|timestamp|decimal|json|mysqlEnum|boolean|date|mediumtext)/g)];
    const schemaCols = colMatches.map(m => m[1]);
    
    const missing = schemaCols.filter(c => !existingCols.has(c));
    if (missing.length > 0) {
      console.log(`  MISSING: ${missing.join(', ')}`);
    } else {
      console.log(`  All ${schemaCols.length} schema columns present`);
    }
  } catch(e) {
    console.log(`  Error: ${e.message}`);
  }
}

await conn.end();
