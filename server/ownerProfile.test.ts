import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getOwnerProfileByOrgId, deleteOwnerProfile } from "./ownerProfileDb";

describe("Owner Profile Management", () => {
  const mockOrgId = 120001;
  const mockUserId = 1;

  // Mock authenticated context
  const createMockContext = (organizationId: number = mockOrgId): Context => ({
    user: {
      id: mockUserId,
      openId: "test-open-id",
      name: "Test Owner",
      email: "owner@test.com",
      phone: null,
      organizationId,
      role: "owner" as const,
      verified: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  // Cleanup after tests
  afterAll(async () => {
    try {
      await deleteOwnerProfile(mockOrgId);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("getProfile", () => {
    it("should return null when no profile exists", async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      // Clean up any existing profile first
      await deleteOwnerProfile(mockOrgId);
      
      const result = await caller.ownerProfile.getProfile();
      expect(result).toBeNull();
    });

    it("should throw error when user has no organization", async () => {
      const caller = appRouter.createCaller(createMockContext(0));
      
      await expect(caller.ownerProfile.getProfile()).rejects.toThrow(
        "No organization associated with user"
      );
    });
  });

  describe("upsertProfile", () => {
    it("should create a new profile", async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      // Clean up any existing profile first
      await deleteOwnerProfile(mockOrgId);

      const profileData = {
        name: "John Smith",
        bio: "Experienced martial arts instructor",
        specialties: "Karate, Jiu-Jitsu",
        certifications: "5th Dan Black Belt",
        yearsExperience: 20,
      };

      const result = await caller.ownerProfile.upsertProfile(profileData);

      expect(result).toBeDefined();
      expect(result?.name).toBe(profileData.name);
      expect(result?.bio).toBe(profileData.bio);
      expect(result?.specialties).toBe(profileData.specialties);
      expect(result?.certifications).toBe(profileData.certifications);
      expect(result?.yearsExperience).toBe(profileData.yearsExperience);
      expect(result?.organizationId).toBe(mockOrgId);
    });

    it("should update an existing profile", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // First create a profile
      await caller.ownerProfile.upsertProfile({
        name: "John Smith",
        bio: "Original bio",
      });

      // Then update it
      const updatedData = {
        name: "John Smith Jr.",
        bio: "Updated bio with more details",
        specialties: "Karate, Kickboxing",
      };

      const result = await caller.ownerProfile.upsertProfile(updatedData);

      expect(result).toBeDefined();
      expect(result?.name).toBe(updatedData.name);
      expect(result?.bio).toBe(updatedData.bio);
      expect(result?.specialties).toBe(updatedData.specialties);
    });

    it("should require name field", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.ownerProfile.upsertProfile({
          name: "",
          bio: "Some bio",
        })
      ).rejects.toThrow();
    });

    it("should validate years of experience as non-negative", async () => {
      const caller = appRouter.createCaller(createMockContext());

      await expect(
        caller.ownerProfile.upsertProfile({
          name: "Test Name",
          yearsExperience: -5,
        })
      ).rejects.toThrow();
    });

    it("should handle profile photo URL", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const profileData = {
        name: "John Smith",
        profilePhotoUrl: "https://example.com/photo.jpg",
      };

      const result = await caller.ownerProfile.upsertProfile(profileData);

      expect(result).toBeDefined();
      expect(result?.profilePhotoUrl).toBe(profileData.profilePhotoUrl);
    });

    it("should throw error when user has no organization", async () => {
      const caller = appRouter.createCaller(createMockContext(0));

      await expect(
        caller.ownerProfile.upsertProfile({
          name: "Test Name",
        })
      ).rejects.toThrow("No organization associated with user");
    });
  });

  describe("deleteProfile", () => {
    it("should delete an existing profile", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create a profile first
      await caller.ownerProfile.upsertProfile({
        name: "John Smith",
        bio: "Test bio",
      });

      // Verify it exists
      let profile = await getOwnerProfileByOrgId(mockOrgId);
      expect(profile).not.toBeNull();

      // Delete it
      const result = await caller.ownerProfile.deleteProfile();
      expect(result.success).toBe(true);

      // Verify it's gone
      profile = await getOwnerProfileByOrgId(mockOrgId);
      expect(profile).toBeNull();
    });

    it("should not throw error when deleting non-existent profile", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Ensure no profile exists
      await deleteOwnerProfile(mockOrgId);

      // Should not throw
      const result = await caller.ownerProfile.deleteProfile();
      expect(result.success).toBe(true);
    });

    it("should throw error when user has no organization", async () => {
      const caller = appRouter.createCaller(createMockContext(0));

      await expect(caller.ownerProfile.deleteProfile()).rejects.toThrow(
        "No organization associated with user"
      );
    });
  });

  describe("Complete workflow", () => {
    it("should support full CRUD lifecycle", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Clean slate
      await deleteOwnerProfile(mockOrgId);

      // 1. Create
      const created = await caller.ownerProfile.upsertProfile({
        name: "Jane Doe",
        bio: "Passionate instructor",
        yearsExperience: 15,
      });
      expect(created?.name).toBe("Jane Doe");

      // 2. Read
      const fetched = await caller.ownerProfile.getProfile();
      expect(fetched?.name).toBe("Jane Doe");
      expect(fetched?.yearsExperience).toBe(15);

      // 3. Update
      const updated = await caller.ownerProfile.upsertProfile({
        name: "Jane Doe",
        bio: "Updated bio",
        yearsExperience: 16,
        specialties: "Taekwondo",
      });
      expect(updated?.bio).toBe("Updated bio");
      expect(updated?.yearsExperience).toBe(16);
      expect(updated?.specialties).toBe("Taekwondo");

      // 4. Delete
      await caller.ownerProfile.deleteProfile();
      const afterDelete = await caller.ownerProfile.getProfile();
      expect(afterDelete).toBeNull();
    });
  });
});
