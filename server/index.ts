// Force IPv4 DNS resolution at application level - MUST be at the very top
import * as dns from 'dns';

console.log('🔧 Configuring DNS to force IPv4 resolution...');

// Set environment variable to force IPv4
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --dns-result-order=ipv4first';

// Set IPv4 as the default resolution order
dns.setDefaultResultOrder('ipv4first');

console.log('✅ DNS configuration complete - all lookups will use IPv4');

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";
import { initializeDatabase } from "./db.js";

dotenv.config();

async function startServer() {
  const app = express();

  // Initialize storage
  app.locals.storage = storage;

  // Initialize database
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Continue with in-memory storage if database fails
  }

  // Enable CORS for frontend
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "https://growthgarden-app.vercel.app",
    "https://growthgarden-app-pro-way-app.vercel.app", // Add the actual deployed URL
    "http://localhost:3000", // For local frontend testing
    "http://localhost:5173", // Vite dev server
  ].filter(Boolean); // Remove null values

  console.log('🌐 Allowed CORS origins:', allowedOrigins);

  // Add more flexible origin checking for Vercel deployments
  app.use(cors({
    origin: (origin, callback) => {
      console.log(`🔍 CORS Check - Origin: ${origin}`);
      console.log(`🔍 CORS Check - Allowed origins:`, allowedOrigins);
      console.log(`🔍 CORS Check - Time: ${new Date().toISOString()}`);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ CORS allowed - No origin (mobile/curl)');
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS allowed - In allowed origins list');
        return callback(null, true);
      }
      
      // Allow any vercel.app subdomain (more permissive)
      if (origin.includes('vercel.app')) {
        console.log('✅ CORS allowed - Vercel domain');
        return callback(null, true);
      }
      
      // Allow any localhost variant
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('✅ CORS allowed - Localhost development');
        return callback(null, true);
      }
      
      // Block unknown origins when using credentials
      console.log(`❌ CORS blocked - Origin not allowed: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
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