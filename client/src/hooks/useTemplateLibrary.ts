import { useState, useCallback, useEffect } from 'react';
import { templateStorage, KioskTemplate } from '../utils/templateStorage';
import { KioskConfig } from '../../shared/kioskConfig';

export function useTemplateLibrary(orgId?: string | number) {
  const [templates, setTemplates] = useState<KioskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    const loaded = templateStorage.getAll(orgId);
    setTemplates(loaded);
  }, [orgId]);

  const saveTemplate = useCallback(
    async (
      name: string,
      designPayload: KioskConfig,
      description?: string
    ): Promise<KioskTemplate> => {
      setIsLoading(true);
      setError(null);

      try {
        const template = templateStorage.create(name, designPayload, {
          description,
          scope: 'private',
          orgId,
        });

        setTemplates((prev) => [...prev, template]);
        return template;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save template';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orgId]
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const success = templateStorage.delete(id, orgId);
        if (success) {
          setTemplates((prev) => prev.filter((t) => t.id !== id));
        } else {
          throw new Error('Template not found');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete template';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orgId]
  );

  const duplicateTemplate = useCallback(
    async (id: string, newName: string): Promise<KioskTemplate> => {
      setIsLoading(true);
      setError(null);

      try {
        const duplicated = templateStorage.duplicate(id, newName, orgId);
        if (!duplicated) {
          throw new Error('Template not found');
        }

        setTemplates((prev) => [...prev, duplicated]);
        return duplicated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to duplicate template';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [orgId]
  );

  const applyTemplate = useCallback(
    (id: string): KioskConfig | null => {
      const template = templateStorage.getById(id, orgId);
      if (!template) {
        setError('Template not found');
        return null;
      }

      // Increment usage count
      templateStorage.incrementUsage(id, orgId);

      // Update templates list to reflect new usage count
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
        )
      );

      return template.designPayload;
    },
    [orgId]
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Omit<KioskTemplate, 'id' | 'createdAt' | 'createdBy'>>): void => {
      const updated = templateStorage.update(id, updates, orgId);
      if (updated) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
      }
    },
    [orgId]
  );

  return {
    templates,
    isLoading,
    error,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    applyTemplate,
    updateTemplate,
  };
}
