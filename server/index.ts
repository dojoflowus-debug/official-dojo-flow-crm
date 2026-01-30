import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "./auth/passport";
import socialAuthRouter from "./auth/socialAuthRouter.js";
import uploadRouter from "./uploadRouter.js";
import customBackgroundsRouter from "./api.cinematic-backgrounds.js";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  // Mount social auth routes
  app.use("/api/auth", socialAuthRouter);
  
  // Mount custom backgrounds routes
  console.log('[Server] Mounting custom backgrounds router at /api/custom-backgrounds');
  app.use("/api/custom-backgrounds", customBackgroundsRouter);
  console.log('[Server] Custom backgrounds router mounted successfully');
  
  // Mount upload routes
  app.use("/api", uploadRouter);
  
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
