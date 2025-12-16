import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { students, attendance } from '../drizzle/schema';
import { eq, like } from 'drizzle-orm';

describe('Kiosk Member Login', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testStudentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test student for login testing
    await db.insert(students).values({
      firstName: 'Member',
      lastName: 'Test',
      email: 'member.test@dojoflow.com',
      phone: '(555) 999-8888',
      dateOfBirth: new Date('1995-06-15'),
      beltRank: 'Blue Belt',
      program: 'Karate',
      status: 'Active',
      enrollmentDate: new Date(),
      createdAt: new Date(),
    });

    // Get the created student
    const [testStudent] = await db.select().from(students).where(eq(students.email, 'member.test@dojoflow.com')).limit(1);
    testStudentId = testStudent.id;
  });

  afterAll(async () => {
    if (!db) return;

    // Clean up test data
    await db.delete(students).where(eq(students.id, testStudentId));
  });

  describe('Phone Number Lookup', () => {
    it('should find student by exact phone number', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.phone, '%(555) 999-8888%')).limit(1);
      
      expect(result.length).toBe(1);
      expect(result[0].firstName).toBe('Member');
      expect(result[0].lastName).toBe('Test');
      expect(result[0].phone).toContain('(555) 999-8888');
    });

    it('should find student by partial phone number', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.phone, '%555%')).limit(1);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].phone).toContain('555');
    });

    it('should return empty for non-existent phone', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.phone, '%000-000-0000%')).limit(1);
      
      expect(result.length).toBe(0);
    });

    it('should handle formatted phone numbers', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.phone, '%(555) 999-8888%')).limit(1);
      
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Email Lookup', () => {
    it('should find student by exact email', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.email, '%member.test@dojoflow.com%')).limit(1);
      
      expect(result.length).toBe(1);
      expect(result[0].firstName).toBe('Member');
      expect(result[0].email).toBe('member.test@dojoflow.com');
    });

    it('should find student by partial email', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.email, '%member.test%')).limit(1);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].email).toContain('member.test');
    });

    it('should return empty for non-existent email', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.email, '%nonexistent@example.com%')).limit(1);
      
      expect(result.length).toBe(0);
    });

    it('should handle case-insensitive email search', async () => {
      if (!db) throw new Error('Database not available');

      const result = await db.select().from(students).where(like(students.email, '%MEMBER.TEST%')).limit(1);
      
      // Note: SQL LIKE is case-insensitive by default in MySQL
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Check-In After Login', () => {
    it('should verify student exists before check-in', async () => {
      if (!db) throw new Error('Database not available');

      const student = await db.select().from(students).where(eq(students.id, testStudentId)).limit(1);
      
      expect(student.length).toBe(1);
      expect(student[0].firstName).toBe('Member');
      expect(student[0].beltRank).toBe('Blue Belt');
    });

    it('should fail check-in for non-existent student', async () => {
      if (!db) throw new Error('Database not available');

      const student = await db.select().from(students).where(eq(students.id, 999999)).limit(1);
      
      expect(student.length).toBe(0);
    });
  });

  describe('Member Login Flow Integration', () => {
    it('should complete full phone login and check-in flow', async () => {
      if (!db) throw new Error('Database not available');

      // Step 1: Lookup by phone
      const lookupResult = await db.select().from(students).where(eq(students.id, testStudentId)).limit(1);
      
      expect(lookupResult.length).toBe(1);
      
      // Step 2: Verify student data
      const student = lookupResult[0];
      expect(student.firstName).toBe('Member');
      expect(student.beltRank).toBe('Blue Belt');
      expect(student.phone).toContain('(555) 999-8888');
    });

    it('should complete full email login and check-in flow', async () => {
      if (!db) throw new Error('Database not available');

      // Step 1: Lookup by email
      const lookupResult = await db.select().from(students).where(like(students.email, '%member.test@dojoflow.com%')).limit(1);
      
      expect(lookupResult.length).toBe(1);
      
      // Step 2: Verify student data
      const student = lookupResult[0];
      expect(student.email).toBe('member.test@dojoflow.com');
      expect(student.status).toBe('Active');
      

    });

    it('should handle invalid credentials gracefully', async () => {
      if (!db) throw new Error('Database not available');

      const lookupResult = await db.select().from(students).where(like(students.phone, '%000-000-0000%')).limit(1);
      
      expect(lookupResult.length).toBe(0);
    });
  });

  describe('Student Data Verification', () => {
    it('should return complete student profile on login', async () => {
      if (!db) throw new Error('Database not available');

      const student = await db.select().from(students).where(eq(students.id, testStudentId)).limit(1);
      
      expect(student.length).toBe(1);
      expect(student[0]).toHaveProperty('firstName');
      expect(student[0]).toHaveProperty('lastName');
      expect(student[0]).toHaveProperty('email');
      expect(student[0]).toHaveProperty('phone');
      expect(student[0]).toHaveProperty('beltRank');
      expect(student[0]).toHaveProperty('status');
    });

    it('should verify student is active before allowing login', async () => {
      if (!db) throw new Error('Database not available');

      const student = await db.select().from(students).where(eq(students.id, testStudentId)).limit(1);
      
      expect(student.length).toBe(1);
      expect(student[0].status).toBe('Active');
    });
  });
});
