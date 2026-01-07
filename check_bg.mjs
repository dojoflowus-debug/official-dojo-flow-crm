import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  connectionLimit: 1,
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'dojoflow',
});

async function checkSettings() {
  try {
    const conn = await pool.getConnection();
    
    // Query kiosk_locations for main-dojo
    const [rows] = await conn.query(
      'SELECT id, location_slug, settings FROM kiosk_locations WHERE location_slug = ?',
      ['main-dojo']
    );
    
    if (rows.length === 0) {
      console.log('❌ No kiosk_locations found for main-dojo');
      conn.release();
      process.exit(1);
    }
    
    const location = rows[0];
    console.log('✅ Found location:', location.location_slug);
    console.log('Location ID:', location.id);
    
    let settings = {};
    try {
      settings = JSON.parse(location.settings);
    } catch (e) {
      console.log('Settings is not JSON, raw value:', location.settings);
    }
    
    console.log('\n📋 Full Settings Object:');
    console.log(JSON.stringify(settings, null, 2));
    
    if (settings.background?.customUrl) {
      console.log('\n🖼️ Custom Background URL:');
      console.log(settings.background.customUrl);
      console.log('\nTesting URL accessibility...');
      
      try {
        const response = await fetch(settings.background.customUrl, { method: 'HEAD' });
        console.log(`✅ URL is accessible (status: ${response.status})`);
      } catch (e) {
        console.log(`❌ URL is NOT accessible: ${e.message}`);
      }
    } else {
      console.log('\n⚠️ No customUrl found in settings.background');
    }
    
    if (settings.background?.presetUrl) {
      console.log('\n🖼️ Preset Background URL:');
      console.log(settings.background.presetUrl);
    }
    
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSettings();
