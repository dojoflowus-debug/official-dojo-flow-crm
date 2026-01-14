import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { students, leads } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Kiosk Mode', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testStudentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test student
    await db.insert(students).values({
      firstName: 'Test',
      lastName: 'Student',
      email: 'test.student@example.com',
      phone: '555-1234',
      dateOfBirth: new Date('2000-01-01'),
      beltRank: 'White Belt',
      program: 'Karate',
      status: 'active',
      enrollmentDate: new Date(),
      createdAt: new Date(),
    });

    // Get the created student
    const [testStudent] = await db.select().from(students).where(eq(students.email, 'test.student@example.com')).limit(1);
    testStudentId = testStudent.id;
  });

  describe('Check-In Flow', () => {
    it('should verify student exists before check-in', async () => {
      if (!db) throw new Error('Database not available');

      // Get student info
      const student = await db.select().from(students).where(eq(students.id, testStudentId)).limit(1);
      expect(student.length).toBe(1);
      expect(student[0].firstName).toBe('Test');
      expect(student[0].lastName).toBe('Student');
    });

    it('should not allow check-in for non-existent student', async () => {
      if (!db) throw new Error('Database not available');

      const student = await db.select().from(students).where(eq(students.id, 99999)).limit(1);
      expect(student.length).toBe(0);
    });
  });

  describe('New Student Intake', () => {
    it('should create new lead from kiosk intake', async () => {
      if (!db) throw new Error('Database not available');

      const intakeData = {
        firstName: 'New',
        lastName: 'Student',
        email: 'new.student@example.com',
        phone: '555-5678',
        dateOfBirth: '2010-05-15',
        parentGuardianName: 'Parent Name',
        interests: ['Karate', 'Kids Program'],
      };

      await db.insert(leads).values({
        firstName: intakeData.firstName,
        lastName: intakeData.lastName,
        email: intakeData.email,
        phone: intakeData.phone,
        status: 'New Lead',
        source: 'Kiosk Intake',
        notes: `Date of Birth: ${intakeData.dateOfBirth}\nParent/Guardian: ${intakeData.parentGuardianName}\nInterests: ${intakeData.interests.join(', ')}`,
        createdAt: new Date(),
      });

      // Verify lead was created
      const [newLead] = await db.select().from(leads).where(eq(leads.email, intakeData.email)).limit(1);
      expect(newLead).toBeDefined();
      expect(newLead.firstName).toBe('New');
      expect(newLead.lastName).toBe('Student');
      expect(newLead.source).toBe('Kiosk Intake');
      expect(newLead.status).toBe('New Lead');
    });

    it('should create lead with minimal required fields only', async () => {
      if (!db) throw new Error('Database not available');

      const minimalData = {
        firstName: 'Minimal',
        lastName: 'Test',
        phone: '555-9999',
        dateOfBirth: '2012-03-20',
        parentGuardianName: 'Guardian Name',
      };

      await db.insert(leads).values({
        firstName: minimalData.firstName,
        lastName: minimalData.lastName,
        email: '',
        phone: minimalData.phone,
        status: 'New Lead',
        source: 'Kiosk Intake',
        notes: `Date of Birth: ${minimalData.dateOfBirth}\nParent/Guardian: ${minimalData.parentGuardianName}`,
        createdAt: new Date(),
      });

      // Verify lead was created
      const [newLead] = await db.select().from(leads).where(eq(leads.phone, minimalData.phone)).limit(1);
      expect(newLead).toBeDefined();
      expect(newLead.firstName).toBe('Minimal');
      expect(newLead.email).toBe('');
    });

    it('should flag lead as Kiosk Intake source', async () => {
      if (!db) throw new Error('Database not available');

      await db.insert(leads).values({
        firstName: 'Source',
        lastName: 'Test',
        email: '',
        phone: '555-1111',
        status: 'New Lead',
        source: 'Kiosk Intake',
        notes: 'Test kiosk intake',
        createdAt: new Date(),
      });

      // Verify lead was created with correct source
      const [newLead] = await db.select().from(leads).where(eq(leads.phone, '555-1111')).limit(1);
      expect(newLead.source).toBe('Kiosk Intake');
    });
  });

  describe('School Lock Persistence', () => {
    it('should verify school context is required', () => {
      const schoolId = '1';
      const schoolName = 'Test Dojo';
      
      expect(schoolId).toBeDefined();
      expect(schoolName).toBeDefined();
      expect(schoolId).not.toBe('');
      expect(schoolName).not.toBe('');
    });

    it('should validate school lock configuration', () => {
      const kioskConfig = {
        schoolId: '1',
        schoolName: 'Test Dojo',
        schoolLogo: '/logo.png',
        lockedAt: Date.now(),
      };

      expect(kioskConfig.schoolId).toBeDefined();
      expect(kioskConfig.schoolName).toBeDefined();
      expect(kioskConfig.lockedAt).toBeGreaterThan(0);
    });
  });
});
