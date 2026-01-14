import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { organizationUsers, organizations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn:new Date().toISOString(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Get user's organization for multi-tenancy
      const dbConn = await db.getDb();
      const user = await db.getUserByOpenId(userInfo.openId);
      let currentOrganizationId: number | null = null;
      
      if (dbConn && user) {
        const orgMemberships = await dbConn
          .select({ organizationId: organizationUsers.organizationId })
          .from(organizationUsers)
          .where(eq(organizationUsers.userId, user.id))
          .limit(1);
        
        if (orgMemberships.length > 0) {
          currentOrganizationId = orgMemberships[0].organizationId;
        }
      }

      // Set session cookie with organization context
      const sessionData = {
        userId: user?.id,
        email: userInfo.email,
        name: userInfo.name,
        currentOrganizationId,
      };
      res.cookie("session", JSON.stringify(sessionData), { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/kai");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
