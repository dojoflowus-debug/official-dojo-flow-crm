import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import session from "express-session";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerLogoutEndpoint } from "../logoutEndpoint";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startScheduler } from "../services/scheduler";
import passport from "../auth/passport";
import socialAuthRouter from "../auth/socialAuthRouter";
import localAuthRouter from "../auth/localAuthRouter";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Session configuration for passport
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dojoflow-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Mount local auth routes (email/password login and registration)
  app.use("/api/auth", localAuthRouter);
  // Mount social auth routes (includes /api/auth/google and /api/auth/google/callback)
  app.use("/api/auth", socialAuthRouter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Logout endpoint under /api/auth/logout
  registerLogoutEndpoint(app);
  
  // ElevenLabs Text-to-Speech endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceGender } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      
      // Call ElevenLabs API
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
      
      if (!ELEVENLABS_API_KEY) {
        console.error("ELEVENLABS_API_KEY not configured");
        return res.status(500).json({ error: "TTS service not configured" });
      }
      
      // Voice mapping: female = Alexandra, male = Adam (deep, narration)
      const VOICE_ID = voiceGender === 'male' 
        ? "pNInz6obpgDQGcFmaJgB" // Adam - deep male voice for narration
        : "kdmDKE6EkgrWrrykO9Qt"; // Alexandra - Conversational and Real (female)
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.98,
              similarity_boost: 0.99,
              style: 0.01,
              use_speaker_boost: true
            }
          })
        }
      );
      
      if (!response.ok) {
        console.error("ElevenLabs API error:", await response.text());
        return res.status(500).json({ error: "TTS generation failed" });
      }
      
      // Stream audio back to client
      const audioBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("TTS endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // REST API endpoint for subscription credits (for backward compatibility)
  app.get("/api/subscription/credits/balance", async (req, res) => {
    try {
      // Return mock credit data
      res.json({
        current_balance: 10000,
        monthly_allocation: 15000,
        usage_this_month: 5000,
        reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      });
    } catch (error) {
      console.error("Credits balance endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch credit balance" });
    }
  });
  
  // REST Webhook endpoint for external integrations
  app.post("/api/webhook/leads/create", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { leads, webhookKeys } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { notifyNewLead } = await import("../services/notifications");
      
      const input = req.body;
      
      // Validate required fields
      if (!input.name) {
        return res.status(400).json({ error: "Name is required" });
      }
      
      if (!input.email && !input.phone) {
        return res.status(400).json({ error: "Either email or phone is required" });
      }
      
      const db = await getDb();
      
      // Optional API key validation
      if (input.api_key) {
        const [keyRecord] = await db
          .select()
          .from(webhookKeys)
          .where(eq(webhookKeys.apiKey, input.api_key))
          .limit(1);
        
        if (!keyRecord) {
          return res.status(401).json({ error: "Invalid API key" });
        }
        
        if (!keyRecord.isActive) {
          return res.status(401).json({ error: "API key is inactive" });
        }
        
        // Update usage stats
        await db
          .update(webhookKeys)
          .set({
            lastUsedAt: new Date(),
            usageCount: keyRecord.usageCount + 1,
          })
          .where(eq(webhookKeys.id, keyRecord.id));
      }
      
      // Parse name into firstName and lastName
      const nameParts = input.name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;
      
      // Check for duplicate leads (by email)
      if (input.email) {
        const [existingLead] = await db
          .select()
          .from(leads)
          .where(eq(leads.email, input.email))
          .limit(1);
        
        if (existingLead) {
          // Update existing lead
          await db
            .update(leads)
            .set({
              firstName,
              lastName,
              phone: input.phone || existingLead.phone,
              source: input.source || existingLead.source,
              message: input.message,
              utmSource: input.utm_source,
              utmMedium: input.utm_medium,
              utmCampaign: input.utm_campaign,
              utmContent: input.utm_content,
              utmTerm: input.utm_term,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existingLead.id));
          
          return res.json({
            success: true,
            lead_id: existingLead.id,
            message: "Lead updated successfully",
          });
        }
      }
      
      // Create new lead
      const [newLead] = await db
        .insert(leads)
        .values({
          firstName,
          lastName,
          email: input.email || null,
          phone: input.phone || null,
          source: input.source || "Website Form",
          message: input.message || null,
          utmSource: input.utm_source || null,
          utmMedium: input.utm_medium || null,
          utmCampaign: input.utm_campaign || null,
          utmContent: input.utm_content || null,
          utmTerm: input.utm_term || null,
          status: "New Lead",
        })
        .$returningId();
      
      // Trigger notifications asynchronously
      notifyNewLead({
        id: newLead.id,
        firstName,
        lastName,
        email: input.email,
        phone: input.phone,
        source: input.source || "Website Form",
      }).catch(err => {
        console.error('[Webhook] Notification error:', err);
      });
      
      return res.json({
        success: true,
        lead_id: newLead.id,
        message: "Lead created successfully",
      });
    } catch (error) {
      console.error('[Webhook] Error:', error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Health check endpoint
  app.get("/api/webhook/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "DojoFlow Webhook API",
    });
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start automation scheduler
    startScheduler();
  });
}

startServer().catch(console.error);
