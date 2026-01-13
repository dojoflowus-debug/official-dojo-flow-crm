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
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    // Skip Vite HTML transformation for API routes and static files
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return next();
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
  // Static files are now served in setupVite before Vite middlewares
  // This function is kept for backward compatibility but is now a no-op
  // fall through to index.html if the file doesn't exist
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
