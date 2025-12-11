import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodeAddress, hasAddressChanged } from '../geocoding';

// Mock the map module
vi.mock('../_core/map', () => ({
  makeRequest: vi.fn(),
}));

import { makeRequest } from '../_core/map';

describe('Geocoding Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('geocodeAddress', () => {
    it('should return null if insufficient address components', async () => {
      const result = await geocodeAddress({ streetAddress: '123 Main St' });
      expect(result).toBeNull();
      expect(makeRequest).not.toHaveBeenCalled();
    });
    
    it('should geocode address with city and state', async () => {
      (makeRequest as any).mockResolvedValue({
        status: 'OK',
        results: [{
          geometry: {
            location: { lat: 34.0522, lng: -118.2437 }
          },
          formatted_address: '123 Main St, Los Angeles, CA 90012, USA'
        }]
      });
      
      const result = await geocodeAddress({
        streetAddress: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
      });
      
      expect(result).not.toBeNull();
      expect(result?.latitude).toBe('34.0522');
      expect(result?.longitude).toBe('-118.2437');
      expect(result?.formattedAddress).toBe('123 Main St, Los Angeles, CA 90012, USA');
    });
    
    it('should geocode address with just zip code', async () => {
      (makeRequest as any).mockResolvedValue({
        status: 'OK',
        results: [{
          geometry: {
            location: { lat: 90210, lng: -118.4065 }
          },
          formatted_address: 'Beverly Hills, CA 90210, USA'
        }]
      });
      
      const result = await geocodeAddress({
        city: 'Beverly Hills',
        zipCode: '90210',
      });
      
      expect(result).not.toBeNull();
      expect(makeRequest).toHaveBeenCalledWith(
        '/maps/api/geocode/json',
        { address: 'Beverly Hills, 90210' }
      );
    });
    
    it('should return null if geocoding fails', async () => {
      (makeRequest as any).mockResolvedValue({
        status: 'ZERO_RESULTS',
        results: []
      });
      
      const result = await geocodeAddress({
        streetAddress: 'Invalid Address',
        city: 'Nowhere',
      });
      
      expect(result).toBeNull();
    });
    
    it('should handle API errors gracefully', async () => {
      (makeRequest as any).mockRejectedValue(new Error('API Error'));
      
      const result = await geocodeAddress({
        streetAddress: '123 Main St',
        city: 'Los Angeles',
      });
      
      expect(result).toBeNull();
    });
  });
  
  describe('hasAddressChanged', () => {
    it('should return true if street address changed', () => {
      const result = hasAddressChanged(
        { streetAddress: '123 Main St', city: 'LA' },
        { streetAddress: '456 Oak Ave', city: 'LA' }
      );
      expect(result).toBe(true);
    });
    
    it('should return true if city changed', () => {
      const result = hasAddressChanged(
        { streetAddress: '123 Main St', city: 'LA' },
        { streetAddress: '123 Main St', city: 'SF' }
      );
      expect(result).toBe(true);
    });
    
    it('should return true if state changed', () => {
      const result = hasAddressChanged(
        { state: 'CA' },
        { state: 'NY' }
      );
      expect(result).toBe(true);
    });
    
    it('should return true if zip code changed', () => {
      const result = hasAddressChanged(
        { zipCode: '90210' },
        { zipCode: '10001' }
      );
      expect(result).toBe(true);
    });
    
    it('should return false if nothing changed', () => {
      const result = hasAddressChanged(
        { streetAddress: '123 Main St', city: 'LA', state: 'CA', zipCode: '90210' },
        { streetAddress: '123 Main St', city: 'LA', state: 'CA', zipCode: '90210' }
      );
      expect(result).toBe(false);
    });
  });
});
