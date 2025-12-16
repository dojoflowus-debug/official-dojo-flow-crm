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
  
  // Staff members REST API endpoint
  app.get("/api/staff", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { teamMembers } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const staff = await db.select().from(teamMembers).where(eq(teamMembers.isActive, 1));
      
      // Transform to match expected format
      const transformedStaff = staff.map(s => ({
        id: s.id,
        first_name: s.name.split(' ')[0],
        last_name: s.name.split(' ').slice(1).join(' ') || '',
        email: s.email,
        phone: s.phone,
        role: s.role.charAt(0).toUpperCase() + s.role.slice(1).replace('_', ' '),
        bio: s.focusAreas ? JSON.parse(s.focusAreas).join(', ') : '',
        photo_url: '',
        addressAs: s.addressAs,
      }));
      
      res.json(transformedStaff);
    } catch (error) {
      console.error("Staff endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch staff members" });
    }
  });
  
  // Classes REST API endpoints
  app.get("/api/classes", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { classes, classEnrollments } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const allClasses = await db.select().from(classes).where(eq(classes.isActive, 1));
      
      // Get enrollment counts for all classes from class_enrollments table
      const enrollmentCounts = await db
        .select({
          classId: classEnrollments.classId,
          count: sql<number>`COUNT(*)`
        })
        .from(classEnrollments)
        .where(eq(classEnrollments.status, 'active'))
        .groupBy(classEnrollments.classId);
      
      // Create a map of classId -> enrollment count
      const enrollmentMap = new Map(enrollmentCounts.map(e => [e.classId, e.count]));
      
      // Transform to match expected format with dynamic enrollment counts
      const transformedClasses = allClasses.map(c => ({
        id: c.id,
        name: c.name,
        time: c.time,
        enrolled: enrollmentMap.get(c.id) || 0, // Use dynamic count from class_enrollments
        capacity: c.capacity,
        instructor: c.instructor,
        instructorId: c.instructorId,
        day_of_week: c.dayOfWeek,
        schedule: c.dayOfWeek,
        type: c.program, // Program/type of class
        program: c.program,
        level: c.level,
        room: c.room,
        isActive: c.isActive,
        createdAt: c.createdAt,
      }));
      
      console.log(`[Classes API] Fetched ${transformedClasses.length} classes`);
      res.json(transformedClasses);
    } catch (error) {
      console.error("Classes endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });
  
  app.post("/api/classes", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { classes } = await import("../../drizzle/schema");
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const { name, type, level, instructor, instructorId, schedule, time, room, capacity, ageMin, ageMax, monthlyCost, description, enrolled } = req.body;
      
      console.log(`[Classes API] Creating class:`, { name, type, level, instructor, schedule, time });
      
      const result = await db.insert(classes).values({
        name: name || 'New Class',
        time: time || '',
        enrolled: enrolled || 0,
        capacity: capacity || 15,
        instructor: instructor || null,
        instructorId: instructorId || null,
        dayOfWeek: schedule || null,
        isActive: 1,
      });
      
      const insertedId = result[0].insertId;
      console.log(`[Classes API] Created class with ID: ${insertedId}`);
      
      res.status(201).json({ 
        success: true, 
        id: insertedId,
        message: 'Class created successfully' 
      });
    } catch (error) {
      console.error("Create class endpoint error:", error);
      res.status(500).json({ error: "Failed to create class" });
    }
  });
  
  app.put("/api/classes/:id", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { classes } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const classId = parseInt(req.params.id);
      const { name, type, level, instructor, instructorId, schedule, time, room, capacity, ageMin, ageMax, monthlyCost, description, enrolled } = req.body;
      
      console.log(`[Classes API] Updating class ${classId}:`, { name, time, schedule });
      
      await db.update(classes)
        .set({
          name: name || undefined,
          time: time || undefined,
          enrolled: enrolled !== undefined ? enrolled : undefined,
          capacity: capacity || undefined,
          instructor: instructor || undefined,
          instructorId: instructorId || undefined,
          dayOfWeek: schedule || undefined,
        })
        .where(eq(classes.id, classId));
      
      console.log(`[Classes API] Updated class ${classId}`);
      res.json({ success: true, message: 'Class updated successfully' });
    } catch (error) {
      console.error("Update class endpoint error:", error);
      res.status(500).json({ error: "Failed to update class" });
    }
  });
  
  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { classes } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const classId = parseInt(req.params.id);
      
      // Soft delete by setting isActive to 0
      await db.update(classes)
        .set({ isActive: 0 })
        .where(eq(classes.id, classId));
      
      console.log(`[Classes API] Deleted class ${classId}`);
      res.json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
      console.error("Delete class endpoint error:", error);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });
  
  // Staff stats REST API endpoint
  app.get("/api/staff/stats", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { teamMembers } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      
      const staff = await db.select().from(teamMembers).where(eq(teamMembers.isActive, 1));
      
      const stats = {
        total_staff: staff.length,
        instructors: staff.filter(s => s.role === 'instructor' || s.role === 'coach' || s.role === 'trainer').length,
        assistants: staff.filter(s => s.role === 'assistant').length,
        admin_staff: staff.filter(s => s.role === 'manager' || s.role === 'front_desk' || s.role === 'owner').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Staff stats endpoint error:", error);
      res.status(500).json({ error: "Failed to fetch staff stats" });
    }
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
