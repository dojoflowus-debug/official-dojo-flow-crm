import { describe, it, expect, beforeAll } from 'vitest';
import { db } from './db';
import { appRouter } from './routers';

describe('kai.addMessage E2E with TRPC', () => {
  let testConversationId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Create test user
    const userResult = await db.execute(`
      INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updatedAt)
      VALUES ('test_e2e_user', 'E2E Test User', 'e2e@test.com', 'user', 'password', datetime('now'), datetime('now'))
    `);
    testUserId = Number(userResult.insertId);

    // Create test conversation
    const convResult = await db.execute(`
      INSERT INTO kai_conversations (userId, title, status, priority, createdAt, updatedAt)
      VALUES (${testUserId}, 'E2E Test Conversation', 'active', 'normal', datetime('now'), datetime('now'))
    `);
    testConversationId = Number(convResult.insertId);
  });

  it('should accept metadata object through TRPC router', async () => {
    // Create a mock context
    const mockContext = {
      user: {
        id: testUserId,
        openId: 'test_e2e_user',
        name: 'E2E Test User',
        email: 'e2e@test.com',
        role: 'user'
      },
      req: {} as any,
      res: {} as any
    };

    // Create caller with context
    const caller = appRouter.createCaller(mockContext);

    // Call addMessage with metadata object
    const result = await caller.kai.addMessage({
      conversationId: testConversationId,
      role: 'user',
      content: 'E2E test message',
      metadata: {
        clientMessageId: 'e2e-test-123',
        testField: 'test value',
        nested: { key: 'value' }
      }
    });

    console.log('✓ TRPC call succeeded with metadata object');
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);

    // Verify message was saved with metadata
    const savedMessage = await db.execute(`
      SELECT * FROM messages WHERE id = ${result.id}
    `);
    
    expect(savedMessage.length).toBeGreaterThan(0);
    const msg = savedMessage[0];
    expect(msg.metadata).toBeDefined();
    
    // Parse and verify metadata
    const parsedMetadata = JSON.parse(msg.metadata);
    expect(parsedMetadata.clientMessageId).toBe('e2e-test-123');
    expect(parsedMetadata.testField).toBe('test value');
    expect(parsedMetadata.nested.key).toBe('value');
    
    console.log('✓ Metadata stored and retrieved correctly:', parsedMetadata);
  });
});
