/**
 * Location Context Resolver
 * Detects and manages the active location context for Kai chat
 * Priority: URL → Subdomain → Query Param → LocalStorage → Fallback
 */

export interface LocationContext {
  locationId?: number;
  locationSlug?: string;
  locationName?: string;
  address?: string;
  phone?: string;
  bookingUrl?: string;
  timezone?: string;
  hours?: any;
  enabledPrograms?: string[];
  leadRoutingEmail?: string;
  leadRoutingSms?: string;
  chatEnabled?: boolean;
  chatGreeting?: string;
}

/**
 * Resolve location context from URL path
 * Example: /locations/tomball → tomball
 */
export function resolveLocationFromPath(pathname: string): string | null {
  const match = pathname.match(/\/locations\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Resolve location context from subdomain
 * Example: tomball.mydojo.com → tomball
 */
export function resolveLocationFromSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  // If subdomain exists and it's not www, api, or localhost
  if (parts.length > 2 && !['www', 'api', 'localhost'].includes(parts[0])) {
    return parts[0];
  }
  return null;
}

/**
 * Resolve location context from query parameter
 * Example: ?location=tomball
 */
export function resolveLocationFromQueryParam(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get('location');
}

/**
 * Get saved location from localStorage
 */
export function getSavedLocationContext(): LocationContext | null {
  try {
    const saved = localStorage.getItem('kai_location_context');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Save location context to localStorage
 */
export function saveLocationContext(context: LocationContext): void {
  try {
    localStorage.setItem('kai_location_context', JSON.stringify(context));
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Resolve active location with priority order
 * 1. URL path (/locations/{slug})
 * 2. Subdomain (tomball.mydojo.com)
 * 3. Query parameter (?location=tomball)
 * 4. LocalStorage (previously selected)
 * 5. null (fallback - ask user)
 */
export function resolveActiveLocation(
  pathname: string,
  hostname: string,
  search: string
): string | null {
  // Priority 1: URL path
  const pathLocation = resolveLocationFromPath(pathname);
  if (pathLocation) return pathLocation;

  // Priority 2: Subdomain
  const subdomainLocation = resolveLocationFromSubdomain(hostname);
  if (subdomainLocation) return subdomainLocation;

  // Priority 3: Query parameter
  const queryLocation = resolveLocationFromQueryParam(search);
  if (queryLocation) return queryLocation;

  // Priority 4: LocalStorage
  const savedContext = getSavedLocationContext();
  if (savedContext?.locationSlug) return savedContext.locationSlug;

  // Priority 5: Fallback
  return null;
}

/**
 * Check if location context changed (for multi-location visitors)
 */
export function hasLocationContextChanged(
  previousSlug: string | null,
  currentSlug: string | null
): boolean {
  return previousSlug !== currentSlug && currentSlug !== null;
}
