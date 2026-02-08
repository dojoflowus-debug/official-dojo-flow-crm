import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('tRPC Procedures Registration', () => {
  it('should have scheduleExtractor router registered under kai', () => {
    // Access the router to verify it exists
    const router = appRouter._def;
    expect(router).toBeDefined();
    
    // Check that kai.scheduleExtractor is in the procedures
    const procedures = Object.keys(router.procedures || {});
    const hasScheduleExtractor = procedures.some(p => p.startsWith('kai.scheduleExtractor.'));
    
    expect(hasScheduleExtractor).toBe(true);
  });

  it('should have settings router registered under kai', () => {
    // Access the router to verify it exists
    const router = appRouter._def;
    expect(router).toBeDefined();
    
    // Check that kai.settings is in the procedures
    const procedures = Object.keys(router.procedures || {});
    const hasSettings = procedures.some(p => p.startsWith('kai.settings.'));
    
    expect(hasSettings).toBe(true);
  });

  it('should have kai.settings.getDojoSettings procedure', () => {
    const router = appRouter._def;
    const procedures = Object.keys(router.procedures || {});
    
    expect(procedures).toContain('kai.settings.getDojoSettings');
  });

  it('should have kai.scheduleExtractor.extractSchedule procedure', () => {
    const router = appRouter._def;
    const procedures = Object.keys(router.procedures || {});
    
    expect(procedures).toContain('kai.scheduleExtractor.extractSchedule');
  });
});
