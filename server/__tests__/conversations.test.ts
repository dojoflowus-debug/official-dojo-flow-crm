import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { leads } from '../../drizzle/schema';

describe('Conversations Router', () => {
  let caller: any;
  let db: any;
  let testLeadId: number;

  beforeAll(async () => {
    const mockContext = {
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      req: {} as any,
      res: {} as any,
    };
    
    caller = appRouter.createCaller(mockContext);
    db = await getDb();

    // Create a test lead for conversation tests
    const [lead] = await db.insert(leads).values({
      firstName: 'Test',
      lastName: 'Lead',
      email: 'testlead@example.com',
      phone: '+15555551234',
      status: 'New Lead',
    });
    testLeadId = lead.insertId;
  });

  it('should get all conversations', async () => {
    const result = await caller.conversations.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should get conversation stats', async () => {
    const stats = await caller.conversations.getStats();
    expect(stats).toHaveProperty('totalConversations');
    expect(stats).toHaveProperty('openConversations');
    expect(stats).toHaveProperty('unreadCount');
    expect(typeof stats.totalConversations).toBe('number');
  });

  it('should create or get a conversation', async () => {
    const result = await caller.conversations.createOrGet({
      participantType: 'lead' as const,
      participantId: testLeadId,
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('isNew');
    expect(typeof result.id).toBe('number');
    expect(typeof result.isNew).toBe('boolean');
  });

  it('should get conversation by id with messages', async () => {
    // Create a conversation
    const created = await caller.conversations.createOrGet({
      participantType: 'lead' as const,
      participantId: testLeadId,
    });

    // Get conversation with messages
    const conversation = await caller.conversations.getById({ id: created.id });
    expect(conversation).toBeDefined();
    expect(conversation.participantName).toContain('Test');
    expect(Array.isArray(conversation.messages)).toBe(true);
  });

  it('should send a message', async () => {
    // Create a conversation
    const conversation = await caller.conversations.createOrGet({
      participantType: 'lead' as const,
      participantId: testLeadId,
    });

    // Send a message
    const result = await caller.conversations.sendMessage({
      conversationId: conversation.id,
      content: 'Hello! This is a test message.',
      senderType: 'staff' as const,
    });

    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('number');
  });

  it('should get messages for a conversation', async () => {
    // Create conversation and send a message
    const conversation = await caller.conversations.createOrGet({
      participantType: 'lead' as const,
      participantId: testLeadId,
    });

    await caller.conversations.sendMessage({
      conversationId: conversation.id,
      content: 'Test message for retrieval',
      senderType: 'staff' as const,
    });

    // Get messages
    const messages = await caller.conversations.getMessages({ conversationId: conversation.id });
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should mark conversation as read', async () => {
    // Create a conversation
    const conversation = await caller.conversations.createOrGet({
      participantType: 'lead' as const,
      participantId: testLeadId,
    });

    // Mark as read
    const result = await caller.conversations.markAsRead({ conversationId: conversation.id });
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  it('should update conversation status', async () => {
    // Create a conversation
    const conversation = await caller.conversations.createOrGet({
      participantType: 'lead' as const,
      participantId: testLeadId,
    });

    // Update status
    const result = await caller.conversations.updateStatus({
      conversationId: conversation.id,
      status: 'closed' as const,
    });

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  it('should get message templates', async () => {
    const templates = await caller.conversations.getTemplates();
    expect(Array.isArray(templates)).toBe(true);
  });

  it('should create a message template', async () => {
    const templateData = {
      name: 'Test Template',
      category: 'greeting' as const,
      type: 'sms' as const,
      content: 'Hi {{firstName}}, welcome to our dojo!',
    };

    const result = await caller.conversations.createTemplate(templateData);
    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('number');
  });

  it('should filter templates by type', async () => {
    // Create an SMS template
    await caller.conversations.createTemplate({
      name: 'SMS Template',
      category: 'follow_up' as const,
      type: 'sms' as const,
      content: 'SMS content',
    });

    // Get SMS templates
    const smsTemplates = await caller.conversations.getTemplates({ type: 'sms' });
    expect(Array.isArray(smsTemplates)).toBe(true);
    expect(smsTemplates.every((t: any) => t.type === 'sms')).toBe(true);
  });
});
