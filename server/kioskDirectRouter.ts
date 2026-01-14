import { router, publicProcedure } from "./_core/trpc";
import mysql from "mysql2/promise";

/**
 * Kiosk Direct Router - Bypasses Drizzle for kiosk settings
 * Uses raw mysql2 to avoid connection pool issues
 */
export const kioskDirectRouter = router({
  getSettings: publicProcedure.query(async () => {
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT businessName, logoSquare FROM dojo_settings LIMIT 1'
      );
      
      await connection.end();
      
      if (rows.length === 0) {
        return {
          businessName: 'DojoFlow',
          logoSquare: null,
        };
      }
      
      return {
        businessName: rows[0].businessName || 'DojoFlow',
        logoSquare: rows[0].logoSquare || null,
      };
    } catch (error) {
      console.error('[KioskDirect] Database error:', error);
      // Return default values on error
      return {
        businessName: 'DojoFlow',
        logoSquare: null,
      };
    }
  }),
});
