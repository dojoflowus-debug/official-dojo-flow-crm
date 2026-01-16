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
  currentOrganizationId: 1,
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
      organizationId: 1,
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
      organizationId: 1,
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
      organizationId: 1,
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
      organizationId: 1,
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
      organizationId: 1,
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


describe('Kai Data Router - Classes Module', () => {
  let testClassId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Import classes table
    const { classes } = await import('../drizzle/schema');

    // Create a test class
    const result = await db.insert(classes).values({
      organizationId: 1,
      name: 'Karate 101',
      time: '18:00',
      enrolled: 15,
      capacity: 20,
      instructor: 'Sensei John',
      instructorId: 1,
      dayOfWeek: 'Monday',
      program: 'Kids Karate',
      level: 'Beginner',
      room: 'Studio A',
      isActive: 1,
    });

    const header = Array.isArray(result) ? result[0] : result;
    if (!header.insertId) throw new Error('Failed to insert test class');
    testClassId = Number(header.insertId);
  });

  it('should list all active classes', async () => {
    const result = await caller.kaiData.listClasses({
      limit: 50,
    });

    expect(result.classes).toBeDefined();
    expect(Array.isArray(result.classes)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('should get class capacity info', async () => {
    const result = await caller.kaiData.getClassCapacity({
      classId: testClassId,
    });

    expect(result).toBeDefined();
    expect(result.classId).toBe(testClassId);
    expect(result.className).toBe('Karate 101');
    expect(result.capacity).toBe(20);
    expect(result.enrolled).toBe(15);
    expect(result.available).toBe(5);
    expect(result.occupancyRate).toBe(75);
  });

  it('should get class roster', async () => {
    const result = await caller.kaiData.getClassRoster({
      classId: testClassId,
      date: new Date().toISOString().split('T')[0],
    });

    expect(result).toBeDefined();
    expect(result.classId).toBe(testClassId);
    expect(result.className).toBe('Karate 101');
    expect(Array.isArray(result.students)).toBe(true);
  });

  it('should get attendance summary', async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await caller.kaiData.getAttendanceSummary({
      startDate: weekAgo,
      endDate: today,
    });

    expect(result).toBeDefined();
    expect(result.totalClasses).toBeGreaterThanOrEqual(0);
    expect(result.totalAttendance).toBeGreaterThanOrEqual(0);
    expect(result.averageAttendanceRate).toBeGreaterThanOrEqual(0);
    expect(result.averageAttendanceRate).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.byClass)).toBe(true);
  });

  it('should filter classes by program', async () => {
    const result = await caller.kaiData.listClasses({
      programId: 1,
      limit: 50,
    });

    expect(result.classes).toBeDefined();
    expect(Array.isArray(result.classes)).toBe(true);
  });

  it('should filter classes by instructor', async () => {
    const result = await caller.kaiData.listClasses({
      instructorId: 1,
      limit: 50,
    });

    expect(result.classes).toBeDefined();
    expect(Array.isArray(result.classes)).toBe(true);
  });

  it('should filter classes by day of week', async () => {
    const result = await caller.kaiData.listClasses({
      dayOfWeek: 'Monday',
      limit: 50,
    });

    expect(result.classes).toBeDefined();
    expect(Array.isArray(result.classes)).toBe(true);
  });

  it('should return empty results for non-existent class', async () => {
    const result = await caller.kaiData.getClassCapacity({
      classId: 999999,
    });

    expect(result).toBeDefined();
    expect(result.classId).toBe(999999);
    expect(result.className).toBe('');
    expect(result.capacity).toBe(0);
  });
});


describe('Kai Data Router - Kiosk Activity Module', () => {
  let testStudentId: number;
  let testLocationId: number = 1;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test student for kiosk check-ins
    const studentResult = await db.insert(students).values({
      organizationId: 1,
      firstName: 'Kiosk',
      lastName: 'Visitor',
      email: 'kiosk.visitor@example.com',
      phone: '555-0500',
      status: 'Active',
      beltRank: 'Yellow Belt',
      membershipStatus: 'Active',
      program: 'Kids Karate',
    });

    const studentHeader = Array.isArray(studentResult) ? studentResult[0] : studentResult;
    if (!studentHeader.insertId) throw new Error('Failed to insert test student');
    testStudentId = Number(studentHeader.insertId);

    // Import studentAttendance table
    const { studentAttendance } = await import('../drizzle/schema');

    // Create attendance records for today (simulating kiosk check-ins)
    const today = new Date().toISOString().split('T')[0];
    await db.insert(studentAttendance).values({
      studentId: testStudentId,
      classId: 1,
      classDate: today,
      status: 'attended',
    });
  });

  it('should get today\'s kiosk check-ins', async () => {
    const result = await caller.kaiData.getKioskToday({
      locationId: testLocationId,
    });

    expect(result).toBeDefined();
    expect(result.checkins).toBeDefined();
    expect(Array.isArray(result.checkins)).toBe(true);
    expect(result.locationId).toBe(testLocationId);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('should get check-ins for a date range', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const result = await caller.kaiData.getCheckins({
      startDate,
      endDate,
      locationId: testLocationId,
    });

    expect(result).toBeDefined();
    expect(result.checkins).toBeDefined();
    expect(Array.isArray(result.checkins)).toBe(true);
    expect(result.locationId).toBe(testLocationId);
    expect(result.dateRange).toBeDefined();
    expect(result.dateRange.start).toBe(startDate);
    expect(result.dateRange.end).toBe(endDate);
  });

  it('should get new visitors in date range', async () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const result = await caller.kaiData.getNewVisitors({
      startDate,
      endDate,
      locationId: testLocationId,
    });

    expect(result).toBeDefined();
    expect(result.visitors).toBeDefined();
    expect(Array.isArray(result.visitors)).toBe(true);
    expect(result.locationId).toBe(testLocationId);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // Check visitor structure
    if (result.visitors.length > 0) {
      const visitor = result.visitors[0];
      expect(visitor.studentId).toBeDefined();
      expect(visitor.studentName).toBeDefined();
      expect(visitor.firstCheckInDate).toBeDefined();
      expect(['Active', 'Inactive', 'On Hold']).toContain(visitor.status);
    }
  });

  it('should get waiver status for a person', async () => {
    const result = await caller.kaiData.getWaiverStatus({
      personId: testStudentId,
    });

    expect(result).toBeDefined();
    expect(result.personId).toBe(testStudentId);
    expect(result.personName).toBeDefined();
    expect(result.hasValidWaiver).toBe(false); // No waiver created yet
    expect(result.waiverSignedAt).toBeNull();
    expect(result.waiverExpiresAt).toBeNull();
    expect(result.signerType).toBeNull();
  });

  it('should handle non-existent location gracefully', async () => {
    const result = await caller.kaiData.getKioskToday({
      locationId: 999999,
    });

    expect(result).toBeDefined();
    expect(result.checkins).toBeDefined();
    expect(Array.isArray(result.checkins)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.locationId).toBe(999999);
  });











  it('should handle invalid date ranges gracefully', async () => {
    const result = await caller.kaiData.getCheckins({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      locationId: testLocationId,
    });

    expect(result).toBeDefined();
    expect(result.checkins).toBeDefined();
    expect(Array.isArray(result.checkins)).toBe(true);
  });
});


describe('Kai Data Router - Billing Module', () => {
  let testStudentId: number;
  let testTuitionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test student for billing
    const studentResult = await db.insert(students).values({
      organizationId: 1,
      firstName: 'Billing',
      lastName: 'Student',
      email: 'billing.student@example.com',
      phone: '555-0600',
      status: 'Active',
      beltRank: 'Green Belt',
      membershipStatus: 'Active',
      program: 'Adult Karate',
    });

    const studentHeader = Array.isArray(studentResult) ? studentResult[0] : studentResult;
    if (!studentHeader.insertId) throw new Error('Failed to insert test student');
    testStudentId = Number(studentHeader.insertId);

    // Import studentTuition table
    const { studentTuition } = await import('../drizzle/schema');

    // Create a paid tuition record
    const today = new Date();
    const tuitionResult = await db.insert(studentTuition).values({
      studentId: testStudentId,
      amount: 10000, // $100.00 in cents
      dueDate: today.toISOString(),
      paidDate: today.toISOString(),
      status: 'paid',
      paymentMethod: 'credit_card',
    });

    const tuitionHeader = Array.isArray(tuitionResult) ? tuitionResult[0] : tuitionResult;
    if (!tuitionHeader.insertId) throw new Error('Failed to insert test tuition');
    testTuitionId = Number(tuitionHeader.insertId);
  });

  it('should get revenue summary for a date range', async () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);

    const result = await caller.kaiData.getRevenueSummary({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });

    expect(result).toBeDefined();
    expect(result.totalRevenue).toBeDefined();
    expect(result.totalTransactions).toBeDefined();
    expect(result.averageTransactionValue).toBeDefined();
    expect(result.dateRange).toBeDefined();
    expect(result.dateRange.start).toBeDefined();
    expect(result.dateRange.end).toBeDefined();
  });

  it('should get overdue accounts', async () => {
    const result = await caller.kaiData.getOverdueAccounts({
      daysPastDue: 30,
    });

    expect(result).toBeDefined();
    expect(result.accounts).toBeDefined();
    expect(Array.isArray(result.accounts)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);

    // Check account structure if any exist
    if (result.accounts.length > 0) {
      const account = result.accounts[0];
      expect(account.studentId).toBeDefined();
      expect(account.studentName).toBeDefined();
      expect(account.totalOverdue).toBeDefined();
      expect(account.daysPastDue).toBeDefined();
    }
  });

  it('should get failed payments for a date range', async () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    const result = await caller.kaiData.getFailedPayments({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });

    expect(result).toBeDefined();
    expect(result.payments).toBeDefined();
    expect(Array.isArray(result.payments)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    expect(result.dateRange).toBeDefined();
    expect(result.dateRange.start).toBeDefined();
    expect(result.dateRange.end).toBeDefined();

    // Check payment structure if any exist
    if (result.payments.length > 0) {
      const payment = result.payments[0];
      expect(payment.id).toBeDefined();
      expect(payment.studentId).toBeDefined();
      expect(payment.studentName).toBeDefined();
      expect(payment.amount).toBeDefined();
      expect(payment.failureDate).toBeDefined();
      expect(payment.failureReason).toBeDefined();
    }
  });

  it('should return empty results for future date range', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 30);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const result = await caller.kaiData.getRevenueSummary({
      startDate: futureStart.toISOString().split('T')[0],
      endDate: futureEnd.toISOString().split('T')[0],
    });

    expect(result).toBeDefined();
    expect(result.totalRevenue).toBe(0);
    expect(result.totalTransactions).toBe(0);
    expect(result.averageTransactionValue).toBe(0);
  });

  it('should handle location filtering', async () => {
    const result = await caller.kaiData.getOverdueAccounts({
      daysPastDue: 30,
      locationId: 1,
    });

    expect(result).toBeDefined();
    expect(result.locationId).toBe(1);
    expect(result.accounts).toBeDefined();
  });
});
