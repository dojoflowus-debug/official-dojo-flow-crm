import { Router, Request, Response } from 'express';
import { getDb } from './db';
import { locations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/location/config/:slug
 * Fetch location configuration by slug
 */
router.get('/config/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Location slug is required' });
    }

    const db = await getDb();
    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.slug, slug))
      .limit(1);

    if (!location || location.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const loc = location[0];
    
    // Parse JSON fields if they exist
    let hours = null;
    let enabledPrograms = [];
    
    try {
      if (loc.hours) {
        hours = typeof loc.hours === 'string' ? JSON.parse(loc.hours) : loc.hours;
      }
    } catch {
      hours = null;
    }

    try {
      if (loc.enabledPrograms) {
        enabledPrograms = typeof loc.enabledPrograms === 'string' 
          ? JSON.parse(loc.enabledPrograms) 
          : loc.enabledPrograms;
      }
    } catch {
      enabledPrograms = [];
    }

    return res.json({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      phone: loc.phone,
      bookingUrl: loc.bookingUrl,
      timezone: loc.timezone,
      hours,
      enabledPrograms,
      leadRoutingEmail: loc.leadRoutingEmail,
      leadRoutingSms: loc.leadRoutingSms,
      chatEnabled: loc.chatEnabled,
      chatGreeting: loc.chatGreeting,
    });
  } catch (error) {
    console.error('[Location Config] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch location config' });
  }
});

/**
 * GET /api/location/default
 * Fetch default location (first active location for the organization)
 */
router.get('/default', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    
    // Get the first active location
    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.isActive, 1))
      .limit(1);

    if (!location || location.length === 0) {
      return res.status(404).json({ error: 'No default location found' });
    }

    const loc = location[0];
    
    // Parse JSON fields
    let hours = null;
    let enabledPrograms = [];
    
    try {
      if (loc.hours) {
        hours = typeof loc.hours === 'string' ? JSON.parse(loc.hours) : loc.hours;
      }
    } catch {
      hours = null;
    }

    try {
      if (loc.enabledPrograms) {
        enabledPrograms = typeof loc.enabledPrograms === 'string' 
          ? JSON.parse(loc.enabledPrograms) 
          : loc.enabledPrograms;
      }
    } catch {
      enabledPrograms = [];
    }

    return res.json({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zipCode: loc.zipCode,
      phone: loc.phone,
      bookingUrl: loc.bookingUrl,
      timezone: loc.timezone,
      hours,
      enabledPrograms,
      leadRoutingEmail: loc.leadRoutingEmail,
      leadRoutingSms: loc.leadRoutingSms,
      chatEnabled: loc.chatEnabled,
      chatGreeting: loc.chatGreeting,
    });
  } catch (error) {
    console.error('[Location Config] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch default location' });
  }
});

export default router;
