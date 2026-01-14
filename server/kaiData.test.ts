/**
 * Tests for Kai Data Router
 * Validates student and lead query procedures
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { students, leads } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock context for protected procedures
const mockContext = {
  user: {
    id: 1,
    openId: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// Create caller with mock context
const caller = appRouter.createCaller(mockContext);

describe('Kai Data Router - Student Queries', () => {
  let testStudentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test student
    const result = await db.insert(students).values({
      firstName: 'Test',
      lastName: 'Student',
      email: 'test.student@example.com',
      phone: '555-0100',
      status: 'Active',
      beltRank: 'White Belt',
      membershipStatus: 'Active',
      program: 'Kids Karate',
    });

    // insertId is in the first element of the result array (ResultSetHeader)
    const header = Array.isArray(result) ? result[0] : result;
    if (!header.insertId) throw new Error('Failed to insert test student');
    testStudentId = Number(header.insertId);
  });

  it('should search students by name', async () => {
    const result = await caller.kaiData.searchStudents({
      query: 'Test',
      limit: 10,
    });

    expect(result.students).toBeDefined();
    expect(result.students.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
    
    const foundStudent = result.students.find(s => s.id === testStudentId);
    expect(foundStudent).toBeDefined();
    expect(foundStudent?.firstName).toBe('Test');
    expect(foundStudent?.lastName).toBe('Student');
  });

  it('should search students by email', async () => {
    const result = await caller.kaiData.searchStudents({
      query: 'test.student@example.com',
      limit: 10,
    });

    expect(result.students).toBeDefined();
    const foundStudent = result.students.find(s => s.id === testStudentId);
    expect(foundStudent).toBeDefined();
    expect(foundStudent?.email).toBe('test.student@example.com');
  });

  it('should search students by phone', async () => {
    const result = await caller.kaiData.searchStudents({
      query: '555-0100',
      limit: 10,
    });

    expect(result.students).toBeDefined();
    const foundStudent = result.students.find(s => s.id === testStudentId);
    expect(foundStudent).toBeDefined();
    expect(foundStudent?.phone).toBe('555-0100');
  });

  it('should get student by ID', async () => {
    const result = await caller.kaiData.getStudent({
      studentId: testStudentId,
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(testStudentId);
    expect(result?.firstName).toBe('Test');
    expect(result?.lastName).toBe('Student');
    expect(result?.email).toBe('test.student@example.com');
    expect(result?.beltRank).toBe('White Belt');
    expect(result?.status).toBe('Active');
  });

  it('should return null for non-existent student', async () => {
    const result = await caller.kaiData.getStudent({
      studentId: 999999,
    });

    expect(result).toBeNull();
  });

  it('should list at-risk students', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create an inactive student
    await db.insert(students).values({
      firstName: 'Inactive',
      lastName: 'Student',
      email: 'inactive@example.com',
      status: 'Inactive',
    });

    const result = await caller.kaiData.listAtRiskStudents({
      days: 30,
    });

    expect(result.students).toBeDefined();
    expect(result.students.length).toBeGreaterThan(0);
    
    // Should only include inactive or on-hold students
    result.students.forEach(student => {
      expect(['Inactive', 'On Hold']).toContain(student.status);
    });
  });

  it('should respect limit parameter', async () => {
    const result = await caller.kaiData.searchStudents({
      query: '',
      limit: 2,
    });

    expect(result.students.length).toBeLessThanOrEqual(2);
  });
});

describe('Kai Data Router - Lead Queries', () => {
  let testLeadId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test lead
    const result = await db.insert(leads).values({
      firstName: 'Test',
      lastName: 'Lead',
      email: 'test.lead@example.com',
      phone: '555-0200',
      status: 'New Lead',
      source: 'Website',
      message: 'Interested in kids classes',
    });

    // insertId is in the first element of the result array (ResultSetHeader)
    const header = Array.isArray(result) ? result[0] : result;
    if (!header.insertId) throw new Error('Failed to insert test lead');
    testLeadId = Number(header.insertId);
  });

  it('should search leads by name', async () => {
    const result = await caller.kaiData.searchLeads({
      query: 'Test',
      limit: 10,
    });

    expect(result.leads).toBeDefined();
    expect(result.leads.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
    
    const foundLead = result.leads.find(l => l.id === testLeadId);
    expect(foundLead).toBeDefined();
    expect(foundLead?.firstName).toBe('Test');
    expect(foundLead?.lastName).toBe('Lead');
  });

  it('should search leads by email', async () => {
    const result = await caller.kaiData.searchLeads({
      query: 'test.lead@example.com',
      limit: 10,
    });

    expect(result.leads).toBeDefined();
    const foundLead = result.leads.find(l => l.id === testLeadId);
    expect(foundLead).toBeDefined();
    expect(foundLead?.email).toBe('test.lead@example.com');
  });

  it('should get lead by ID', async () => {
    const result = await caller.kaiData.getLead({
      leadId: testLeadId,
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(testLeadId);
    expect(result?.firstName).toBe('Test');
    expect(result?.lastName).toBe('Lead');
    expect(result?.email).toBe('test.lead@example.com');
    expect(result?.status).toBe('New Lead');
    expect(result?.source).toBe('Website');
    expect(result?.message).toBe('Interested in kids classes');
  });

  it('should return null for non-existent lead', async () => {
    const result = await caller.kaiData.getLead({
      leadId: 999999,
    });

    expect(result).toBeNull();
  });

  it('should get new leads', async () => {
    const result = await caller.kaiData.getNewLeads({
      days: 7,
    });

    expect(result.leads).toBeDefined();
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    
    // Should only include new leads
    result.leads.forEach(lead => {
      expect(lead.status).toBe('New Lead');
    });
  });

  it('should respect limit parameter for leads', async () => {
    const result = await caller.kaiData.searchLeads({
      query: '',
      limit: 2,
    });

    expect(result.leads.length).toBeLessThanOrEqual(2);
  });
});

describe('Kai Data Router - Data Integrity', () => {
  it('should return complete student card payload', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a student with all fields
    const result = await db.insert(students).values({
      firstName: 'Complete',
      lastName: 'Student',
      email: 'complete@example.com',
      phone: '555-0300',
      dateOfBirth: new Date('2010-01-01'),
      beltRank: 'Blue Belt',
      status: 'Active',
      membershipStatus: 'Premium',
      program: 'Advanced Training',
      streetAddress: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      guardianName: 'Parent Name',
      guardianRelationship: 'Mother',
      guardianPhone: '555-0301',
      guardianEmail: 'parent@example.com',
    });

    const header = Array.isArray(result) ? result[0] : result;
    if (!header.insertId) throw new Error('Failed to insert student');
    const studentId = Number(header.insertId);
    const student = await caller.kaiData.getStudent({ studentId });

    expect(student).toBeDefined();
    expect(student?.firstName).toBe('Complete');
    expect(student?.email).toBe('complete@example.com');
    expect(student?.beltRank).toBe('Blue Belt');
    expect(student?.streetAddress).toBe('123 Main St');
    expect(student?.guardianName).toBe('Parent Name');
    expect(student?.guardianRelationship).toBe('Mother');
  });

  it('should return complete lead card payload', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a lead with all fields
    const result = await db.insert(leads).values({
      firstName: 'Complete',
      lastName: 'Lead',
      email: 'complete.lead@example.com',
      phone: '555-0400',
      status: 'Contact Made',
      source: 'Referral',
      message: 'Referred by friend',
      notes: 'Very interested, follow up next week',
      address: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    });

    const header = Array.isArray(result) ? result[0] : result;
    if (!header.insertId) throw new Error('Failed to insert lead');
    const leadId = Number(header.insertId);
    const lead = await caller.kaiData.getLead({ leadId });

    expect(lead).toBeDefined();
    expect(lead?.firstName).toBe('Complete');
    expect(lead?.email).toBe('complete.lead@example.com');
    expect(lead?.status).toBe('Contact Made');
    expect(lead?.source).toBe('Referral');
    expect(lead?.message).toBe('Referred by friend');
    expect(lead?.notes).toBe('Very interested, follow up next week');
    expect(lead?.address).toBe('456 Oak Ave');
  });
});

describe('Kai Data Router - Error Handling', () => {
  it('should handle empty search queries gracefully', async () => {
    const result = await caller.kaiData.searchStudents({
      query: '',
      limit: 10,
    });

    expect(result.students).toBeDefined();
    expect(Array.isArray(result.students)).toBe(true);
  });

  it('should handle special characters in search', async () => {
    const result = await caller.kaiData.searchStudents({
      query: "O'Brien",
      limit: 10,
    });

    expect(result.students).toBeDefined();
    expect(Array.isArray(result.students)).toBe(true);
  });
});
