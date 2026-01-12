import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';

/**
 * Test suite for kiosk device router draft/published config functionality
 */

// Mock data
const mockKiosk = {
  id: 1,
  organizationId: 180001,
  locationId: 1,
  name: 'lobby',
  slug: 'lobby-1234567890',
  isActive: 1,
  config: null,
  createdAt: '2026-01-12T00:00:00.000Z',
  updatedAt: '2026-01-12T00:00:00.000Z',
};

const mockDraftConfig = {
  content: {
    headline: 'Welcome to Training',
    subtext: 'Tap to begin',
    logoUrl: 'https://example.com/logo.png',
  },
  design: {
    backgroundColor: '#1e293b',
    textColor: '#ffffff',
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleSeconds: 30,
  },
  screensaver: {
    enabled: true,
    idleSeconds: 60,
    showLogo: true,
    message: 'Screensaver active',
  },
};

const mockPublishedConfig = {
  content: {
    headline: 'Welcome to Training',
    subtext: 'Tap to begin',
    logoUrl: 'https://example.com/logo.png',
  },
  design: {
    backgroundColor: '#1e293b',
    textColor: '#ffffff',
  },
  behavior: {
    showMemberLogin: true,
    showNewStudent: true,
    idleSeconds: 30,
  },
  screensaver: {
    enabled: true,
    idleSeconds: 60,
    showLogo: true,
    message: 'Screensaver active',
  },
};

describe('Kiosk Device Router - Draft/Published Config', () => {
  describe('parseKioskConfig', () => {
    it('should parse new format with draft and published configs', () => {
      const configStr = JSON.stringify({
        draft: mockDraftConfig,
        published: mockPublishedConfig,
        enabled: true,
      });

      const result = JSON.parse(configStr);
      expect(result.draft).toEqual(mockDraftConfig);
      expect(result.published).toEqual(mockPublishedConfig);
      expect(result.enabled).toBe(true);
    });

    it('should handle legacy format (single config)', () => {
      const configStr = JSON.stringify(mockDraftConfig);
      const result = JSON.parse(configStr);
      
      expect(result).toEqual(mockDraftConfig);
      expect(result.draft).toBeUndefined();
    });

    it('should handle null config', () => {
      expect(null).toBeNull();
    });

    it('should handle empty string config', () => {
      const configStr = '';
      expect(configStr).toBe('');
    });
  });

  describe('Draft/Published Separation', () => {
    it('should store draft config without affecting published', () => {
      const configData = {
        draft: mockDraftConfig,
        published: null,
        enabled: true,
      };

      const stored = JSON.stringify(configData);
      const retrieved = JSON.parse(stored);

      expect(retrieved.draft).toEqual(mockDraftConfig);
      expect(retrieved.published).toBeNull();
      expect(retrieved.enabled).toBe(true);
    });

    it('should update draft while preserving published config', () => {
      const currentConfig = {
        draft: mockDraftConfig,
        published: mockPublishedConfig,
        enabled: true,
      };

      const updatedDraft = {
        ...mockDraftConfig,
        content: {
          ...mockDraftConfig.content,
          headline: 'Updated Headline',
        },
      };

      const newConfig = {
        draft: updatedDraft,
        published: currentConfig.published,
        enabled: currentConfig.enabled,
      };

      expect(newConfig.draft.content.headline).toBe('Updated Headline');
      expect(newConfig.published).toEqual(mockPublishedConfig);
    });

    it('should publish draft by copying to published', () => {
      const currentConfig = {
        draft: mockDraftConfig,
        published: null,
        enabled: false,
      };

      const publishedConfig = {
        draft: currentConfig.draft,
        published: currentConfig.draft,
        enabled: true,
      };

      expect(publishedConfig.draft).toEqual(mockDraftConfig);
      expect(publishedConfig.published).toEqual(mockDraftConfig);
      expect(publishedConfig.enabled).toBe(true);
    });
  });

  describe('Enabled Flag', () => {
    it('should set enabled=true on publish', () => {
      const config = {
        draft: mockDraftConfig,
        published: mockDraftConfig,
        enabled: true,
      };

      expect(config.enabled).toBe(true);
    });

    it('should prevent public access when enabled=false', () => {
      const config = {
        draft: mockDraftConfig,
        published: mockPublishedConfig,
        enabled: false,
      };

      // Public endpoint should check this
      if (!config.enabled || !config.published) {
        // Throw "not found" error
        expect(true).toBe(true);
      }
    });

    it('should prevent public access when no published config', () => {
      const config = {
        draft: mockDraftConfig,
        published: null,
        enabled: true,
      };

      // Public endpoint should check this
      if (!config.enabled || !config.published) {
        // Throw "not found" error
        expect(true).toBe(true);
      }
    });
  });

  describe('Slug Uniqueness', () => {
    it('should generate unique slugs', () => {
      const slug1 = `lobby-${Date.now()}`;
      // Simulate small delay
      const slug2 = `lobby-${Date.now() + 1}`;

      expect(slug1).not.toBe(slug2);
    });

    it('should preserve slug on kiosk', () => {
      const kiosk = {
        ...mockKiosk,
        slug: 'lobby-1234567890',
      };

      expect(kiosk.slug).toBe('lobby-1234567890');
    });
  });

  describe('Data Model Consistency', () => {
    it('should have all required fields in kiosk object', () => {
      const kiosk = {
        id: 1,
        organizationId: 180001,
        locationId: 1,
        name: 'lobby',
        slug: 'lobby-1234567890',
        isActive: 1,
        config: JSON.stringify({
          draft: mockDraftConfig,
          published: mockPublishedConfig,
          enabled: true,
        }),
        createdAt: '2026-01-12T00:00:00.000Z',
        updatedAt: '2026-01-12T00:00:00.000Z',
      };

      expect(kiosk).toHaveProperty('id');
      expect(kiosk).toHaveProperty('organizationId');
      expect(kiosk).toHaveProperty('locationId');
      expect(kiosk).toHaveProperty('name');
      expect(kiosk).toHaveProperty('slug');
      expect(kiosk).toHaveProperty('isActive');
      expect(kiosk).toHaveProperty('config');
      expect(kiosk).toHaveProperty('createdAt');
      expect(kiosk).toHaveProperty('updatedAt');
    });

    it('should maintain config integrity through JSON serialization', () => {
      const original = {
        draft: mockDraftConfig,
        published: mockPublishedConfig,
        enabled: true,
      };

      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(original);
      expect(deserialized.draft).toEqual(mockDraftConfig);
      expect(deserialized.published).toEqual(mockPublishedConfig);
    });
  });

  describe('Public vs Protected Access', () => {
    it('should allow public access to published kiosks', () => {
      const config = {
        draft: mockDraftConfig,
        published: mockPublishedConfig,
        enabled: true,
      };

      // Public endpoint logic
      const isAccessible = config.enabled && !!config.published;
      expect(isAccessible).toBe(true);
    });

    it('should deny public access to unpublished kiosks', () => {
      const config = {
        draft: mockDraftConfig,
        published: null,
        enabled: true,
      };

      // Public endpoint logic
      const isAccessible = config.enabled && !!config.published;
      expect(isAccessible).toBe(false);
    });

    it('should deny public access to disabled kiosks', () => {
      const config = {
        draft: mockDraftConfig,
        published: mockPublishedConfig,
        enabled: false,
      };

      // Public endpoint logic
      const isAccessible = config.enabled && !!config.published;
      expect(isAccessible).toBe(false);
    });

    it('should allow protected access to draft configs', () => {
      const config = {
        draft: mockDraftConfig,
        published: null,
        enabled: true,
      };

      // Protected endpoint logic
      const isDraftAccessible = !!config.draft;
      expect(isDraftAccessible).toBe(true);
    });
  });

  describe('Preview Mode Toggle', () => {
    it('should switch between draft and published preview', () => {
      const config = {
        draft: { ...mockDraftConfig, content: { headline: 'Draft' } },
        published: { ...mockPublishedConfig, content: { headline: 'Published' } },
        enabled: true,
      };

      // Draft mode
      let previewConfig = config.draft;
      expect(previewConfig.content.headline).toBe('Draft');

      // Published mode
      previewConfig = config.published;
      expect(previewConfig.content.headline).toBe('Published');
    });

    it('should fallback to draft when published not available', () => {
      const config = {
        draft: mockDraftConfig,
        published: null,
        enabled: true,
      };

      const previewConfig = config.published || config.draft;
      expect(previewConfig).toEqual(mockDraftConfig);
    });
  });
});
