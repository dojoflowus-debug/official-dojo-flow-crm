import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "./auth/passport";
import socialAuthRouter from "./auth/socialAuthRouter.js";
import localAuthRouter from "./auth/localAuthRouter.js";
import uploadRouter from "./uploadRouter.js";
import storageProxyRouter from "./storageProxyRouter.js";
import customBackgroundsRouter from "./api.cinematic-backgrounds.js";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run one-time startup migrations that can't be handled by drizzle-kit
 * (e.g. column type changes that were missed in migration files)
 */
async function runStartupMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;
  try {
    const mysql = await import('mysql2/promise');
    const parsed = new URL(dbUrl);
    const conn = await mysql.createConnection({
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.replace('/', ''),
      ssl: { rejectUnauthorized: false },
    });

    // Check current column type for photoUrl in users table
    const [cols] = await conn.execute(
      `SHOW COLUMNS FROM \`users\` WHERE Field IN ('photoUrl', 'photoUrlSmall')`
    ) as any;

    for (const col of cols) {
      if (col.Type === 'varchar(500)' || col.Type?.startsWith('varchar')) {
        console.log(`[Migration] Altering users.${col.Field} from ${col.Type} to mediumtext...`);
        await conn.execute(`ALTER TABLE \`users\` MODIFY COLUMN \`${col.Field}\` mediumtext`);
        console.log(`[Migration] ✓ users.${col.Field} is now mediumtext`);
      } else {
        console.log(`[Migration] users.${col.Field} is already ${col.Type}, no change needed`);
      }
    }

    // Ensure school_profiles has all required columns
    const spColsToAdd = [
      ['logo_light_data', 'MEDIUMTEXT NULL'],
      ['logo_dark_data', 'MEDIUMTEXT NULL'],
      ['phone', 'VARCHAR(50) NULL'],
      ['email', 'VARCHAR(255) NULL'],
      ['website', 'VARCHAR(500) NULL'],
      ['tagline', 'VARCHAR(500) NULL'],
      ['display_name', 'VARCHAR(255) NULL'],
      ['address_street', 'VARCHAR(255) NULL'],
      ['address_city', 'VARCHAR(100) NULL'],
      ['address_state', 'VARCHAR(100) NULL'],
      ['address_postal', 'VARCHAR(20) NULL'],
      ['address_country', 'VARCHAR(100) NULL'],
      ['logo_icon_light_url', 'MEDIUMTEXT NULL'],
      ['logo_icon_dark_url', 'MEDIUMTEXT NULL'],
      ['brand_color_primary', 'VARCHAR(7) NULL'],
      ['brand_color_secondary', 'VARCHAR(7) NULL'],
      ['brand_color_tertiary', 'VARCHAR(7) NULL'],
      ['chat_use_full_logo', 'TINYINT(1) DEFAULT 0'],
      ['chat_welcome_message', 'TEXT NULL'],
    ];
    try {
      for (const [col, def] of spColsToAdd) {
        await conn.execute(`ALTER TABLE \`school_profiles\` ADD COLUMN IF NOT EXISTS \`${col}\` ${def}`);
      }
      console.log('[Migration] ✓ school_profiles columns ensured');
    } catch (spErr: any) {
      if (!spErr.message?.includes('Duplicate column') && !spErr.message?.includes("doesn't exist")) {
        console.warn('[Migration] school_profiles columns warning:', spErr.message);
      }
    }

    // Ensure dojo_settings has owner profile columns (use SHOW COLUMNS for TiDB compatibility)
    try {
      const [dsExistingCols] = await conn.execute(
        `SHOW COLUMNS FROM \`dojo_settings\` WHERE Field IN ('ownerRank','programsTaught')`
      ) as any;
      const dsExistingNames = new Set((dsExistingCols as any[]).map((c: any) => c.Field));
      const dsColsToAdd: [string, string][] = [
        ['ownerRank', 'VARCHAR(100) NULL'],
        ['programsTaught', 'TEXT NULL'],
      ];
      for (const [col, def] of dsColsToAdd) {
        if (!dsExistingNames.has(col)) {
          await conn.execute(`ALTER TABLE \`dojo_settings\` ADD COLUMN \`${col}\` ${def}`);
          console.log(`[Migration] ✓ dojo_settings.${col} column added`);
        } else {
          console.log(`[Migration] dojo_settings.${col} already exists, no change needed`);
        }
      }
      console.log('[Migration] ✓ dojo_settings owner profile columns ensured');
    } catch (dsErr: any) {
      console.warn('[Migration] dojo_settings columns warning:', (dsErr as any).message);
    }

    // Upgrade logo URL columns from varchar to mediumtext to support base64 data URLs
    const logoUrlCols = ['logo_light_url', 'logo_dark_url', 'logo_icon_light_url', 'logo_icon_dark_url'];
    try {
      const [logoCols] = await conn.execute(
        `SHOW COLUMNS FROM \`school_profiles\` WHERE Field IN ('logo_light_url','logo_dark_url','logo_icon_light_url','logo_icon_dark_url')`
      ) as any;
      for (const col of logoCols) {
        if (col.Type?.toLowerCase().startsWith('varchar')) {
          await conn.execute(`ALTER TABLE \`school_profiles\` MODIFY COLUMN \`${col.Field}\` MEDIUMTEXT NULL`);
          console.log(`[Migration] ✓ school_profiles.${col.Field} upgraded to MEDIUMTEXT`);
        }
      }
    } catch (logoErr: any) {
      console.warn('[Migration] Logo URL column upgrade warning:', logoErr.message);
    }

    // Ensure users table has must_change_password column
    try {
      await conn.execute(
        `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`must_change_password\` INT NOT NULL DEFAULT 0`
      );
      console.log('[Migration] ✓ users.must_change_password column ensured');
    } catch (mcpErr: any) {
      if (!mcpErr.message?.includes('Duplicate column')) {
        console.warn('[Migration] users.must_change_password warning:', mcpErr.message);
      }
    }

    // Ensure student_billing_enrollments has retry_count column
    try {
      await conn.execute(
        `ALTER TABLE \`student_billing_enrollments\` ADD COLUMN IF NOT EXISTS \`retry_count\` INT NOT NULL DEFAULT 0`
      );
      console.log('[Migration] ✓ student_billing_enrollments.retry_count column ensured');
    } catch (retryErr: any) {
      if (!retryErr.message?.includes('Duplicate column')) {
        console.warn('[Migration] student_billing_enrollments.retry_count warning:', retryErr.message);
      }
    }

    await conn.end();
  } catch (err: any) {
    console.warn('[Migration] Startup migration warning (non-fatal):', err.message);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Run startup migrations (alter column types if needed)
  await runStartupMigrations();

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Cookie parser — required for req.cookies to be populated (used by auth context)
  app.use(cookieParser());

  // Session configuration
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

  // Mount social auth routes (Google OAuth + logout + /me)
  app.use("/api/auth", socialAuthRouter);
  // Mount local auth routes (email/password login + register)
  app.use("/api/auth", localAuthRouter);
  
  // Mount custom backgrounds routes
  console.log('[Server] Mounting custom backgrounds router at /api/custom-backgrounds');
  app.use("/api/custom-backgrounds", customBackgroundsRouter);
  console.log('[Server] Custom backgrounds router mounted successfully');
  
  // Mount upload routes
  app.use("/api", uploadRouter);
  
  // Mount storage proxy for serving S3 images
  app.use("/api/storage-proxy", storageProxyRouter);
  
  // Mount FillFaster webhook
  const { handleFillFasterWebhook } = await import("./webhooks/fillfaster.js");
  app.post("/api/webhooks/fillfaster", handleFillFasterWebhook);

  // Mount TRPC routes
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Serve static files with proper cache headers
  app.use(express.static(staticPath, {
    maxAge: '1h',
    etag: false
  }));

  // Handle client-side routing - serve index.html for all routes
  // But NOT for requests with file extensions (static files) or API routes
  app.get("*", (req, res) => {
    // If the request has a file extension, don't serve index.html
    if (req.path.includes(".")) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    // If it's an API request that wasn't handled, return JSON error
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "API endpoint not found" });
      return;
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Global error handler for unhandled errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err);
    // If it's an API request, return JSON error
    if (req.path.startsWith("/api/")) {
      res.status(500).json({ error: "Internal server error", message: err?.message });
      return;
    }
    // Otherwise, serve index.html for client-side error handling
    res.status(500).sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
