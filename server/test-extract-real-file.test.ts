import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import { db } from './db';
import { organizations, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Extract Real Schedule File', () => {
  it('should extract Tomball schedule file', async () => {
    // Get existing organization and user
    const org = await db.select().from(organizations).limit(1);
    const user = await db.select().from(users).where(eq(users.organizationId, org[0].id)).limit(1);

    if (!org.length || !user.length) {
      console.log('[Test] No organization or user found, skipping test');
      return;
    }

    // Create caller with test context
    const caller = appRouter.createCaller({
      user: {
        id: user[0].id,
        email: user[0].email!,
        name: user[0].name!,
        role: user[0].role as any,
        organizationId: org[0].id,
      },
      organizationId: org[0].id,
      currentOrganizationId: org[0].id,
      req: {} as any,
      res: {} as any,
    });

    console.log('[Test] Calling extractSchedule with Tomball file...');
    
    const result = await caller.kai.scheduleExtractor.extractSchedule({
      storageKey: 'test-imports/Tomball_Optimized_Schedule(3).xlsx',
      fileUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031545745/2Awpr243D2Jitpj6Cn66Rx/test-imports/Tomball_Optimized_Schedule(3).xlsx',
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: 'Tomball_Optimized_Schedule(3).xlsx',
    });

    console.log('[Test] Result:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    
    if (result.conversationId) {
      console.log('[Test] ✓ Conversation created:', result.conversationId);
    } else {
      console.log('[Test] ⚠ No conversation created, classes returned directly');
    }

    if (result.classes) {
      console.log('[Test] Classes extracted:', result.classes.length);
      console.log('[Test] First class:', result.classes[0]);
    }
  }, 60000); // 60 second timeout
});
