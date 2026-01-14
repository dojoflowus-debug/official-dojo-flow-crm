import { KioskConfig } from '../../shared/kioskConfig';

export interface KioskTemplate {
  id: string; // UUID
  name: string;
  description?: string;
  scope: 'private' | 'org' | 'global';
  designPayload: KioskConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
}

const STORAGE_KEY_PREFIX = 'dojoFlow:kioskTemplates:v1:';
const TEMPLATES_STORAGE_MODE = 'local'; // Feature flag: 'local' | 'db'

function getStorageKey(orgId?: string | number): string {
  const id = orgId || 'default';
  return `${STORAGE_KEY_PREFIX}${id}`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const templateStorage = {
  /**
   * Get all templates for an organization
   */
  getAll(orgId?: string | number): KioskTemplate[] {
    if (TEMPLATES_STORAGE_MODE !== 'local') return [];

    try {
      const key = getStorageKey(orgId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read templates from localStorage:', error);
      return [];
    }
  },

  /**
   * Get a specific template by ID
   */
  getById(id: string, orgId?: string | number): KioskTemplate | null {
    const templates = this.getAll(orgId);
    return templates.find((t) => t.id === id) || null;
  },

  /**
   * Save a new template
   */
  create(
    name: string,
    designPayload: KioskConfig,
    options: {
      description?: string;
      scope?: 'private' | 'org' | 'global';
      createdBy?: string;
      orgId?: string | number;
    } = {}
  ): KioskTemplate {
    if (TEMPLATES_STORAGE_MODE !== 'local') {
      throw new Error('Templates storage is not available');
    }

    const template: KioskTemplate = {
      id: generateUUID(),
      name,
      description: options.description,
      scope: options.scope || 'private',
      designPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: options.createdBy || 'unknown',
      usageCount: 0,
    };

    const templates = this.getAll(options.orgId);
    templates.push(template);

    try {
      const key = getStorageKey(options.orgId);
      localStorage.setItem(key, JSON.stringify(templates));
      return template;
    } catch (error) {
      console.error('Failed to save template to localStorage:', error);
      throw new Error('Failed to save template');
    }
  },

  /**
   * Update a template
   */
  update(
    id: string,
    updates: Partial<Omit<KioskTemplate, 'id' | 'createdAt' | 'createdBy'>>,
    orgId?: string | number
  ): KioskTemplate | null {
    if (TEMPLATES_STORAGE_MODE !== 'local') return null;

    const templates = this.getAll(orgId);
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) return null;

    const updated: KioskTemplate = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    templates[index] = updated;

    try {
      const key = getStorageKey(orgId);
      localStorage.setItem(key, JSON.stringify(templates));
      return updated;
    } catch (error) {
      console.error('Failed to update template in localStorage:', error);
      return null;
    }
  },

  /**
   * Delete a template
   */
  delete(id: string, orgId?: string | number): boolean {
    if (TEMPLATES_STORAGE_MODE !== 'local') return false;

    const templates = this.getAll(orgId);
    const filtered = templates.filter((t) => t.id !== id);

    if (filtered.length === templates.length) return false; // Not found

    try {
      const key = getStorageKey(orgId);
      localStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete template from localStorage:', error);
      return false;
    }
  },

  /**
   * Duplicate a template
   */
  duplicate(id: string, newName: string, orgId?: string | number): KioskTemplate | null {
    const template = this.getById(id, orgId);
    if (!template) return null;

    return this.create(newName, template.designPayload, {
      description: template.description,
      scope: template.scope,
      createdBy: template.createdBy,
      orgId,
    });
  },

  /**
   * Increment usage count for a template
   */
  incrementUsage(id: string, orgId?: string | number): void {
    const template = this.getById(id, orgId);
    if (template) {
      this.update(id, { usageCount: template.usageCount + 1 }, orgId);
    }
  },

  /**
   * Clear all templates (for testing/reset)
   */
  clear(orgId?: string | number): void {
    if (TEMPLATES_STORAGE_MODE !== 'local') return;

    try {
      const key = getStorageKey(orgId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear templates from localStorage:', error);
    }
  },
};
