import { useTheme } from '@/contexts/ThemeContext';

/**
 * Hook to check if dark mode is currently active
 * Returns true if theme is 'dark' or 'cinematic', false if 'light'
 */
export function useDarkMode(): boolean {
  const { theme } = useTheme();
  return theme === 'dark' || theme === 'cinematic';
}
