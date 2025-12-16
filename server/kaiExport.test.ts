import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { kaiConversations, kaiMessages, users } from '../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';

describe('Kai Conversation Export Data', () => {
  let testUserId: number;
  let testConversationId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user
    const [userResult] = await db.insert(users).values({
      openId: `test-export-${Date.now()}`,
      name: 'Export Test User',
      email: `export-test-${Date.now()}@test.com`,
      role: 'admin',
    });
    testUserId = userResult.insertId;

    // Create a test conversation
    const [convResult] = await db.insert(kaiConversations).values({
      userId: testUserId,
      title: 'Test Export Conversation',
      preview: 'This is a test conversation for export',
      status: 'active',
      category: 'kai',
      priority: 'neutral',
    });
    testConversationId = convResult.insertId;

    // Add some test messages
    await db.insert(kaiMessages).values([
      {
        conversationId: testConversationId,
        role: 'user',
        content: 'Hello Kai, how many students do we have?',
      },
      {
        conversationId: testConversationId,
        role: 'assistant',
        content: 'We currently have 150 active students in the dojo.',
      },
      {
        conversationId: testConversationId,
        role: 'user',
        content: 'What about revenue this month?',
      },
      {
        conversationId: testConversationId,
        role: 'assistant',
        content: 'This month\'s revenue is $12,500, which is a 15% increase from last month.',
      },
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    if (db && testConversationId) {
      await db.delete(kaiMessages).where(eq(kaiMessages.conversationId, testConversationId));
      await db.delete(kaiConversations).where(eq(kaiConversations.id, testConversationId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it('should retrieve conversation with messages for export', async () => {
    if (!db) throw new Error('Database not available');

    // Get conversation
    const conversations = await db.select()
      .from(kaiConversations)
      .where(and(
        eq(kaiConversations.id, testConversationId),
        eq(kaiConversations.userId, testUserId),
        isNull(kaiConversations.deletedAt)
      ))
      .limit(1);

    expect(conversations).toHaveLength(1);
    expect(conversations[0].title).toBe('Test Export Conversation');

    // Get messages
    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    expect(messages).toHaveLength(4);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });

  it('should format conversation as JSON export', async () => {
    if (!db) throw new Error('Database not available');

    const conversations = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    // Simulate JSON export
    const exportData = [{ conversation: conversations[0], messages }];
    const jsonContent = JSON.stringify(exportData, null, 2);

    expect(jsonContent).toContain('Test Export Conversation');
    expect(jsonContent).toContain('Hello Kai, how many students do we have?');
    expect(JSON.parse(jsonContent)).toHaveLength(1);
  });

  it('should format conversation as Markdown export', async () => {
    if (!db) throw new Error('Database not available');

    const conversations = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    // Simulate markdown export
    let content = `# ${conversations[0].title}\n\n`;
    messages.forEach(msg => {
      content += `### ${msg.role === 'user' ? '👤 User' : '🤖 Kai'}\n`;
      content += `${msg.content}\n\n`;
    });

    expect(content).toContain('# Test Export Conversation');
    expect(content).toContain('👤 User');
    expect(content).toContain('🤖 Kai');
    expect(content).toContain('Hello Kai, how many students do we have?');
  });

  it('should format conversation as CSV export', async () => {
    if (!db) throw new Error('Database not available');

    const conversations = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    const messages = await db.select()
      .from(kaiMessages)
      .where(eq(kaiMessages.conversationId, testConversationId));

    // Simulate CSV export
    let content = "Conversation ID,Conversation Title,Message Role,Message Content,Created At\n";
    messages.forEach(msg => {
      const escapedContent = msg.content.replace(/"/g, '""').replace(/\n/g, ' ');
      content += `${conversations[0].id},"${conversations[0].title}",${msg.role},"${escapedContent}",${new Date(msg.createdAt).toISOString()}\n`;
    });

    const lines = content.split('\n');
    expect(lines[0]).toContain('Conversation ID');
    expect(lines[0]).toContain('Message Role');
    expect(lines.length).toBeGreaterThan(4); // Header + 4 messages
  });

  it('should retrieve all conversations for export', async () => {
    if (!db) throw new Error('Database not available');

    // Create another conversation
    const [conv2Result] = await db.insert(kaiConversations).values({
      userId: testUserId,
      title: 'Second Test Conversation',
      preview: 'Another test conversation',
      status: 'active',
      category: 'billing',
      priority: 'neutral',
    });

    await db.insert(kaiMessages).values([
      {
        conversationId: conv2Result.insertId,
        role: 'user',
        content: 'Show me billing information',
      },
    ]);

    const allConversations = await db.select()
      .from(kaiConversations)
      .where(and(
        eq(kaiConversations.userId, testUserId),
        isNull(kaiConversations.deletedAt)
      ));

    expect(allConversations.length).toBeGreaterThanOrEqual(2);

    // Clean up
    await db.delete(kaiMessages).where(eq(kaiMessages.conversationId, conv2Result.insertId));
    await db.delete(kaiConversations).where(eq(kaiConversations.id, conv2Result.insertId));
  });

  it('should exclude deleted conversations from export', async () => {
    if (!db) throw new Error('Database not available');

    // Create and soft-delete a conversation
    const [deletedConvResult] = await db.insert(kaiConversations).values({
      userId: testUserId,
      title: 'Deleted Conversation',
      preview: 'This should not be exported',
      status: 'active',
      category: 'kai',
      priority: 'neutral',
      deletedAt: new Date(),
    });

    const allConversations = await db.select()
      .from(kaiConversations)
      .where(and(
        eq(kaiConversations.userId, testUserId),
        isNull(kaiConversations.deletedAt)
      ));

    const deletedConv = allConversations.find(c => c.title === 'Deleted Conversation');
    expect(deletedConv).toBeUndefined();

    // Clean up
    await db.delete(kaiConversations).where(eq(kaiConversations.id, deletedConvResult.insertId));
  });

  it('should include conversation metadata', async () => {
    if (!db) throw new Error('Database not available');

    const [conversation] = await db.select()
      .from(kaiConversations)
      .where(eq(kaiConversations.id, testConversationId));

    expect(conversation.title).toBe('Test Export Conversation');
    expect(conversation.status).toBe('active');
    expect(conversation.category).toBe('kai');
    expect(conversation.priority).toBe('neutral');
    expect(conversation.createdAt).toBeDefined();
    expect(conversation.lastMessageAt).toBeDefined();
  });
});
