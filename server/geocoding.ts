/**
 * Geocoding Service for Student Addresses
 * 
 * Converts street addresses to lat/lng coordinates using Google Maps Geocoding API
 */

import { makeRequest, GeocodingResult } from './_core/map';

export interface GeocodingInput {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface GeocodingOutput {
  latitude: string;
  longitude: string;
  formattedAddress: string;
}

/**
 * Geocode an address to get lat/lng coordinates
 * 
 * @param input - Address components (street, city, state, zip)
 * @returns Geocoding result with lat/lng or null if geocoding fails
 */
export async function geocodeAddress(input: GeocodingInput): Promise<GeocodingOutput | null> {
  // Build address string from components
  const addressParts: string[] = [];
  
  if (input.streetAddress) addressParts.push(input.streetAddress);
  if (input.city) addressParts.push(input.city);
  if (input.state) addressParts.push(input.state);
  if (input.zipCode) addressParts.push(input.zipCode);
  
  // Need at least city or zip to geocode
  if (addressParts.length < 2) {
    console.log('[Geocoding] Insufficient address components for geocoding');
    return null;
  }
  
  const address = addressParts.join(', ');
  console.log(`[Geocoding] Geocoding address: ${address}`);
  
  try {
    const result = await makeRequest<GeocodingResult>(
      '/maps/api/geocode/json',
      { address }
    );
    
    if (result.status !== 'OK' || !result.results || result.results.length === 0) {
      console.log(`[Geocoding] No results found for address: ${address}, status: ${result.status}`);
      return null;
    }
    
    const location = result.results[0].geometry.location;
    const formattedAddress = result.results[0].formatted_address;
    
    console.log(`[Geocoding] Successfully geocoded to: ${location.lat}, ${location.lng}`);
    
    return {
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
      formattedAddress,
    };
  } catch (error) {
    console.error('[Geocoding] Error geocoding address:', error);
    return null;
  }
}

/**
 * Check if address has changed between old and new values
 */
export function hasAddressChanged(
  oldAddress: GeocodingInput,
  newAddress: GeocodingInput
): boolean {
  return (
    oldAddress.streetAddress !== newAddress.streetAddress ||
    oldAddress.city !== newAddress.city ||
    oldAddress.state !== newAddress.state ||
    oldAddress.zipCode !== newAddress.zipCode
  );
}
