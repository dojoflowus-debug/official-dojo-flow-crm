import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export interface OrganizationSettings {
  name: string;
  logoUrl: string | null;
  themeOverride?: 'auto' | 'apple' | 'android';
}

/**
 * Custom hook to fetch organization settings (name, logo, theme)
 * Falls back to default values if not available
 */
export function useOrganizationSettings() {
  const [settings, setSettings] = useState<OrganizationSettings>({
    name: 'Dojo AI',
    logoUrl: null,
    themeOverride: 'auto',
  });
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Implement actual API call to fetch organization settings
  // For now, use mock data or localStorage
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Try to get from localStorage first (for demo/testing)
        const cached = localStorage.getItem('organizationSettings');
        if (cached) {
          setSettings(JSON.parse(cached));
        } else {
          // Default settings
          setSettings({
            name: 'Dojo AI',
            logoUrl: null,
            themeOverride: 'auto',
          });
        }
      } catch (error) {
        console.error('Error fetching organization settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
}
