import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { classes } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Schedule Extractor - Duplicate Detection', () => {
  let testOrganizationId: number;
  let testClassId: number;

  beforeAll(async () => {
    // Use a test organization ID
    testOrganizationId = 999999;
    
    // Create a test class for duplicate detection
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(classes).values({
      name: 'Test Karate Class',
      dayOfWeek: 'Monday,Wednesday',
      time: '5:00 PM - 6:00 PM',
      startTime: '17:00',
      endTime: '18:00',
      instructor: 'Test Instructor',
      capacity: 20,
      enrolled: 0,
      isActive: 1,
      organizationId: testOrganizationId,
    });
    
    // Query for the created class
    const createdClasses = await db.select().from(classes).where(eq(classes.organizationId, testOrganizationId));
    const testClass = createdClasses.find(c => c.name === 'Test Karate Class' && c.startTime === '17:00');
    if (!testClass) throw new Error('Failed to create test class');
    
    testClassId = testClass.id;
    console.log('[Test] Created test class with ID:', testClassId);
  });

  afterAll(async () => {
    // Clean up test class
    const db = await getDb();
    if (!db || !testClassId || isNaN(testClassId)) return;
    
    console.log('[Test] Cleaning up test class ID:', testClassId);
    await db.delete(classes).where(eq(classes.id, testClassId));
  });

  it('should detect duplicate classes with overlapping day and time', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Fetch existing classes for the test organization
    const existingClasses = await db.select().from(classes).where(eq(classes.organizationId, testOrganizationId));
    
    expect(existingClasses.length).toBeGreaterThan(0);
    
    // Simulate extracted class with same day and time
    const extractedClass = {
      name: 'Karate Class',
      dayOfWeek: 'Monday',
      startTime: '17:00',
      endTime: '18:00',
      instructor: 'Different Instructor',
      maxCapacity: 25,
    };
    
    // Check for duplicate
    const duplicate = existingClasses.find(existing => {
      const existingDays = existing.dayOfWeek?.split(',') || [];
      const extractedDays = [extractedClass.dayOfWeek];
      
      const hasOverlappingDay = extractedDays.some(day => 
        existingDays.some(existingDay => existingDay.trim() === day.trim())
      );
      
      const timesMatch = existing.startTime === extractedClass.startTime;
      
      return hasOverlappingDay && timesMatch;
    });
    
    expect(duplicate).toBeDefined();
    expect(duplicate?.id).toBe(testClassId);
  });

  it('should not detect duplicate for different time slot', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const existingClasses = await db.select().from(classes).where(eq(classes.organizationId, testOrganizationId));
    
    // Simulate extracted class with different time
    const extractedClass = {
      name: 'Karate Class',
      dayOfWeek: 'Monday',
      startTime: '18:00', // Different time
      endTime: '19:00',
      instructor: 'Test Instructor',
      maxCapacity: 20,
    };
    
    // Check for duplicate
    const duplicate = existingClasses.find(existing => {
      const existingDays = existing.dayOfWeek?.split(',') || [];
      const extractedDays = [extractedClass.dayOfWeek];
      
      const hasOverlappingDay = extractedDays.some(day => 
        existingDays.some(existingDay => existingDay.trim() === day.trim())
      );
      
      const timesMatch = existing.startTime === extractedClass.startTime;
      
      return hasOverlappingDay && timesMatch;
    });
    
    expect(duplicate).toBeUndefined();
  });

  it('should not detect duplicate for different day', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const existingClasses = await db.select().from(classes).where(eq(classes.organizationId, testOrganizationId));
    
    // Simulate extracted class with different day
    const extractedClass = {
      name: 'Karate Class',
      dayOfWeek: 'Friday', // Different day
      startTime: '17:00',
      endTime: '18:00',
      instructor: 'Test Instructor',
      maxCapacity: 20,
    };
    
    // Check for duplicate
    const duplicate = existingClasses.find(existing => {
      const existingDays = existing.dayOfWeek?.split(',') || [];
      const extractedDays = [extractedClass.dayOfWeek];
      
      const hasOverlappingDay = extractedDays.some(day => 
        existingDays.some(existingDay => existingDay.trim() === day.trim())
      );
      
      const timesMatch = existing.startTime === extractedClass.startTime;
      
      return hasOverlappingDay && timesMatch;
    });
    
    expect(duplicate).toBeUndefined();
  });

  it('should detect duplicate when extracted class has Wednesday (part of Mon,Wed)', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const existingClasses = await db.select().from(classes).where(eq(classes.organizationId, testOrganizationId));
    
    // Simulate extracted class with Wednesday (overlaps with existing Mon,Wed class)
    const extractedClass = {
      name: 'Karate Class',
      dayOfWeek: 'Wednesday',
      startTime: '17:00',
      endTime: '18:00',
      instructor: 'Test Instructor',
      maxCapacity: 20,
    };
    
    // Check for duplicate
    const duplicate = existingClasses.find(existing => {
      const existingDays = existing.dayOfWeek?.split(',') || [];
      const extractedDays = [extractedClass.dayOfWeek];
      
      const hasOverlappingDay = extractedDays.some(day => 
        existingDays.some(existingDay => existingDay.trim() === day.trim())
      );
      
      const timesMatch = existing.startTime === extractedClass.startTime;
      
      return hasOverlappingDay && timesMatch;
    });
    
    expect(duplicate).toBeDefined();
    expect(duplicate?.id).toBe(testClassId);
  });
});
