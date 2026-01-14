import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "./auth/passport";
import socialAuthRouter from "./auth/socialAuthRouter";
import uploadRouter from "./uploadRouter.js";
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
  
  // Mount upload routes
  app.use("/api", uploadRouter);

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
  // But NOT for requests with file extensions (static files)
  app.get("*", (req, res) => {
    // If the request has a file extension, don't serve index.html
    if (req.path.includes(".")) {
      res.status(404).send("Not Found");
      return;
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
