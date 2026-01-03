import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ownerProfileRouter } from './ownerProfileRouter';
import * as ownerProfileDb from './ownerProfileDb';
import * as db from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock dependencies
vi.mock('./ownerProfileDb');
vi.mock('./db');

describe('ownerProfileRouter', () => {
  const mockDb = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };

  const mockCtx = {
    user: {
      id: 1,
      organizationId: 100,
      openId: 'test-open-id',
      email: 'owner@test.com',
      name: 'Test Owner',
      role: 'owner',
    },
    res: {
      cookie: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upsertProfile', () => {
    it('should sync profilePhotoUrl to users table when creating a profile', async () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const input = {
        name: 'Test Owner',
        profilePhotoUrl: photoUrl,
      };

      const mockProfile = {
        id: 1,
        organizationId: 100,
        name: 'Test Owner',
        profilePhotoUrl: photoUrl,
        bio: null,
        specialties: null,
        certifications: null,
        yearsExperience: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(ownerProfileDb.getOwnerProfileByOrgId).mockResolvedValue(null);
      vi.mocked(ownerProfileDb.createOwnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      // Call the procedure
      const caller = ownerProfileRouter.createCaller(mockCtx as any);
      const result = await caller.upsertProfile(input);

      // Verify profile was created
      expect(ownerProfileDb.createOwnerProfile).toHaveBeenCalledWith({
        organizationId: 100,
        name: 'Test Owner',
        profilePhotoUrl: photoUrl,
      });

      // Verify photoUrl was synced to users table
      expect(db.getDb).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({ photoUrl });
      expect(mockDb.where).toHaveBeenCalled();

      // Verify result
      expect(result).toEqual(mockProfile);
    });

    it('should sync profilePhotoUrl to users table when updating a profile', async () => {
      const photoUrl = 'https://example.com/new-photo.jpg';
      const input = {
        name: 'Test Owner',
        profilePhotoUrl: photoUrl,
      };

      const existingProfile = {
        id: 1,
        organizationId: 100,
        name: 'Old Name',
        profilePhotoUrl: 'https://example.com/old-photo.jpg',
        bio: null,
        specialties: null,
        certifications: null,
        yearsExperience: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const updatedProfile = {
        ...existingProfile,
        name: 'Test Owner',
        profilePhotoUrl: photoUrl,
      };

      vi.mocked(ownerProfileDb.getOwnerProfileByOrgId).mockResolvedValue(existingProfile);
      vi.mocked(ownerProfileDb.updateOwnerProfile).mockResolvedValue(updatedProfile);
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      // Call the procedure
      const caller = ownerProfileRouter.createCaller(mockCtx as any);
      const result = await caller.upsertProfile(input);

      // Verify profile was updated
      expect(ownerProfileDb.updateOwnerProfile).toHaveBeenCalledWith(100, input);

      // Verify photoUrl was synced to users table
      expect(db.getDb).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockDb.set).toHaveBeenCalledWith({ photoUrl });

      // Verify result
      expect(result).toEqual(updatedProfile);
    });

    it('should not sync to users table if profilePhotoUrl is empty', async () => {
      const input = {
        name: 'Test Owner',
        profilePhotoUrl: '',
      };

      const mockProfile = {
        id: 1,
        organizationId: 100,
        name: 'Test Owner',
        profilePhotoUrl: '',
        bio: null,
        specialties: null,
        certifications: null,
        yearsExperience: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(ownerProfileDb.getOwnerProfileByOrgId).mockResolvedValue(null);
      vi.mocked(ownerProfileDb.createOwnerProfile).mockResolvedValue(mockProfile);
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      // Call the procedure
      const caller = ownerProfileRouter.createCaller(mockCtx as any);
      await caller.upsertProfile(input);

      // Verify photoUrl was NOT synced (because it's empty)
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
