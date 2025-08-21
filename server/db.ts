import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Database connection with Railway-specific configuration
let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// Log environment info for debugging
console.log('🔍 Environment:', process.env.NODE_ENV);
console.log('🔍 Database source:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'SUPABASE_DB_URL');

// Log the connection string (without password) for debugging
if (connectionString) {
  const sanitized = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log('🔍 Original connection string:', sanitized);
  
  // Railway PostgreSQL configuration - try different SSL approaches
  if (!connectionString.includes('sslmode')) {
    // Try with no SSL params first, let the SSL config in the pool handle it
    console.log('🔍 Using SSL configuration from pool settings');
  } else {
    console.log('🔍 SSL mode already specified in connection string');
  }
}

// For development, we'll use in-memory storage if no database URL is provided
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL environment variable is required for production');
}

// Create postgres client with Railway-optimized configuration and fallback
function createDatabaseClient() {
  if (!connectionString) return null;
  
  // Parse the connection string to understand the configuration
  console.log('🔍 Attempting to create database client...');
  
  // Primary configuration for Railway
  const poolConfig: pg.PoolConfig = {
    connectionString: connectionString,
    max: 5, // Optimal for Railway
    min: 0, // Allow scaling to zero
    connectionTimeoutMillis: 30000, // Longer timeout for Railway cold starts
    idleTimeoutMillis: 600000, // 10 minutes idle timeout
    allowExitOnIdle: true,
    // Additional Railway optimizations
    query_timeout: 60000,
    statement_timeout: 60000,
  };

  // Add SSL configuration based on environment and URL
  if (process.env.NODE_ENV === 'production') {
    if (connectionString.includes('railway') || connectionString.includes('postgres')) {
      // Railway-specific SSL configuration
      poolConfig.ssl = {
        rejectUnauthorized: false,
      };
    } else {
      // Generic production SSL
      poolConfig.ssl = true;
    }
  } else {
    poolConfig.ssl = false;
  }
  
  console.log('🔍 Pool config (SSL):', poolConfig.ssl);
  return new pg.Pool(poolConfig);
}

const client = createDatabaseClient();

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
    
    // Test the connection first
    await testDatabaseConnection();
    
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
    if (error instanceof Error) {
      console.error('Full error details:', {
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      });
    }
    throw error;
  }
}

// Test database connection with detailed error reporting
async function testDatabaseConnection() {
  if (!client) {
    throw new Error('No database client available');
  }
  
  try {
    console.log('🔍 Testing database connection...');
    console.log('🔍 Pool info:', {
      totalCount: client.totalCount,
      idleCount: client.idleCount,
      waitingCount: client.waitingCount
    });
    
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection successful!');
    console.log('🕒 Current time:', result.rows[0].current_time);
    console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version);
  } catch (error) {
    console.error('❌ Database connection test failed!');
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        severity: (error as any).severity,
        routine: (error as any).routine
      });
    }
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

  await client.query(createTablesSQL);
} 