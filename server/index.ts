import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors()); // Allow all origins — adjust if needed
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "API is healthy" });
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize storage based on environment
  let storage;
  if (process.env.NODE_ENV === 'production') {
    const { SupabaseStorage } = await import('./supabase-storage');
    storage = new SupabaseStorage();
  } else {
    const { MemStorage } = await import('./storage');
    storage = new MemStorage();
  }

  app.locals.storage = storage;

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Serve frontend only in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);

    // Optional: fallback for SPA routes (for deep-link support)
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    log(`✅ Server listening on port ${port}`);
  });
})();
