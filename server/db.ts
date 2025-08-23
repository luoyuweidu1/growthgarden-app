import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dns from 'dns';
import { promisify } from 'util';

// Database connection with Railway-specific configuration
let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// Log environment info for debugging
console.log('🔍 Environment:', process.env.NODE_ENV);
console.log('🔍 Database source:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'SUPABASE_DB_URL');

// Log the connection string (without password) for debugging
if (connectionString) {
  const sanitized = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log('🔍 Original connection string:', sanitized);
  
  // Fix SSL configuration for Supabase - remove sslmode=disable and let pool handle SSL
  if (connectionString.includes('sslmode=disable')) {
    connectionString = connectionString.replace(/[?&]sslmode=disable/, '');
    connectionString = connectionString.replace(/sslmode=disable[?&]?/, '');
    console.log('🔧 Removed sslmode=disable for Supabase compatibility');
    const updatedSanitized = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log('🔍 Updated connection string:', updatedSanitized);
  }
  
  // Determine database provider
  if (connectionString.includes('supabase.co')) {
    console.log('🔍 Detected Supabase database - using Supabase SSL config');
  } else if (connectionString.includes('railway')) {
    console.log('🔍 Detected Railway database - using Railway SSL config');
  } else {
    console.log('🔍 Unknown database provider - using generic SSL config');
    console.log('🔍 Connection string for debugging:', connectionString.substring(0, 50) + '...');
  }
}

// For development, we'll use in-memory storage if no database URL is provided
if (!connectionString && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL environment variable is required for production');
}

// Parse connection string to extract components
function parseConnectionString(connString: string) {
  const url = new URL(connString);
  return {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // Remove leading '/'
    user: url.username,
    password: url.password,
  };
}

// Custom IPv4-only DNS lookup function
async function lookupIPv4Only(hostname: string): Promise<string> {
  const lookupAsync = promisify(dns.lookup);
  try {
    console.log(`🔍 Attempting IPv4-only lookup for: ${hostname}`);
    const result = await lookupAsync(hostname, { family: 4 });
    const ipv4Address = typeof result === 'string' ? result : result.address;
    console.log(`✅ IPv4 resolved: ${hostname} -> ${ipv4Address}`);
    return ipv4Address;
  } catch (error) {
    console.error(`❌ IPv4 lookup failed for ${hostname}:`, error);
    throw error;
  }
}

// Create postgres client with explicit configuration for better control
async function createDatabaseClient() {
  if (!connectionString) return null;
  
  console.log('🔍 Attempting to create database client...');
  
  // Parse the connection string to extract components
  const url = new URL(connectionString);
  const originalHost = url.hostname;
  
  // For Supabase databases, force IPv4 by using Supavisor pooler endpoint
  if (originalHost.includes('supabase.co')) {
    console.log('🔍 Detected Supabase database - using Supavisor IPv4 pooler endpoint');
    
    // Extract project ref from hostname: db.yonafgzylblknbrytcbr.supabase.co
    const projectRef = originalHost.split('.')[1];
    
    // Supavisor pooler format: postgres.{project_ref}:{password}@aws-0-{region}.pooler.supabase.com:6543
    // We need to modify both the hostname and username format
    const poolerHost = 'aws-0-us-east-1.pooler.supabase.com'; // Default to us-east-1, most common region
    const originalUsername = url.username;
    const poolerUsername = `postgres.${projectRef}`;
    
    console.log('🔍 Original hostname:', originalHost);
    console.log('🔍 Original username:', originalUsername);
    console.log('🔍 Supavisor pooler hostname:', poolerHost);
    console.log('🔍 Supavisor username format:', poolerUsername);
    
    // Create new connection string with Supavisor pooler endpoint
    url.hostname = poolerHost;
    url.port = '6543'; // Supavisor transaction mode port
    url.username = poolerUsername;
    const ipv4ConnectionString = url.toString();
    
    console.log('🔍 Using Supavisor IPv4 pooler endpoint (transaction mode)');
    const sanitizedConnectionString = ipv4ConnectionString.replace(/:([^:@]+)@/, ':****@');
    console.log('🔍 IPv4 connection string:', sanitizedConnectionString);
    
    const poolConfig: pg.PoolConfig = {
      connectionString: ipv4ConnectionString,
      max: 3,
      min: 0,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 300000,
      allowExitOnIdle: true,
      query_timeout: 60000,
      statement_timeout: 60000,
      ssl: {
        rejectUnauthorized: false,
        // For Supavisor pooler, we need to handle SSL differently
        ca: undefined, // Don't verify CA for pooler connections
        checkServerIdentity: () => undefined // Skip server identity verification
      }
    };
    
    return new pg.Pool(poolConfig);
  }
  
  // For non-Supabase databases, try DNS resolution approach
  try {
    // Force IPv4 resolution for the hostname
    console.log('🔍 Forcing IPv4 resolution for Railway compatibility');
    const ipv4Address = await lookupIPv4Only(originalHost);
    
    // Create new connection string with IPv4 address
    url.hostname = ipv4Address;
    const ipv4ConnectionString = url.toString();
    
    console.log('🔍 Original hostname:', originalHost);
    console.log('🔍 Resolved IPv4 address:', ipv4Address);
    
    const poolConfig: pg.PoolConfig = {
      connectionString: ipv4ConnectionString,
      max: 3,
      min: 0,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 300000,
      allowExitOnIdle: true,
      query_timeout: 60000,
      statement_timeout: 60000,
      ssl: {
        rejectUnauthorized: false,
        // Add servername for SSL verification with IP address
        servername: originalHost
      }
    };
    
    console.log('🔍 Using IPv4 address for connection');
    return new pg.Pool(poolConfig);
    
  } catch (error) {
    console.error('❌ Failed to resolve hostname to IPv4, falling back to original connection string');
    
    // Fallback to original connection string
    const poolConfig: pg.PoolConfig = {
      connectionString: connectionString,
      max: 3,
      min: 0,
      connectionTimeoutMillis: 60000,
      idleTimeoutMillis: 300000,
      allowExitOnIdle: true,
      query_timeout: 60000,
      statement_timeout: 60000,
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    console.log('🔍 Using original connection string as fallback');
    return new pg.Pool(poolConfig);
  }
}

// Initialize client and database - will be set during initialization
let client: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Export getter functions since client/db are initialized asynchronously
export function getClient() { return client; }
export function getDb() { return db; }

// For backward compatibility
export { client, db };

// Database initialization function
export async function initializeDatabase() {
  // Create database client first
  if (!client) {
    client = await createDatabaseClient();
    if (client) {
      db = drizzle(client, { schema });
    }
  }
  
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
      
      // Check for IPv6 connectivity issues on Railway
      if (error.message.includes('ENETUNREACH') && error.message.includes('2600:')) {
        console.log('🚧 IPv6 connectivity issue detected on Railway deployment');
        console.log('⚠️  Continuing with in-memory storage as fallback');
        console.log('💡 Database will work once IPv6 is resolved or IPv4 endpoint is used');
        
        // Reset client and db to use in-memory storage
        client = null;
        db = null;
        return;
      }
    }
    
    // For other errors, still throw to maintain existing behavior
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
      
      // Specific guidance for SCRAM errors
      if (error.message.includes('SCRAM-SERVER-FINAL-MESSAGE')) {
        console.error('🔧 SCRAM authentication error detected. This usually indicates:');
        console.error('   - SSL configuration mismatch with Supabase pooler');
        console.error('   - Connection string contains conflicting SSL parameters');
        console.error('   - Network/proxy issues interfering with the SSL handshake');
      }
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