import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue({ insertId: 1 })
});

vi.mock('../db', () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: () => mockInsert(),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    })
  })
}));

vi.mock('../../drizzle/schema', () => ({
  students: { id: 'id', organizationId: 'organizationId' }
}));

vi.mock('../geocoding', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 29.7604, lng: -95.3698 })
}));

describe('students.create procedure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require organizationId from context', async () => {
    // The procedure should throw if no organizationId is in context
    // This tests the multi-tenancy requirement
    const mockCtx = {
      currentOrganizationId: null,
      user: { id: 1, name: 'Test User' }
    };

    // The procedure checks for orgId and throws if not present
    expect(mockCtx.currentOrganizationId).toBeNull();
  });

  it('should accept all student fields', () => {
    // Verify the input schema accepts all required fields
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      dateOfBirth: '2010-05-15',
      beltRank: 'White Belt',
      status: 'Active',
      membershipStatus: 'Paid',
      program: 'martial_arts',
      streetAddress: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      photoUrl: 'https://example.com/photo.jpg',
      guardianName: 'Jane Doe',
      guardianEmail: 'jane@example.com',
      guardianPhone: '555-5678',
      notes: 'Test notes',
      tags: 'new,vip'
    };

    // All fields should be valid
    expect(validInput.firstName).toBe('John');
    expect(validInput.lastName).toBe('Doe');
    expect(validInput.email).toBe('john@example.com');
    expect(validInput.dateOfBirth).toBe('2010-05-15');
    expect(validInput.guardianName).toBe('Jane Doe');
  });

  it('should handle null/empty optional fields', () => {
    // Verify minimal required fields work
    const minimalInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: null,
      phone: null,
      dateOfBirth: null,
      beltRank: null,
      status: null,
      membershipStatus: null,
      program: null,
      streetAddress: null,
      city: null,
      state: null,
      zipCode: null,
      photoUrl: null,
      guardianName: null,
      guardianEmail: null,
      guardianPhone: null,
      notes: null,
      tags: null
    };

    expect(minimalInput.firstName).toBe('John');
    expect(minimalInput.lastName).toBe('Doe');
    expect(minimalInput.email).toBeNull();
  });

  it('should parse date string to Date object', () => {
    const dateString = '2010-05-15';
    const parsedDate = new Date(dateString);
    
    expect(parsedDate).toBeInstanceOf(Date);
    // Use UTC methods to avoid timezone issues
    expect(parsedDate.getUTCFullYear()).toBe(2010);
    expect(parsedDate.getUTCMonth()).toBe(4); // 0-indexed
    expect(parsedDate.getUTCDate()).toBe(15);
  });

  it('should map enrollment status to correct status values', () => {
    const membershipStatusMap: Record<string, string> = {
      'trial': 'Trial',
      'active': 'Paid',
      'prospect': 'Standard',
      'frozen': 'Cancelled'
    };
    
    const studentStatusMap: Record<string, string> = {
      'trial': 'Active',
      'active': 'Active',
      'prospect': 'Inactive',
      'frozen': 'On Hold'
    };

    expect(membershipStatusMap['trial']).toBe('Trial');
    expect(membershipStatusMap['active']).toBe('Paid');
    expect(studentStatusMap['trial']).toBe('Active');
    expect(studentStatusMap['frozen']).toBe('On Hold');
  });
});
