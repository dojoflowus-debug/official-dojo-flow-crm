import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { students } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Student Update', () => {
  let testStudentId: number;
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Create a test student
    const result = await db.insert(students).values({
      firstName: 'Test',
      lastName: 'Student',
      email: 'test@example.com',
      phone: '555-1234',
      status: 'Active',
      membershipStatus: 'Standard',
      beltRank: 'White Belt',
    });
    // Handle BigInt insertId
    testStudentId = Number(result[0].insertId);
    console.log('Created test student with ID:', testStudentId);
  });
  
  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Clean up test student
    if (testStudentId && !isNaN(testStudentId)) {
      await db.delete(students).where(eq(students.id, testStudentId));
    }
  });
  
  it('should update student contact information', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    expect(testStudentId).toBeDefined();
    expect(testStudentId).not.toBeNaN();
    
    // Update the student
    await db.update(students).set({
      phone: '555-9999',
      email: 'updated@example.com',
    }).where(eq(students.id, testStudentId));
    
    // Verify the update
    const [updated] = await db.select().from(students).where(eq(students.id, testStudentId));
    
    expect(updated.phone).toBe('555-9999');
    expect(updated.email).toBe('updated@example.com');
  });
  
  it('should update student address fields', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Update address
    await db.update(students).set({
      streetAddress: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
    }).where(eq(students.id, testStudentId));
    
    // Verify
    const [updated] = await db.select().from(students).where(eq(students.id, testStudentId));
    
    expect(updated.streetAddress).toBe('123 Main St');
    expect(updated.city).toBe('Anytown');
    expect(updated.state).toBe('CA');
    expect(updated.zipCode).toBe('90210');
  });
  
  it('should update guardian information', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Update guardian info
    await db.update(students).set({
      guardianName: 'Jane Doe',
      guardianRelationship: 'Parent',
      guardianPhone: '555-5678',
      guardianEmail: 'jane@example.com',
    }).where(eq(students.id, testStudentId));
    
    // Verify
    const [updated] = await db.select().from(students).where(eq(students.id, testStudentId));
    
    expect(updated.guardianName).toBe('Jane Doe');
    expect(updated.guardianRelationship).toBe('Parent');
    expect(updated.guardianPhone).toBe('555-5678');
    expect(updated.guardianEmail).toBe('jane@example.com');
  });
  
  it('should update program and enrollment fields', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Update program info
    await db.update(students).set({
      program: 'Kids Karate',
      membershipStatus: 'Premium',
      beltRank: 'Yellow Belt',
      status: 'Active',
    }).where(eq(students.id, testStudentId));
    
    // Verify
    const [updated] = await db.select().from(students).where(eq(students.id, testStudentId));
    
    expect(updated.program).toBe('Kids Karate');
    expect(updated.membershipStatus).toBe('Premium');
    expect(updated.beltRank).toBe('Yellow Belt');
    expect(updated.status).toBe('Active');
  });
  
  it('should update geocoding coordinates', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Update coordinates
    await db.update(students).set({
      latitude: '34.0522',
      longitude: '-118.2437',
    }).where(eq(students.id, testStudentId));
    
    // Verify
    const [updated] = await db.select().from(students).where(eq(students.id, testStudentId));
    
    expect(updated.latitude).toBe('34.0522');
    expect(updated.longitude).toBe('-118.2437');
  });
});
