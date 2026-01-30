import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';

describe('Messaging Router', () => {
  let caller: any;
  const mockContext = {
    user: { id: 1, name: 'Test User', activeOrgId: 120001 },
    currentOrganizationId: 120001,
    req: {} as any,
    res: {} as any,
  };

  beforeAll(async () => {
    caller = appRouter.createCaller(mockContext);
  });

  describe('Email Templates', () => {
    it('should install default email templates', async () => {
      const result = await caller.dojoFlowMessaging.installDefaultTemplates();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('count');
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve email templates', async () => {
      const templates = await caller.dojoFlowMessaging.getEmailTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should create a new email template', async () => {
      const newTemplate = {
        name: 'Test Template',
        subject: 'Test Subject',
        body_html: '<p>Test body</p>',
        body_text: 'Test body',
        category: 'test',
        variables: ['test_var'],
      };

      const result = await caller.dojoFlowMessaging.createEmailTemplate(newTemplate);
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
    });

    it('should update an existing email template', async () => {
      // First create a template
      const newTemplate = {
        name: 'Update Test',
        subject: 'Original Subject',
        body_html: '<p>Original</p>',
        category: 'test',
      };
      const created = await caller.dojoFlowMessaging.createEmailTemplate(newTemplate);

      // Then update it
      const updated = await caller.dojoFlowMessaging.updateEmailTemplate({
        id: created.id,
        name: 'Update Test',
        subject: 'Updated Subject',
        body_html: '<p>Updated</p>',
        category: 'test',
      });

      expect(updated.success).toBe(true);
    });

    it('should delete a non-default email template', async () => {
      // Create a template
      const newTemplate = {
        name: 'Delete Test',
        subject: 'To be deleted',
        body_html: '<p>Delete me</p>',
        category: 'test',
      };
      const created = await caller.dojoFlowMessaging.createEmailTemplate(newTemplate);

      // Delete it
      const result = await caller.dojoFlowMessaging.deleteEmailTemplate({ id: created.id });
      expect(result.success).toBe(true);
    });
  });

  describe('SMS Campaigns', () => {
    it('should create a new SMS campaign', async () => {
      const newCampaign = {
        name: 'Test Campaign',
        message: 'Test SMS message',
      };

      const result = await caller.dojoFlowMessaging.createSMSCampaign(newCampaign);
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
    });

    it('should retrieve SMS campaigns', async () => {
      const campaigns = await caller.dojoFlowMessaging.getSMSCampaigns();
      expect(Array.isArray(campaigns)).toBe(true);
    });

    it('should update an SMS campaign', async () => {
      // Create a campaign
      const newCampaign = {
        name: 'Update Test Campaign',
        message: 'Original message',
      };
      const created = await caller.dojoFlowMessaging.createSMSCampaign(newCampaign);

      // Update it
      const updated = await caller.dojoFlowMessaging.updateSMSCampaign({
        id: created.id,
        name: 'Update Test Campaign',
        message: 'Updated message',
      });

      expect(updated.success).toBe(true);
    });

    it('should send an SMS campaign', async () => {
      // Create a campaign
      const newCampaign = {
        name: 'Send Test Campaign',
        message: 'Test send message',
      };
      const created = await caller.dojoFlowMessaging.createSMSCampaign(newCampaign);

      // Send it
      const result = await caller.dojoFlowMessaging.sendSMSCampaign({
        id: created.id,
        recipient_ids: [1, 2, 3],
      });

      expect(result.success).toBe(true);
      expect(result.recipient_count).toBe(3);
    });

    it('should delete a draft SMS campaign', async () => {
      // Create a campaign
      const newCampaign = {
        name: 'Delete Test Campaign',
        message: 'To be deleted',
      };
      const created = await caller.dojoFlowMessaging.createSMSCampaign(newCampaign);

      // Delete it
      const result = await caller.dojoFlowMessaging.deleteSMSCampaign({ id: created.id });
      expect(result.success).toBe(true);
    });
  });
});
