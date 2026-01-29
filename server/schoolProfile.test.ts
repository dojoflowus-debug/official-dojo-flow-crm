import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSchoolProfile, upsertSchoolProfile } from './schoolProfileDb';

// Mock the database
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{
      id: 1,
      organizationId: 120001,
      schoolName: 'Test Dojo',
      displayName: 'Test Display',
      tagline: null,
      phone: null,
      email: null,
      website: null,
      addressStreet: null,
      addressCity: null,
      addressState: null,
      addressPostal: null,
      addressCountry: null,
      logoLightUrl: null,
      logoDarkUrl: null,
      timezone: 'America/New_York',
      currency: 'USD',
      createdAt: '2026-01-29',
      updatedAt: '2026-01-29',
    }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }),
}));

describe('SchoolProfile Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get school profile for organization', async () => {
    const profile = await getSchoolProfile(120001);
    expect(profile).toBeDefined();
    expect(profile.organizationId).toBe(120001);
    expect(profile.schoolName).toBe('Test Dojo');
  });

  it('should return profile with all expected fields', async () => {
    const profile = await getSchoolProfile(120001);
    expect(profile).toHaveProperty('id');
    expect(profile).toHaveProperty('organizationId');
    expect(profile).toHaveProperty('schoolName');
    expect(profile).toHaveProperty('displayName');
    expect(profile).toHaveProperty('timezone');
    expect(profile).toHaveProperty('currency');
  });
});
