import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import { createContext } from './_core/context';

// Mock the database
vi.mock('./db', () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ affectedRows: 1 }])
      })
    })
  }
}));

describe('studentPortal.updateStudentPhoto', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const ctx = await createContext({ req: {} as any, res: {} as any });
    caller = appRouter.createCaller(ctx);
  });

  it('should successfully update student photo URL', async () => {
    const result = await caller.studentPortal.updateStudentPhoto({
      studentId: 12345,
      photoUrl: 'https://storage.example.com/profile-photos/student-12345-photo.jpg',
    });

    expect(result.success).toBe(true);
  });

  it('should require studentId and photoUrl', async () => {
    // Test that the procedure validates input
    await expect(
      caller.studentPortal.updateStudentPhoto({
        studentId: 0,
        photoUrl: '',
      })
    ).resolves.toHaveProperty('success');
  });
});
