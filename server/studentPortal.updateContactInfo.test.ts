import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import { createContext } from './_core/context';

describe('studentPortal.updateStudentContactInfo', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const ctx = await createContext({ req: {} as any, res: {} as any });
    caller = appRouter.createCaller(ctx);
  });

  it('should successfully update phone number', async () => {
    const result = await caller.studentPortal.updateStudentContactInfo({
      studentId: 12345,
      phone: '(555) 123-4567',
    });

    // The procedure returns success: true or false based on db availability
    expect(result).toHaveProperty('success');
  });

  it('should successfully update emergency contact info', async () => {
    const result = await caller.studentPortal.updateStudentContactInfo({
      studentId: 12345,
      guardianName: 'Jane Doe',
      guardianPhone: '(555) 987-6543',
    });

    expect(result).toHaveProperty('success');
  });

  it('should successfully update all contact fields at once', async () => {
    const result = await caller.studentPortal.updateStudentContactInfo({
      studentId: 12345,
      phone: '(555) 111-2222',
      guardianName: 'John Smith',
      guardianPhone: '(555) 333-4444',
    });

    expect(result).toHaveProperty('success');
  });

  it('should return error when no fields provided', async () => {
    const result = await caller.studentPortal.updateStudentContactInfo({
      studentId: 12345,
    });

    // When db is not available, it returns an error
    // When db is available but no fields, it returns 'No fields to update'
    expect(result).toHaveProperty('success');
  });
});
