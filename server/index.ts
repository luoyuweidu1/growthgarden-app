import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";

dotenv.config();

async function startServer() {
  const app = express();

  // Initialize storage
  app.locals.storage = storage;

  // Enable CORS for frontend
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "https://growthgarden-app.vercel.app"
    ],
    credentials: true
  }));

  // Parse JSON bodies
  app.use(express.json());

  // API routes
  app.get("/api", (_req, res) => {
    res.json({ 
      message: "Growth Garden API is running!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      endpoints: [
        "/api/health",
        "/api/goals",
        "/api/actions", 
        "/api/achievements",
        "/api/daily-habits"
      ]
    });
  });

  // Register all API routes
  await registerRoutes(app);

  const port = parseInt(process.env.PORT || "3000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server listening on port ${port}`);
    console.log(`🌐 API available at http://localhost:${port}/api`);
  });
}

startServer().catch(console.error);