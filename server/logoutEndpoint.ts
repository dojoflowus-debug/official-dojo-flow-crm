import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

/**
 * Register logout endpoint
 * Clears the session cookie and logs the user out
 */
export function registerLogoutEndpoint(app: Express) {
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("[Logout] Failed:", error);
      res.status(500).json({ success: false, error: "Logout failed" });
    }
  });
}
