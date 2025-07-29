import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// For development, we'll use in-memory storage if no database URL is provided
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL environment variable is required for production');
}

// Create postgres client only if connection string is available
const client = connectionString ? postgres(connectionString, {
  max: 1,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}) : null;

// Create drizzle database instance only if client exists
export const db = client ? drizzle(client, { schema }) : null;

// Export the client for direct queries if needed
export { client }; 