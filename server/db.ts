import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Database connection - force IPv4 by modifying URL if needed
let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// Log the connection string (without password) for debugging
if (connectionString) {
  const sanitized = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log('🔍 Database connection string:', sanitized);
  
  // Force SSL disable to avoid SASL issues
  if (!connectionString.includes('?')) {
    connectionString += '?sslmode=disable';
  } else if (!connectionString.includes('sslmode')) {
    connectionString += '&sslmode=disable';
  }
  
  console.log('🔍 Modified connection string:', connectionString.replace(/:([^:@]+)@/, ':****@'));
}

// For development, we'll use in-memory storage if no database URL is provided
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL environment variable is required for production');
}

// Create postgres client using node-postgres (pg) for better Supabase compatibility
const client = connectionString ? new pg.Pool({
  connectionString: connectionString,
  max: 1,
  // Disable SSL to avoid SASL_SIGNATURE_MISMATCH errors
  ssl: false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 20000,
}) : null;

// Create drizzle database instance only if client exists
export const db = client ? drizzle(client, { schema }) : null;

// Export the client for direct queries if needed
export { client };

// Database initialization function
export async function initializeDatabase() {
  if (!db || !client) {
    console.log('⚠️  No database connection available, using in-memory storage');
    return;
  }

  try {
    console.log('🔧 Initializing database...');
    
    // Check if tables exist by trying to query them
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      console.log('📋 Creating database tables...');
      await createTables();
      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function checkTablesExist(): Promise<boolean> {
  if (!db) return false;
  
  try {
    // Try to query the users table to see if it exists
    await db.select().from(schema.users).limit(1);
    return true;
  } catch (error) {
    console.log('Tables do not exist, will create them...');
    return false;
  }
}

async function createTables() {
  if (!db || !client) return;
  
  // Create tables using raw SQL since we don't have migrations yet
  const createTablesSQL = `
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create goals table
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      plant_type TEXT NOT NULL,
      current_level INTEGER NOT NULL DEFAULT 1,
      current_xp INTEGER NOT NULL DEFAULT 0,
      max_xp INTEGER NOT NULL DEFAULT 100,
      timeline_months INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'active',
      last_watered TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create actions table
    CREATE TABLE IF NOT EXISTS actions (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      goal_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      xp_reward INTEGER NOT NULL DEFAULT 15,
      personal_reward TEXT,
      is_completed BOOLEAN NOT NULL DEFAULT FALSE,
      due_date TIMESTAMP,
      completed_at TIMESTAMP,
      feeling TEXT,
      reflection TEXT,
      difficulty INTEGER,
      satisfaction INTEGER,
      reflected_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create achievements table
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      unlocked_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Create daily_habits table
    CREATE TABLE IF NOT EXISTS daily_habits (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      eat_healthy BOOLEAN NOT NULL DEFAULT FALSE,
      exercise BOOLEAN NOT NULL DEFAULT FALSE,
      sleep_before_11pm BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await client.unsafe(createTablesSQL);
} 