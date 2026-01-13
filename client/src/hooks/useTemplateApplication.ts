import { useCallback } from 'react';
import { KioskTemplate } from '../../../shared/kioskTemplates';
import { KioskConfig } from '../../../shared/kioskConfig';

interface UseTemplateApplicationProps {
  onConfigUpdate: (config: KioskConfig) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

/**
 * useTemplateApplication - Hook for applying templates to kiosk configs
 */
export function useTemplateApplication({
  onConfigUpdate,
  onShowToast,
}: UseTemplateApplicationProps) {
  const applyTemplate = useCallback(
    (template: KioskTemplate) => {
      try {
        // Deep clone the template config to avoid mutations
        const newConfig = JSON.parse(JSON.stringify(template.config)) as KioskConfig;

        // Apply the template
        onConfigUpdate(newConfig);

        // Show success message
        if (onShowToast) {
          onShowToast(`Applied "${template.name}" template`, 'success');
        }
      } catch (error) {
        console.error('Error applying template:', error);
        if (onShowToast) {
          onShowToast('Failed to apply template', 'error');
        }
      }
    },
    [onConfigUpdate, onShowToast]
  );

  return { applyTemplate };
}
