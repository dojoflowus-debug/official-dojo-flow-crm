import { Router } from 'express';
import mysql from 'mysql2/promise';

export const kioskSettingsRouter = Router();

// Simple REST endpoint for kiosk settings (bypasses tRPC)
kioskSettingsRouter.get('/api/kiosk-settings', async (req, res) => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT businessName, logoSquare FROM dojo_settings LIMIT 1'
    );
    
    await connection.end();
    
    if (rows.length === 0) {
      res.json({
        businessName: 'DojoFlow',
        logoSquare: null,
      });
      return;
    }
    
    res.json({
      businessName: rows[0].businessName || 'DojoFlow',
      logoSquare: rows[0].logoSquare || null,
    });
  } catch (error) {
    console.error('[Kiosk Settings API] Database error:', error);
    res.json({
      businessName: 'DojoFlow',
      logoSquare: null,
    });
  }
});
