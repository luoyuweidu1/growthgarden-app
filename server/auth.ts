import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import { SupabaseStorage } from './supabase-storage';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication middleware
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Set user ID in request for use in routes
    (req as any).userId = user.id;
    
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
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
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