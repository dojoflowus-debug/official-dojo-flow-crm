import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { enrollments, leads } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Enrollment Flow', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testEnrollmentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');
  });

  afterAll(async () => {
    // Clean up test data
    if (db && testEnrollmentId) {
      await db.delete(enrollments).where(eq(enrollments.id, testEnrollmentId));
    }
  });

  describe('Enrollment Creation', () => {
    it('should create a new draft enrollment', async () => {
      const result = await db!.insert(enrollments).values({
        source: 'form',
        status: 'draft',
        firstName: '',
        lastName: '',
      });

      testEnrollmentId = Number(result.insertId);
      expect(testEnrollmentId).toBeGreaterThan(0);
    });
  });

  describe('Step-by-Step Updates', () => {
    it('should update student info step', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('2010-05-15'),
        age: 14,
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      expect(results.length).toBeGreaterThan(0);
      const updated = results[0];
      expect(updated.firstName).toBe('John');
      expect(updated.lastName).toBe('Doe');
      expect(updated.age).toBe(14);
    });

    it('should update contact info step', async () => {
      const updateData = {
        phone: '(555) 123-4567',
        email: 'john.doe@example.com',
        streetAddress: '123 Main St',
        city: 'Belle Chasse',
        state: 'LA',
        zipCode: '70037',
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.phone).toBe('(555) 123-4567');
      expect(updated.email).toBe('john.doe@example.com');
      expect(updated.city).toBe('Belle Chasse');
    });

    it('should update parent/guardian info step', async () => {
      const updateData = {
        guardianName: 'Jane Doe',
        guardianRelationship: 'Parent',
        guardianPhone: '(555) 987-6543',
        guardianEmail: 'jane.doe@example.com',
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.guardianName).toBe('Jane Doe');
      expect(updated.guardianRelationship).toBe('Parent');
    });

    it('should update program interest step', async () => {
      const updateData = {
        programInterest: 'Karate',
        experienceLevel: 'beginner' as const,
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.programInterest).toBe('Karate');
      expect(updated.experienceLevel).toBe('beginner');
    });

    it('should update goals and motivation step', async () => {
      const updateData = {
        goals: 'Get in shape and learn self-defense',
        motivation: 'Want to build confidence',
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.goals).toBe('Get in shape and learn self-defense');
      expect(updated.motivation).toBe('Want to build confidence');
    });

    it('should update medical info step', async () => {
      const updateData = {
        allergies: 'None',
        medicalConditions: 'None',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '(555) 987-6543',
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.allergies).toBe('None');
      expect(updated.emergencyContactName).toBe('Jane Doe');
    });

    it('should update pricing step', async () => {
      const updateData = {
        selectedMembershipPlan: 'Quarterly',
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.selectedMembershipPlan).toBe('Quarterly');
    });

    it('should update waiver step', async () => {
      const updateData = {
        waiverSigned: 1,
        waiverSignature: 'data:image/png;base64,test',
        waiverSignedAt: new Date(),
        consentGiven: 1,
        updatedAt: new Date(),
      };

      await db!.update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, testEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = results[0];
      expect(updated.waiverSigned).toBe(1);
      expect(updated.consentGiven).toBe(1);
    });
  });

  describe('Enrollment Submission', () => {
    it('should submit enrollment and create lead', async () => {
      // Get enrollment
      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const enrollment = results[0];
      expect(enrollment.firstName).toBe('John');
      expect(enrollment.lastName).toBe('Doe');
      expect(enrollment.waiverSigned).toBe(1);

      // Create lead
      const leadResult = await db!.insert(leads).values({
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        email: enrollment.email || '',
        phone: enrollment.phone || '',
        status: 'New Lead',
        source: 'Kiosk Enrollment',
        notes: `Program Interest: ${enrollment.programInterest}\\nExperience: ${enrollment.experienceLevel}`,
        createdAt: new Date(),
      });

      const leadId = Number(leadResult.insertId);
      expect(leadId).toBeGreaterThan(0);

      // Update enrollment status
      await db!.update(enrollments)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
        })
        .where(eq(enrollments.id, testEnrollmentId));

      const updatedResults = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      const updated = updatedResults[0];
      expect(updated.status).toBe('submitted');
      expect(updated.submittedAt).toBeDefined();

      // Clean up lead
      await db!.delete(leads).where(eq(leads.id, leadId));
    });
  });

  describe('Enrollment Retrieval', () => {
    it('should retrieve enrollment by ID', async () => {
      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, testEnrollmentId));

      expect(results.length).toBeGreaterThan(0);
      const enrollment = results[0];
      expect(enrollment.id).toBe(testEnrollmentId);
      expect(enrollment.firstName).toBe('John');
      expect(enrollment.lastName).toBe('Doe');
    });
  });

  describe('Kai-Readiness', () => {
    it('should support external step control (Kai-ready)', async () => {
      // Create new enrollment for Kai source
      const result = await db!.insert(enrollments).values({
        source: 'kai',
        status: 'draft',
        firstName: '',
        lastName: '',
      });
      
      const kaiEnrollmentId = Number(result.insertId);
      expect(kaiEnrollmentId).toBeGreaterThan(0);

      // Kai can update any step independently
      await db!.update(enrollments)
        .set({
          firstName: 'AI',
          lastName: 'Student',
          programInterest: 'Brazilian Jiu-Jitsu',
          experienceLevel: 'beginner',
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, kaiEnrollmentId));

      const results = await db!.select()
        .from(enrollments)
        .where(eq(enrollments.id, kaiEnrollmentId));

      const updated = results[0];
      expect(updated.source).toBe('kai');
      expect(updated.firstName).toBe('AI');
      expect(updated.programInterest).toBe('Brazilian Jiu-Jitsu');

      // Clean up
      await db!.delete(enrollments).where(eq(enrollments.id, kaiEnrollmentId));
    });
  });
});
