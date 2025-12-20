import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

// Default DojoFlow logos with proper contrast
const DEFAULT_DARK_LOGO = "/logo-light.png"; // Dark text logo for light mode
const DEFAULT_LIGHT_LOGO = "/logo-dark.png"; // Light text logo for dark mode

/**
 * Hook to get the appropriate logo based on current theme
 * - Light mode → returns dark logo (high contrast on light background)
 * - Dark mode/cinematic → returns light logo (high contrast on dark background)
 */
export function useThemeAwareLogo() {
  const { theme } = useTheme();
  const { data: settings } = trpc.settings.getSettings.useQuery();
  
  // Get custom logos from settings
  const customDarkLogo = settings?.logoDarkUrl;
  const customLightLogo = settings?.logoLightUrl;
  
  // Select logo based on theme
  if (theme === 'light') {
    // Light mode: use dark logo (or fallback to default dark logo)
    return customDarkLogo || DEFAULT_DARK_LOGO;
  } else {
    // Dark mode or cinematic: use light logo (or fallback to default light logo)
    return customLightLogo || DEFAULT_LIGHT_LOGO;
  }
}
