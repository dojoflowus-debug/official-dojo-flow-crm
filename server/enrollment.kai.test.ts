import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('Kai Enrollment', () => {
  it('should create enrollment and have conversation', async () => {
    const caller = appRouter.createCaller({ user: null });
    
    // Create enrollment
    const createResult = await caller.enrollment.create({ source: 'kai' });
    console.log('Create result:', createResult);
    
    expect(createResult.success).toBe(true);
    expect(createResult.enrollmentId).toBeDefined();
    
    if (!createResult.enrollmentId) {
      throw new Error('No enrollment ID');
    }
    
    // Send first message
    const converseResult = await caller.enrollment.kaiConverse({
      enrollmentId: createResult.enrollmentId,
      userMessage: 'My name is John Smith',
    });
    
    console.log('Converse result:', converseResult);
    
    expect(converseResult.kaiResponse).toBeDefined();
    expect(converseResult.kaiResponse.length).toBeGreaterThan(0);
    expect(converseResult.extractedData).toBeDefined();
  });
});
