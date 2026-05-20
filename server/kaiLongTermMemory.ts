/**
 * Kai Long-Term Memory Store
 * ─────────────────────────────────────────────────────────────────────────────
 * Stores persistent facts about users and organisations across conversations.
 *
 * Memory types:
 *  - org_fact:    Facts about the organisation (school name, programs, pricing)
 *  - user_fact:   Facts about the logged-in user (preferred name, role, style)
 *  - contact_fact: Facts about a specific lead/student (name, program, status)
 *
 * Storage: Uses the existing database via raw SQL (no new schema needed).
 * The `kai_memory` table is created on first use.
 *
 * Memory is injected into the system prompt as a concise block so Kai
 * "remembers" facts without needing to re-query the database every turn.
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemoryType = 'org_fact' | 'user_fact' | 'contact_fact' | 'conversation_summary';

export interface MemoryEntry {
  id?: number;
  organizationId: number;
  userId?: number;
  contactId?: number;   // Lead or student ID
  memoryType: MemoryType;
  key: string;          // e.g., "preferred_program", "owner_name", "billing_status"
  value: string;        // Human-readable fact
  confidence: number;   // 0.0 – 1.0 (how confident we are this is still true)
  source: string;       // Where this came from: "user_stated", "db_query", "inferred"
  expiresAt?: string;   // ISO timestamp — null means never expires
  createdAt?: string;
  updatedAt?: string;
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────

let tableBootstrapped = false;

async function ensureTable(): Promise<void> {
  if (tableBootstrapped) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS kai_memory (
      id              SERIAL PRIMARY KEY,
      organization_id INTEGER NOT NULL,
      user_id         INTEGER,
      contact_id      INTEGER,
      memory_type     VARCHAR(50) NOT NULL,
      key             VARCHAR(200) NOT NULL,
      value           TEXT NOT NULL,
      confidence      DECIMAL(3,2) NOT NULL DEFAULT 1.0,
      source          VARCHAR(100) NOT NULL DEFAULT 'user_stated',
      expires_at      TIMESTAMP,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_kai_memory_org_user
    ON kai_memory (organization_id, user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_kai_memory_contact
    ON kai_memory (organization_id, contact_id)
  `);
  tableBootstrapped = true;
}

// ── CRUD operations ───────────────────────────────────────────────────────────

/**
 * Store or update a memory entry.
 * Uses upsert logic: if a memory with the same org+user+contact+key exists, update it.
 */
export async function rememberFact(entry: MemoryEntry): Promise<void> {
  try {
    await ensureTable();
    const db = getDb();

    // Check if this key already exists
    const existing = await db.execute(sql`
      SELECT id FROM kai_memory
      WHERE organization_id = ${entry.organizationId}
        AND memory_type = ${entry.memoryType}
        AND key = ${entry.key}
        AND (user_id = ${entry.userId ?? null} OR (user_id IS NULL AND ${entry.userId ?? null} IS NULL))
        AND (contact_id = ${entry.contactId ?? null} OR (contact_id IS NULL AND ${entry.contactId ?? null} IS NULL))
      LIMIT 1
    `);

    const rows = (existing as any).rows ?? existing;
    if (Array.isArray(rows) && rows.length > 0) {
      // Update existing
      await db.execute(sql`
        UPDATE kai_memory
        SET value = ${entry.value},
            confidence = ${entry.confidence},
            source = ${entry.source},
            expires_at = ${entry.expiresAt ?? null},
            updated_at = NOW()
        WHERE id = ${rows[0].id}
      `);
    } else {
      // Insert new
      await db.execute(sql`
        INSERT INTO kai_memory
          (organization_id, user_id, contact_id, memory_type, key, value, confidence, source, expires_at)
        VALUES
          (${entry.organizationId}, ${entry.userId ?? null}, ${entry.contactId ?? null},
           ${entry.memoryType}, ${entry.key}, ${entry.value}, ${entry.confidence},
           ${entry.source}, ${entry.expiresAt ?? null})
      `);
    }
  } catch (err) {
    // Memory failures should never crash the main loop
    console.error('[KaiMemory] rememberFact error:', err);
  }
}

/**
 * Retrieve all active memories for an org/user context.
 */
export async function recallMemory(
  organizationId: number,
  userId?: number,
  contactId?: number
): Promise<MemoryEntry[]> {
  try {
    await ensureTable();
    const db = getDb();

    const result = await db.execute(sql`
      SELECT
        id, organization_id, user_id, contact_id, memory_type,
        key, value, confidence, source, expires_at, created_at, updated_at
      FROM kai_memory
      WHERE organization_id = ${organizationId}
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
          -- Org-level facts (no user/contact filter)
          (memory_type = 'org_fact')
          -- User-level facts
          OR (memory_type = 'user_fact' AND user_id = ${userId ?? null})
          -- Contact-level facts
          OR (memory_type = 'contact_fact' AND contact_id = ${contactId ?? null})
          -- Conversation summaries for this user
          OR (memory_type = 'conversation_summary' AND user_id = ${userId ?? null})
        )
      ORDER BY updated_at DESC
      LIMIT 100
    `);

    const rows = (result as any).rows ?? result;
    if (!Array.isArray(rows)) return [];

    return rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      contactId: row.contact_id,
      memoryType: row.memory_type as MemoryType,
      key: row.key,
      value: row.value,
      confidence: parseFloat(row.confidence),
      source: row.source,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('[KaiMemory] recallMemory error:', err);
    return [];
  }
}

/**
 * Delete a specific memory entry.
 */
export async function forgetFact(organizationId: number, key: string, memoryType: MemoryType): Promise<void> {
  try {
    await ensureTable();
    const db = getDb();
    await db.execute(sql`
      DELETE FROM kai_memory
      WHERE organization_id = ${organizationId}
        AND key = ${key}
        AND memory_type = ${memoryType}
    `);
  } catch (err) {
    console.error('[KaiMemory] forgetFact error:', err);
  }
}

/**
 * Clear all memories for an organisation (use with caution).
 */
export async function clearOrgMemory(organizationId: number): Promise<void> {
  try {
    await ensureTable();
    const db = getDb();
    await db.execute(sql`
      DELETE FROM kai_memory WHERE organization_id = ${organizationId}
    `);
  } catch (err) {
    console.error('[KaiMemory] clearOrgMemory error:', err);
  }
}

// ── Memory context builder ────────────────────────────────────────────────────

/**
 * Build a concise memory context block to inject into the system prompt.
 * Groups memories by type and formats them as readable facts.
 */
export function buildMemoryContextBlock(memories: MemoryEntry[]): string {
  if (memories.length === 0) return '';

  const orgFacts = memories.filter(m => m.memoryType === 'org_fact');
  const userFacts = memories.filter(m => m.memoryType === 'user_fact');
  const contactFacts = memories.filter(m => m.memoryType === 'contact_fact');
  const summaries = memories.filter(m => m.memoryType === 'conversation_summary');

  const lines: string[] = ['## LONG-TERM MEMORY (use this — do not re-query what you already know)'];

  if (orgFacts.length > 0) {
    lines.push('### Organisation Facts');
    for (const m of orgFacts) {
      lines.push(`- ${m.key}: ${m.value}`);
    }
  }

  if (userFacts.length > 0) {
    lines.push('### User Preferences');
    for (const m of userFacts) {
      lines.push(`- ${m.key}: ${m.value}`);
    }
  }

  if (contactFacts.length > 0) {
    lines.push('### Contact Facts (from previous conversations)');
    for (const m of contactFacts) {
      lines.push(`- ${m.key}: ${m.value}`);
    }
  }

  if (summaries.length > 0) {
    lines.push('### Previous Conversation Summaries');
    // Only show the most recent summary
    lines.push(`- ${summaries[0].value}`);
  }

  lines.push('');
  return lines.join('\n');
}

// ── Auto-extract and store memories from conversation ─────────────────────────

/**
 * Extract memorable facts from a completed conversation turn and store them.
 * Called after each successful tool call or at conversation end.
 */
export async function extractAndStoreMemories(
  organizationId: number,
  userId: number,
  userMessage: string,
  assistantResponse: string,
  toolResults: Array<{ toolName: string; result: string }>
): Promise<void> {
  // Extract phone numbers mentioned
  const phoneMatch = userMessage.match(/\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/);
  if (phoneMatch) {
    await rememberFact({
      organizationId,
      userId,
      memoryType: 'user_fact',
      key: 'last_mentioned_phone',
      value: phoneMatch[0],
      confidence: 0.9,
      source: 'user_stated',
    });
  }

  // Extract email
  const emailMatch = userMessage.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    await rememberFact({
      organizationId,
      userId,
      memoryType: 'user_fact',
      key: 'last_mentioned_email',
      value: emailMatch[0].toLowerCase(),
      confidence: 0.9,
      source: 'user_stated',
    });
  }

  // Store successful tool call results as contact facts
  for (const tr of toolResults) {
    if (tr.toolName === 'add_lead') {
      try {
        const parsed = JSON.parse(tr.result);
        const leadId = parsed.data?.leadId ?? parsed.leadId;
        if (leadId) {
          await rememberFact({
            organizationId,
            userId,
            contactId: leadId,
            memoryType: 'contact_fact',
            key: 'lead_created',
            value: `Lead ID ${leadId} created`,
            confidence: 1.0,
            source: 'db_query',
          });
        }
      } catch {}
    }
  }
}
