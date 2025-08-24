// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';
import { initializeDatabase } from '../server/db.js';
import { storage } from '../server/storage.js';

// Create Express app for Vercel serverless
const app = express();

// Initialize storage
app.locals.storage = storage;

// Enable CORS for Vercel deployment
const allowedOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  "https://growthgarden-app.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check allowed origins
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      return callback(null, true);
    }
    
    // Allow vercel.app subdomains
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Parse JSON bodies
app.use(express.json());

// Initialize database on first request
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed, continuing with in-memory storage');
    }
  }
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Growth Garden API is running on Vercel!',
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

// Register API routes
await registerRoutes(app);

// Export for Vercel
export default app;