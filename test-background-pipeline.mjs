#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('\n========== POINT 1: DATABASE VERIFICATION ==========\n');
    
    // Get main-dojo location
    const [locations] = await connection.execute(
      'SELECT id, kioskSlug, kioskSettings FROM locations WHERE kioskSlug = ?',
      ['main-dojo']
    );
    
    if (locations.length === 0) {
      console.error('Location "main-dojo" not found');
      process.exit(1);
    }
    
    const location = locations[0];
    console.log('✓ Location found:', { id: location.id, kioskSlug: location.kioskSlug });

    
    let settings;
    try {
      settings = JSON.parse(location.kioskSettings || '{}');
    } catch (e) {
      console.error('Failed to parse kioskSettings:', e.message);
      settings = {};
    }
    
    console.log('\n[Point 1] DB kioskSettings.background:');
    console.log(JSON.stringify(settings.background || {}, null, 2));
    
    const hasCustomUrl = !!settings.background?.imageUrl;
    const hasPresetKey = !!settings.background?.presetKey;
    
    console.log('\n[Point 1] Analysis:');
    console.log(`  - Has custom imageUrl: ${hasCustomUrl}`);
    console.log(`  - Has presetKey: ${hasPresetKey}`);
    console.log(`  - Blur: ${settings.background?.blur || 0}`);
    console.log(`  - Dim: ${settings.background?.dim || 0}`);
    
    if (hasCustomUrl) {
      console.log(`  - Custom URL: ${settings.background.imageUrl}`);
    }
    if (hasPresetKey) {
      console.log(`  - Preset Key: ${settings.background.presetKey}`);
    }
    
    console.log('\n========== POINT 2: BACKEND QUERY SIMULATION ==========\n');
    
    // Simulate getLocationBackgroundWithFallback logic
    let returnedBackground = null;
    
    if (settings.background?.imageUrl) {
      console.log('[Point 2] Priority 1: Custom imageUrl found');
      returnedBackground = settings.background;
    } else if (settings.background?.presetKey) {
      console.log('[Point 2] Priority 2: PresetKey found');
      returnedBackground = settings.background;
    } else {
      console.log('[Point 2] Priority 3: Falling back to default');
      returnedBackground = {
        type: 'preset',
        presetKey: 'dojo-warm-lights',
        blur: 0,
        dim: 0,
      };
    }
    
    console.log('\n[Point 2] Backend would return:');
    console.log(JSON.stringify(returnedBackground, null, 2));
    
    console.log('\n========== POINT 3: FRONTEND EXPECTATION ==========\n');
    
    const finalUrl = returnedBackground?.imageUrl || returnedBackground?.presetKey;
    console.log('[Point 3] Frontend would use URL:');
    console.log(`  ${finalUrl}`);
    console.log(`  (with cache buster: ?v=${Date.now()})`);
    
    console.log('\n========== DIAGNOSIS ==========\n');
    
    if (!hasCustomUrl && !hasPresetKey) {
      console.error('❌ PROBLEM: No background configured in DB');
      console.log('   Action: Upload a background image in Settings');
    } else if (hasCustomUrl) {
      console.log('✓ Custom background URL is in DB');
      console.log('✓ Backend should return this URL');
      console.log('✓ Frontend should display this image');
    } else if (hasPresetKey) {
      console.log('✓ Preset background is configured in DB');
      console.log('✓ Backend should return this preset');
      console.log('✓ Frontend should display this preset');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
