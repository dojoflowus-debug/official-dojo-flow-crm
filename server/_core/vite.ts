import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

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

  // Serve static files BEFORE Vite middlewares so they don't get intercepted
  const publicPath = path.resolve(import.meta.dirname, "../..", "public");
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  
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
      // If file doesn't exist, don't transform - let it 404
      return res.status(404).end('Not Found');
    }
    
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
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
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    console.error(`[serveStatic] Build output not found at: ${distPath}`);
    console.error("Run 'pnpm build' first to generate the production build.");
    app.use("*", (_req, res) => {
      res.status(503).send("App build not found. Please run pnpm build.");
    });
    return;
  }

  // Serve static assets (JS, CSS, images, etc.) from dist/public
  app.use(express.static(distPath));

  // Serve public directory assets (favicon, robots.txt, etc.)
  const publicPath = path.resolve(import.meta.dirname, "../..", "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // SPA fallback — serve index.html for all non-API, non-file routes
  app.use("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
