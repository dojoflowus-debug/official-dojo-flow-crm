import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { campaigns, campaignRecipients, leads, students } from '../../drizzle/schema';

describe('Campaigns Router', () => {
  let caller: any;
  let db: any;

  beforeAll(async () => {
    // Create a mock context with a test user
    const mockContext = {
      user: { id: 1, name: 'Test User', email: 'test@example.com' },
      req: {} as any,
      res: {} as any,
    };
    
    caller = appRouter.createCaller(mockContext);
    db = await getDb();
  });

  it('should get all campaigns', async () => {
    const result = await caller.campaigns.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should get campaign stats', async () => {
    const stats = await caller.campaigns.getStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('draft');
    expect(stats).toHaveProperty('sent');
    expect(stats).toHaveProperty('totalRecipients');
    expect(typeof stats.total).toBe('number');
  });

  it('should create a campaign', async () => {
    const campaignData = {
      name: 'Test Campaign',
      type: 'sms' as const,
      message: 'Hello {{firstName}}, this is a test message!',
      audienceFilter: {
        type: 'leads' as const,
      },
    };

    const result = await caller.campaigns.create(campaignData);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('recipientCount');
    expect(typeof result.id).toBe('number');
    expect(typeof result.recipientCount).toBe('number');
  });

  it('should get campaign by id', async () => {
    // First create a campaign
    const created = await caller.campaigns.create({
      name: 'Test Campaign for Get',
      type: 'email' as const,
      subject: 'Test Subject',
      message: 'Test message',
      audienceFilter: {
        type: 'students' as const,
      },
    });

    // Then retrieve it
    const campaign = await caller.campaigns.getById({ id: created.id });
    expect(campaign).toBeDefined();
    expect(campaign.name).toBe('Test Campaign for Get');
    expect(campaign.type).toBe('email');
  });

  it('should update a campaign', async () => {
    // Create a campaign first
    const created = await caller.campaigns.create({
      name: 'Original Name',
      type: 'sms' as const,
      message: 'Original message',
      audienceFilter: {
        type: 'leads' as const,
      },
    });

    // Update it
    await caller.campaigns.update({
      id: created.id,
      name: 'Updated Name',
      message: 'Updated message',
    });

    // Verify update
    const updated = await caller.campaigns.getById({ id: created.id });
    expect(updated.name).toBe('Updated Name');
  });

  it('should get campaign recipients', async () => {
    // Create a campaign
    const created = await caller.campaigns.create({
      name: 'Test Campaign with Recipients',
      type: 'sms' as const,
      message: 'Test',
      audienceFilter: {
        type: 'leads' as const,
      },
    });

    // Get recipients
    const recipients = await caller.campaigns.getRecipients({ campaignId: created.id });
    expect(Array.isArray(recipients)).toBe(true);
  });
});
