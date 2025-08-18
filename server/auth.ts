import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import { SupabaseStorage } from './supabase-storage';
import { db } from './db.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Supabase client conditionally
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// Ensure user exists in local database
async function ensureUserExists(userId: string, email: string, name?: string) {
  if (!db) return; // Skip if no database connection
  
  try {
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (existingUser.length === 0) {
      // Create user if they don't exist
      console.log(`Creating new user in database: ${userId} (${email})`);
      await db.insert(users).values({
        id: userId,
        email: email,
        name: name || null,
        avatarUrl: null,
      });
      console.log(`✅ User created successfully: ${userId}`);
    } else {
      console.log(`✅ User already exists in database: ${userId}`);
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    // Don't throw error, just log it
  }
}

// Authentication middleware
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("🔐 Auth middleware - Starting authentication");
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ Auth middleware - No bearer token provided");
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log("🔐 Auth middleware - Token length:", token.length);
    
    // Verify the JWT token with Supabase
    const supabaseClient = getSupabaseClient();
    console.log("🔐 Auth middleware - Verifying token with Supabase");
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.log("❌ Auth middleware - Token validation failed:", error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log("✅ Auth middleware - Token valid for user:", user.email);

    // Ensure user exists in local database
    await ensureUserExists(user.id, user.email || '', user.user_metadata?.name);

    // Set user ID in request for use in routes
    (req as any).userId = user.id;
    console.log("✅ Auth middleware - Set userId in request:", user.id);
    
    // Set current user in storage
    if (req.app.locals.storage instanceof SupabaseStorage) {
      req.app.locals.storage.setCurrentUser(user.id);
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Optional authentication middleware (for routes that can work with or without auth)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabaseClient = getSupabaseClient();
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      
      if (!error && user) {
        (req as any).userId = user.id;
        if (req.app.locals.storage instanceof SupabaseStorage) {
          req.app.locals.storage.setCurrentUser(user.id);
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
} 