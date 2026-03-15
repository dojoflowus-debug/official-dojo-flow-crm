import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

// Resolve the project root reliably in both dev (tsx) and production (esbuild bundle)
// In dev: import.meta.dirname = /project/server/_core  → root = ../..
// In prod bundle: import.meta.dirname = /app/dist       → root = ..
function getProjectRoot(): string {
  const dirname = import.meta.dirname;
  // If we're inside a dist folder (production bundle), go one level up
  if (dirname.endsWith("/dist") || dirname.includes("/dist/")) {
    return path.resolve(dirname, "..");
  }
  // Dev: server/_core → go up two levels
  return path.resolve(dirname, "../..");
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  const root = getProjectRoot();
  const publicPath = path.resolve(root, "public");
  const distPath = path.resolve(root, "dist", "public");

  // Serve from /public directory (source)
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Also serve from /dist/public if it exists (built assets)
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    // Skip Vite HTML transformation for API routes and static files with extensions
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return res.status(404).end('Not Found');
    }

    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(root, "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const root = getProjectRoot();
  const distPath = path.resolve(root, "dist", "public");

  console.log(`[serveStatic] Project root: ${root}`);
  console.log(`[serveStatic] Looking for dist/public at: ${distPath}`);
  console.log(`[serveStatic] dist/public exists: ${fs.existsSync(distPath)}`);

  if (!fs.existsSync(distPath)) {
    console.error(`[serveStatic] Build output not found at: ${distPath}`);
    app.use("*", (_req, res) => {
      res.status(503).send(`App build not found at ${distPath}. Please run pnpm build.`);
    });
    return;
  }

  // Serve static assets (JS, CSS, images, etc.) from dist/public
  app.use(express.static(distPath));

  // Serve public directory assets (favicon, robots.txt, etc.)
  const publicPath = path.resolve(root, "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // SPA fallback — serve index.html for all non-API routes
  app.use("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
