var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  achievements: () => achievements,
  actions: () => actions,
  dailyHabits: () => dailyHabits,
  goals: () => goals,
  insertAchievementSchema: () => insertAchievementSchema,
  insertActionSchema: () => insertActionSchema,
  insertDailyHabitSchema: () => insertDailyHabitSchema,
  insertGoalSchema: () => insertGoalSchema,
  insertUserSchema: () => insertUserSchema,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users, goals, actions, achievements, dailyHabits, insertUserSchema, insertGoalSchema, insertActionSchema, insertAchievementSchema, insertDailyHabitSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: uuid("id").primaryKey().defaultRandom(),
      email: text("email").notNull().unique(),
      name: text("name"),
      avatarUrl: text("avatar_url"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    goals = pgTable("goals", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      description: text("description"),
      plantType: text("plant_type").notNull(),
      // 'sprout', 'herb', 'tree', 'flower'
      currentLevel: integer("current_level").notNull().default(1),
      currentXP: integer("current_xp").notNull().default(0),
      maxXP: integer("max_xp").notNull().default(100),
      timelineMonths: integer("timeline_months").notNull().default(3),
      status: text("status").notNull().default("active"),
      // 'active', 'completed', 'withered'
      lastWatered: timestamp("last_watered").notNull().defaultNow(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    actions = pgTable("actions", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      goalId: integer("goal_id").notNull(),
      title: text("title").notNull(),
      description: text("description"),
      xpReward: integer("xp_reward").notNull().default(15),
      personalReward: text("personal_reward"),
      // Custom reward for completing the task
      isCompleted: boolean("is_completed").notNull().default(false),
      dueDate: timestamp("due_date"),
      completedAt: timestamp("completed_at"),
      // Reflection fields
      feeling: text("feeling"),
      // How the user felt after completing the action
      reflection: text("reflection"),
      // User's reflection on the action
      difficulty: integer("difficulty"),
      // 1-5 scale of task difficulty
      satisfaction: integer("satisfaction"),
      // 1-5 scale of satisfaction with result
      reflectedAt: timestamp("reflected_at"),
      // When the reflection was recorded
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    achievements = pgTable("achievements", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      description: text("description").notNull(),
      iconName: text("icon_name").notNull(),
      unlockedAt: timestamp("unlocked_at").notNull().defaultNow()
    });
    dailyHabits = pgTable("daily_habits", {
      id: serial("id").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      date: text("date").notNull(),
      // YYYY-MM-DD format
      eatHealthy: boolean("eat_healthy").notNull().default(false),
      exercise: boolean("exercise").notNull().default(false),
      sleepBefore11pm: boolean("sleep_before_11pm").notNull().default(false),
      notes: text("notes"),
      // Optional notes for the day
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true
    });
    insertGoalSchema = createInsertSchema(goals).omit({
      id: true,
      userId: true,
      // Exclude userId - it will be set by the backend based on auth
      currentLevel: true,
      currentXP: true,
      maxXP: true,
      status: true,
      lastWatered: true,
      createdAt: true
    });
    insertActionSchema = createInsertSchema(actions).omit({
      id: true,
      isCompleted: true,
      completedAt: true,
      createdAt: true
    }).extend({
      dueDate: z.union([z.date(), z.string().datetime(), z.null()]).optional()
    });
    insertAchievementSchema = createInsertSchema(achievements).omit({
      id: true,
      unlockedAt: true
    });
    insertDailyHabitSchema = createInsertSchema(dailyHabits).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  client: () => client,
  db: () => db,
  getClient: () => getClient,
  getDb: () => getDb,
  initializeDatabase: () => initializeDatabase
});
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dns from "dns";
import { promisify } from "util";
async function lookupIPv4Only(hostname) {
  const lookupAsync = promisify(dns.lookup);
  try {
    console.log(`\u{1F50D} Attempting IPv4-only lookup for: ${hostname}`);
    const result = await lookupAsync(hostname, { family: 4 });
    const ipv4Address = typeof result === "string" ? result : result.address;
    console.log(`\u2705 IPv4 resolved: ${hostname} -> ${ipv4Address}`);
    return ipv4Address;
  } catch (error) {
    console.error(`\u274C IPv4 lookup failed for ${hostname}:`, error);
    throw error;
  }
}
async function createDatabaseClient() {
  if (!connectionString) return null;
  console.log("\u{1F50D} Attempting to create database client...");
  const url = new URL(connectionString);
  const originalHost = url.hostname;
  if (originalHost.includes("supabase.co")) {
    console.log("\u{1F50D} Detected Supabase database - manually resolving to IPv4");
    console.log("\u{1F50D} CODE VERSION: 2024-manual-ipv4-resolution");
    console.log("\u{1F50D} Original hostname:", originalHost);
    try {
      console.log("\u{1F50D} Attempting manual IPv4 resolution...");
      const ipv4Address = await lookupIPv4Only(originalHost);
      url.hostname = ipv4Address;
      const ipv4ConnectionString = url.toString();
      console.log("\u{1F50D} Successful IPv4 resolution:");
      console.log("\u{1F50D} Original hostname:", originalHost);
      console.log("\u{1F50D} Resolved IPv4 address:", ipv4Address);
      const sanitizedConnectionString = ipv4ConnectionString.replace(/:([^:@]+)@/, ":****@");
      console.log("\u{1F50D} IPv4 connection string:", sanitizedConnectionString);
      const poolConfig = {
        connectionString: ipv4ConnectionString,
        max: 3,
        min: 0,
        connectionTimeoutMillis: 6e4,
        idleTimeoutMillis: 3e5,
        allowExitOnIdle: true,
        query_timeout: 6e4,
        statement_timeout: 6e4,
        ssl: {
          rejectUnauthorized: false,
          // Use original hostname for SSL verification
          servername: originalHost,
          checkServerIdentity: () => void 0,
          secureProtocol: "TLSv1_2_method"
        }
      };
      console.log("\u{1F50D} Using manually resolved IPv4 address for connection");
      return new pg.Pool(poolConfig);
    } catch (ipv4Error) {
      console.error("\u274C Manual IPv4 resolution failed:", ipv4Error);
      console.log("\u{1F50D} Falling back to original connection string");
      const fallbackConnectionString = connectionString;
      const sanitizedFallback = fallbackConnectionString.replace(/:([^:@]+)@/, ":****@");
      console.log("\u{1F50D} Fallback connection string:", sanitizedFallback);
      const fallbackPoolConfig = {
        connectionString: fallbackConnectionString,
        max: 3,
        min: 0,
        connectionTimeoutMillis: 6e4,
        idleTimeoutMillis: 3e5,
        allowExitOnIdle: true,
        query_timeout: 6e4,
        statement_timeout: 6e4,
        ssl: {
          rejectUnauthorized: false,
          checkServerIdentity: () => void 0,
          secureProtocol: "TLSv1_2_method"
        }
      };
      return new pg.Pool(fallbackPoolConfig);
    }
  }
  try {
    console.log("\u{1F50D} Forcing IPv4 resolution for Railway compatibility");
    const ipv4Address = await lookupIPv4Only(originalHost);
    url.hostname = ipv4Address;
    const ipv4ConnectionString = url.toString();
    console.log("\u{1F50D} Original hostname:", originalHost);
    console.log("\u{1F50D} Resolved IPv4 address:", ipv4Address);
    const poolConfig = {
      connectionString: ipv4ConnectionString,
      max: 3,
      min: 0,
      connectionTimeoutMillis: 6e4,
      idleTimeoutMillis: 3e5,
      allowExitOnIdle: true,
      query_timeout: 6e4,
      statement_timeout: 6e4,
      ssl: {
        rejectUnauthorized: false,
        // Add servername for SSL verification with IP address
        servername: originalHost
      }
    };
    console.log("\u{1F50D} Using IPv4 address for connection");
    return new pg.Pool(poolConfig);
  } catch (error) {
    console.error("\u274C Failed to resolve hostname to IPv4, falling back to original connection string");
    const poolConfig = {
      connectionString,
      max: 3,
      min: 0,
      connectionTimeoutMillis: 6e4,
      idleTimeoutMillis: 3e5,
      allowExitOnIdle: true,
      query_timeout: 6e4,
      statement_timeout: 6e4,
      ssl: {
        rejectUnauthorized: false
      }
    };
    console.log("\u{1F50D} Using original connection string as fallback");
    return new pg.Pool(poolConfig);
  }
}
function getClient() {
  return client;
}
function getDb() {
  return db;
}
async function initializeDatabase() {
  if (!client) {
    client = await createDatabaseClient();
    if (client) {
      db = drizzle(client, { schema: schema_exports });
    }
  }
  if (!db || !client) {
    console.log("\u26A0\uFE0F  No database connection available, using in-memory storage");
    return;
  }
  try {
    console.log("\u{1F527} Initializing database...");
    await testDatabaseConnection();
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      console.log("\u{1F4CB} Creating database tables...");
      await createTables();
      console.log("\u2705 Database tables created successfully");
    } else {
      console.log("\u2705 Database tables already exist");
    }
  } catch (error) {
    console.error("\u274C Database initialization failed:", error);
    if (error instanceof Error) {
      console.error("Full error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      if (error.message.includes("ENETUNREACH") && error.message.includes("2600:")) {
        console.log("\u{1F6A7} IPv6 connectivity issue detected on Railway deployment");
        console.log("\u26A0\uFE0F  Continuing with in-memory storage as fallback");
        console.log("\u{1F4A1} Database will work once IPv6 is resolved or IPv4 endpoint is used");
        client = null;
        db = null;
        return;
      }
      if (error.message.includes("Tenant or user not found")) {
        console.log("\u{1F6A7} Supavisor authentication issue detected");
        console.log("\u26A0\uFE0F  This may be due to incorrect username format or pooler configuration");
        console.log("\u26A0\uFE0F  Continuing with in-memory storage as fallback");
        console.log("\u{1F4A1} Consider checking Supabase dashboard for correct connection strings");
        client = null;
        db = null;
        return;
      }
      if (error.message.includes("ENOTFOUND") || error.message.includes("timeout")) {
        console.log("\u{1F6A7} Network connectivity issue detected on Railway deployment");
        console.log("\u26A0\uFE0F  This may be due to DNS resolution or network timeout issues");
        console.log("\u26A0\uFE0F  Continuing with in-memory storage as fallback");
        console.log("\u{1F4A1} Check Railway network configuration and DNS settings");
        client = null;
        db = null;
        return;
      }
    }
    throw error;
  }
}
async function testDatabaseConnection() {
  if (!client) {
    throw new Error("No database client available");
  }
  try {
    console.log("\u{1F50D} Testing database connection...");
    console.log("\u{1F50D} Pool info:", {
      totalCount: client.totalCount,
      idleCount: client.idleCount,
      waitingCount: client.waitingCount
    });
    const result = await client.query("SELECT NOW() as current_time, version() as pg_version");
    console.log("\u2705 Database connection successful!");
    console.log("\u{1F552} Current time:", result.rows[0].current_time);
    console.log("\u{1F5C4}\uFE0F PostgreSQL version:", result.rows[0].pg_version);
  } catch (error) {
    console.error("\u274C Database connection test failed!");
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        severity: error.severity,
        routine: error.routine
      });
      if (error.message.includes("SCRAM-SERVER-FINAL-MESSAGE")) {
        console.error("\u{1F527} SCRAM authentication error detected. This usually indicates:");
        console.error("   - SSL configuration mismatch with Supabase pooler");
        console.error("   - Connection string contains conflicting SSL parameters");
        console.error("   - Network/proxy issues interfering with the SSL handshake");
      }
    }
    throw error;
  }
}
async function checkTablesExist() {
  if (!db) return false;
  try {
    await db.select().from(users).limit(1);
    return true;
  } catch (error) {
    console.log("Tables do not exist, will create them...");
    return false;
  }
}
async function createTables() {
  if (!db || !client) return;
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
var connectionString, client, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    console.log("\u{1F50D} Environment:", process.env.NODE_ENV);
    console.log("\u{1F50D} Database source:", process.env.DATABASE_URL ? "DATABASE_URL" : "SUPABASE_DB_URL");
    if (connectionString) {
      const sanitized = connectionString.replace(/:([^:@]+)@/, ":****@");
      console.log("\u{1F50D} Original connection string:", sanitized);
      if (connectionString.includes("sslmode=disable")) {
        connectionString = connectionString.replace(/[?&]sslmode=disable/, "");
        connectionString = connectionString.replace(/sslmode=disable[?&]?/, "");
        console.log("\u{1F527} Removed sslmode=disable for Supabase compatibility");
        const updatedSanitized = connectionString.replace(/:([^:@]+)@/, ":****@");
        console.log("\u{1F50D} Updated connection string:", updatedSanitized);
      }
      if (connectionString.includes("supabase.co")) {
        console.log("\u{1F50D} Detected Supabase database - using Supabase SSL config");
      } else if (connectionString.includes("railway")) {
        console.log("\u{1F50D} Detected Railway database - using Railway SSL config");
      } else {
        console.log("\u{1F50D} Unknown database provider - using generic SSL config");
        console.log("\u{1F50D} Connection string for debugging:", connectionString.substring(0, 50) + "...");
      }
    }
    if (!connectionString && process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL or SUPABASE_DB_URL environment variable is required for production");
    }
    client = null;
    db = null;
  }
});

// api/index.ts
import express2 from "express";
import cors from "cors";

// server/routes.ts
init_schema();
import express from "express";
import { createServer } from "http";
import { z as z2 } from "zod";

// server/auth.ts
import { createClient } from "@supabase/supabase-js";

// server/supabase-storage.ts
init_db();
init_schema();
import { eq, and, gte, lte } from "drizzle-orm";
var SupabaseStorage = class {
  currentUserId = null;
  constructor() {
    if (!db) {
      throw new Error("Database connection not available. Please set DATABASE_URL or SUPABASE_DB_URL environment variable.");
    }
  }
  setCurrentUser(userId) {
    this.currentUserId = userId;
  }
  requireUser() {
    if (!this.currentUserId) {
      throw new Error("User not authenticated");
    }
    return this.currentUserId;
  }
  // Users
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(userData) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  // Goals
  async getGoals() {
    const userId = this.requireUser();
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }
  async getGoal(id) {
    const userId = this.requireUser();
    const result = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).limit(1);
    return result[0];
  }
  async createGoal(insertGoal) {
    const userId = this.requireUser();
    const result = await db.insert(goals).values({
      ...insertGoal,
      userId,
      currentLevel: 1,
      currentXP: 0,
      maxXP: 100,
      status: "active",
      lastWatered: /* @__PURE__ */ new Date()
    }).returning();
    return result[0];
  }
  async updateGoal(id, updates) {
    const userId = this.requireUser();
    const result = await db.update(goals).set(updates).where(and(eq(goals.id, id), eq(goals.userId, userId))).returning();
    return result[0];
  }
  async deleteGoal(id) {
    const userId = this.requireUser();
    const result = await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).returning();
    return result.length > 0;
  }
  // Actions
  async getActionsByGoal(goalId) {
    const userId = this.requireUser();
    return await db.select().from(actions).where(and(eq(actions.goalId, goalId), eq(actions.userId, userId)));
  }
  async getAllActions() {
    const userId = this.requireUser();
    return await db.select().from(actions).where(eq(actions.userId, userId));
  }
  async getAction(id) {
    const userId = this.requireUser();
    const result = await db.select().from(actions).where(and(eq(actions.id, id), eq(actions.userId, userId))).limit(1);
    return result[0];
  }
  async createAction(insertAction) {
    const userId = this.requireUser();
    const result = await db.insert(actions).values({
      ...insertAction,
      userId,
      isCompleted: false,
      completedAt: null,
      feeling: null,
      reflection: null,
      difficulty: null,
      satisfaction: null,
      reflectedAt: null,
      dueDate: insertAction.dueDate ? new Date(insertAction.dueDate) : null
    }).returning();
    return result[0];
  }
  async updateAction(id, updates) {
    const userId = this.requireUser();
    const result = await db.update(actions).set(updates).where(and(eq(actions.id, id), eq(actions.userId, userId))).returning();
    return result[0];
  }
  async deleteAction(id) {
    const userId = this.requireUser();
    const result = await db.delete(actions).where(and(eq(actions.id, id), eq(actions.userId, userId))).returning();
    return result.length > 0;
  }
  // Achievements
  async getAchievements() {
    const userId = this.requireUser();
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }
  async createAchievement(insertAchievement) {
    const userId = this.requireUser();
    const result = await db.insert(achievements).values({
      ...insertAchievement,
      userId
    }).returning();
    return result[0];
  }
  // Daily Habits
  async getDailyHabit(date) {
    const userId = this.requireUser();
    const result = await db.select().from(dailyHabits).where(and(eq(dailyHabits.date, date), eq(dailyHabits.userId, userId))).limit(1);
    return result[0];
  }
  async getDailyHabits(startDate, endDate) {
    const userId = this.requireUser();
    return await db.select().from(dailyHabits).where(and(eq(dailyHabits.userId, userId), gte(dailyHabits.date, startDate), lte(dailyHabits.date, endDate)));
  }
  async createDailyHabit(insertHabit) {
    const userId = this.requireUser();
    const result = await db.insert(dailyHabits).values({
      ...insertHabit,
      userId
    }).returning();
    return result[0];
  }
  async updateDailyHabit(date, updates) {
    const userId = this.requireUser();
    const result = await db.update(dailyHabits).set(updates).where(and(eq(dailyHabits.date, date), eq(dailyHabits.userId, userId))).returning();
    return result[0];
  }
};

// server/auth.ts
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
var supabase = null;
function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}
async function ensureUserExists(userId, email, name) {
  if (!db) return;
  try {
    const existingUser = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
    if (existingUser.length === 0) {
      console.log(`Creating new user in database: ${userId} (${email})`);
      await db.insert(users).values({
        id: userId,
        email,
        name: name || null,
        avatarUrl: null
      });
      console.log(`\u2705 User created successfully: ${userId}`);
    } else {
      console.log(`\u2705 User already exists in database: ${userId}`);
    }
  } catch (error) {
    console.error("Error ensuring user exists:", error);
  }
}
async function authenticateUser(req, res, next) {
  try {
    console.log("\u{1F510} Auth middleware - Starting authentication");
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("\u274C Auth middleware - No bearer token provided");
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.substring(7);
    console.log("\u{1F510} Auth middleware - Token length:", token.length);
    const supabaseClient = getSupabaseClient();
    console.log("\u{1F510} Auth middleware - Verifying token with Supabase");
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      console.log("\u274C Auth middleware - Token validation failed:", error?.message);
      return res.status(401).json({ error: "Invalid token" });
    }
    console.log("\u2705 Auth middleware - Token valid for user:", user.email);
    await ensureUserExists(user.id, user.email || "", user.user_metadata?.name);
    req.userId = user.id;
    console.log("\u2705 Auth middleware - Set userId in request:", user.id);
    if (req.app.locals.storage instanceof SupabaseStorage) {
      req.app.locals.storage.setCurrentUser(user.id);
    }
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
}

// server/storage.ts
init_schema();
init_db();
import { eq as eq3, and as and2, gte as gte2, lte as lte2 } from "drizzle-orm";
var DatabaseStorage = class {
  constructor(userId) {
    this.userId = userId;
  }
  // Goals
  async getGoals() {
    if (!db) throw new Error("Database not available");
    console.log(`\u{1F50D} Fetching goals for user: ${this.userId}`);
    const result = await db.select().from(goals).where(eq3(goals.userId, this.userId));
    console.log(`\u{1F4CA} Found ${result.length} goals for user: ${this.userId}`);
    return result;
  }
  async getGoal(id) {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(goals).where(
      and2(eq3(goals.id, id), eq3(goals.userId, this.userId))
    );
    return result[0];
  }
  async createGoal(insertGoal) {
    if (!db) throw new Error("Database not available");
    console.log(`\u{1F331} Creating goal for user ${this.userId}:`, insertGoal);
    try {
      const result = await db.insert(goals).values({
        ...insertGoal,
        userId: this.userId
      }).returning();
      console.log(`\u2705 Goal created successfully:`, result[0]);
      return result[0];
    } catch (error) {
      console.error(`\u274C Error creating goal for user ${this.userId}:`, error);
      throw error;
    }
  }
  async updateGoal(id, updates) {
    if (!db) throw new Error("Database not available");
    const result = await db.update(goals).set(updates).where(
      and2(eq3(goals.id, id), eq3(goals.userId, this.userId))
    ).returning();
    return result[0];
  }
  async deleteGoal(id) {
    if (!db) throw new Error("Database not available");
    const result = await db.delete(goals).where(
      and2(eq3(goals.id, id), eq3(goals.userId, this.userId))
    ).returning();
    return result.length > 0;
  }
  // Actions
  async getActionsByGoal(goalId) {
    if (!db) throw new Error("Database not available");
    return await db.select().from(actions).where(
      and2(eq3(actions.goalId, goalId), eq3(actions.userId, this.userId))
    );
  }
  async getAllActions() {
    if (!db) throw new Error("Database not available");
    console.log(`\u{1F50D} Fetching actions for user: ${this.userId}`);
    const result = await db.select().from(actions).where(eq3(actions.userId, this.userId));
    console.log(`\u{1F4CA} Found ${result.length} actions for user: ${this.userId}`);
    return result;
  }
  async getAction(id) {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(actions).where(
      and2(eq3(actions.id, id), eq3(actions.userId, this.userId))
    );
    return result[0];
  }
  async createAction(insertAction) {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(actions).values({
      ...insertAction,
      userId: this.userId,
      dueDate: insertAction.dueDate ? new Date(insertAction.dueDate) : null
    }).returning();
    return result[0];
  }
  async updateAction(id, updates) {
    if (!db) throw new Error("Database not available");
    const result = await db.update(actions).set(updates).where(
      and2(eq3(actions.id, id), eq3(actions.userId, this.userId))
    ).returning();
    return result[0];
  }
  async deleteAction(id) {
    if (!db) throw new Error("Database not available");
    const result = await db.delete(actions).where(
      and2(eq3(actions.id, id), eq3(actions.userId, this.userId))
    ).returning();
    return result.length > 0;
  }
  // Achievements
  async getAchievements() {
    if (!db) throw new Error("Database not available");
    return await db.select().from(achievements).where(eq3(achievements.userId, this.userId));
  }
  async createAchievement(insertAchievement) {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(achievements).values({
      ...insertAchievement,
      userId: this.userId
    }).returning();
    return result[0];
  }
  // Daily Habits
  async getDailyHabit(date) {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(dailyHabits).where(
      and2(eq3(dailyHabits.date, date), eq3(dailyHabits.userId, this.userId))
    );
    return result[0];
  }
  async getDailyHabits(startDate, endDate) {
    if (!db) throw new Error("Database not available");
    return await db.select().from(dailyHabits).where(
      and2(
        gte2(dailyHabits.date, startDate),
        lte2(dailyHabits.date, endDate),
        eq3(dailyHabits.userId, this.userId)
      )
    );
  }
  async createDailyHabit(insertHabit) {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(dailyHabits).values({
      ...insertHabit,
      userId: this.userId
    }).returning();
    return result[0];
  }
  async updateDailyHabit(date, updates) {
    if (!db) throw new Error("Database not available");
    const result = await db.update(dailyHabits).set(updates).where(
      and2(eq3(dailyHabits.date, date), eq3(dailyHabits.userId, this.userId))
    ).returning();
    return result[0];
  }
};
var MemStorage = class {
  constructor(userId) {
    this.userId = userId;
    this.goals = /* @__PURE__ */ new Map();
    this.actions = /* @__PURE__ */ new Map();
    this.achievements = /* @__PURE__ */ new Map();
    this.dailyHabits = /* @__PURE__ */ new Map();
    this.currentGoalId = 1;
    this.currentActionId = 1;
    this.currentAchievementId = 1;
    this.currentDailyHabitId = 1;
  }
  goals;
  actions;
  achievements;
  dailyHabits;
  // Key is date string (YYYY-MM-DD)
  currentGoalId;
  currentActionId;
  currentAchievementId;
  currentDailyHabitId;
  // Goals
  async getGoals() {
    return Array.from(this.goals.values());
  }
  async getGoal(id) {
    return this.goals.get(id);
  }
  async createGoal(insertGoal) {
    const id = this.currentGoalId++;
    const goal = {
      id,
      userId: this.userId,
      name: insertGoal.name,
      description: insertGoal.description || null,
      plantType: insertGoal.plantType,
      timelineMonths: insertGoal.timelineMonths ?? 3,
      currentLevel: 1,
      currentXP: 0,
      maxXP: 100,
      status: "active",
      lastWatered: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date()
    };
    this.goals.set(id, goal);
    return goal;
  }
  async updateGoal(id, updates) {
    const goal = this.goals.get(id);
    if (!goal) return void 0;
    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  async deleteGoal(id) {
    return this.goals.delete(id);
  }
  // Actions
  async getActionsByGoal(goalId) {
    return Array.from(this.actions.values()).filter((action) => action.goalId === goalId);
  }
  async getAllActions() {
    return Array.from(this.actions.values());
  }
  async getAction(id) {
    return this.actions.get(id);
  }
  async createAction(insertAction) {
    const id = this.currentActionId++;
    const action = {
      id,
      userId: this.userId,
      title: insertAction.title,
      description: insertAction.description ?? null,
      goalId: insertAction.goalId,
      xpReward: insertAction.xpReward ?? 15,
      personalReward: insertAction.personalReward ?? null,
      dueDate: insertAction.dueDate ? typeof insertAction.dueDate === "string" ? new Date(insertAction.dueDate) : insertAction.dueDate : null,
      isCompleted: false,
      completedAt: null,
      feeling: null,
      reflection: null,
      difficulty: null,
      satisfaction: null,
      reflectedAt: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.actions.set(id, action);
    return action;
  }
  async updateAction(id, updates) {
    const action = this.actions.get(id);
    if (!action) return void 0;
    const updatedAction = { ...action, ...updates };
    this.actions.set(id, updatedAction);
    return updatedAction;
  }
  async deleteAction(id) {
    return this.actions.delete(id);
  }
  // Achievements
  async getAchievements() {
    return Array.from(this.achievements.values());
  }
  async createAchievement(insertAchievement) {
    const id = this.currentAchievementId++;
    const achievement = {
      ...insertAchievement,
      id,
      unlockedAt: /* @__PURE__ */ new Date()
    };
    this.achievements.set(id, achievement);
    return achievement;
  }
  // Daily Habits
  async getDailyHabit(date) {
    return this.dailyHabits.get(date);
  }
  async getDailyHabits(startDate, endDate) {
    return Array.from(this.dailyHabits.values()).filter(
      (habit) => habit.date >= startDate && habit.date <= endDate
    );
  }
  async createDailyHabit(insertHabit) {
    const id = this.currentDailyHabitId++;
    const habit = {
      id,
      userId: this.userId,
      date: insertHabit.date,
      eatHealthy: insertHabit.eatHealthy ?? false,
      exercise: insertHabit.exercise ?? false,
      sleepBefore11pm: insertHabit.sleepBefore11pm ?? false,
      notes: insertHabit.notes ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.dailyHabits.set(insertHabit.date, habit);
    return habit;
  }
  async updateDailyHabit(date, updates) {
    const habit = this.dailyHabits.get(date);
    if (!habit) return void 0;
    const updatedHabit = { ...habit, ...updates };
    this.dailyHabits.set(date, updatedHabit);
    return updatedHabit;
  }
};
function createStorage(userId) {
  if (db) {
    console.log(`\u{1F517} Using database storage for user: ${userId}`);
    return new DatabaseStorage(userId);
  } else {
    console.log(`\u26A0\uFE0F  Using in-memory storage for user: ${userId} (no database connection)`);
    return new MemStorage(userId);
  }
}
var storage = createStorage("default-user");

// server/routes.ts
function getFeelingEmoji(feeling) {
  const emojiMap = {
    "Happy": "\u{1F60A}",
    "Excited": "\u{1F389}",
    "Relaxed": "\u{1F60C}",
    "Accomplished": "\u{1F4AA}",
    "Relieved": "\u{1F60C}",
    "Confident": "\u{1F60E}",
    "Thoughtful": "\u{1F914}",
    "Tired": "\u{1F634}",
    "Stressed": "\u{1F605}",
    "Frustrated": "\u{1F624}",
    "Grateful": "\u{1F607}",
    "Proud": "\u{1F917}"
  };
  return emojiMap[feeling] || "\u{1F60A}";
}
async function generateAIAnalysis(weeklyActions, feelingDistribution) {
  const positiveFeelings = ["Happy", "Excited", "Accomplished", "Confident", "Proud", "Grateful"];
  const negativeFeelings = ["Tired", "Stressed", "Frustrated"];
  const positiveActions = weeklyActions.filter(
    (action) => action.feeling && positiveFeelings.includes(action.feeling)
  );
  const negativeActions = weeklyActions.filter(
    (action) => action.feeling && negativeFeelings.includes(action.feeling)
  );
  const analysisData = {
    totalActions: weeklyActions.length,
    feelingDistribution: feelingDistribution.map((f) => ({
      feeling: f.feeling,
      count: f.count,
      percentage: f.percentage,
      actions: f.actions
    })),
    positiveActions: positiveActions.map((a) => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      difficulty: a.difficulty,
      reflection: a.reflection
    })),
    negativeActions: negativeActions.map((a) => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      difficulty: a.difficulty,
      reflection: a.reflection
    })),
    averageSatisfaction: weeklyActions.reduce((sum, a) => sum + (a.satisfaction || 3), 0) / weeklyActions.length,
    averageDifficulty: weeklyActions.reduce((sum, a) => sum + (a.difficulty || 3), 0) / weeklyActions.length
  };
  const systemMessage = `You are a personal growth coach analyzing weekly reflection data. Provide encouraging, actionable insights in a warm, supportive tone. Focus on patterns, growth opportunities, and celebrating progress. Keep responses concise but meaningful.`;
  const prompt = `Analyze this weekly reflection data and provide insights in JSON format with three fields:
1. positivePatterns: A brief analysis of what's working well and what activities lead to positive feelings
2. negativePatterns: Gentle suggestions for improving challenging experiences
3. growthAreas: Specific, actionable recommendations for personal growth

Data: ${JSON.stringify(analysisData, null, 2)}

Respond with only valid JSON containing these three fields.`;
  const aiResponse = await callOpenAI(prompt, systemMessage);
  if (aiResponse) {
    try {
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      const parsed = JSON.parse(cleanResponse);
      return {
        positivePatterns: parsed.positivePatterns || "You've been making great progress on your goals!",
        negativePatterns: parsed.negativePatterns || "You're handling challenges well and learning from each experience.",
        growthAreas: parsed.growthAreas || "Continue building on your strengths and exploring new opportunities."
      };
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      console.error("Raw response:", aiResponse);
    }
  }
  let positivePatterns = "You've been feeling great about tasks that involve ";
  if (positiveActions.length > 0) {
    const commonThemes = positiveActions.map((a) => a.title.toLowerCase()).slice(0, 3);
    positivePatterns += commonThemes.join(", ") + ". These activities seem to energize and motivate you.";
  } else {
    positivePatterns = "You've been maintaining a positive outlook on your tasks this week.";
  }
  let negativePatterns = "Tasks that made you feel challenged include ";
  if (negativeActions.length > 0) {
    const commonThemes = negativeActions.map((a) => a.title.toLowerCase()).slice(0, 3);
    negativePatterns += commonThemes.join(", ") + ". Consider breaking these down into smaller steps or adjusting your approach.";
  } else {
    negativePatterns = "You've been handling challenges well this week with minimal stress.";
  }
  const growthAreas = "Focus on building consistency with activities that make you feel accomplished, and consider what made those experiences particularly rewarding.";
  return { positivePatterns, negativePatterns, growthAreas };
}
async function generateLearningSummary(weeklyActions, feelingDistribution) {
  const summaryData = {
    weekStats: {
      totalActions: weeklyActions.length,
      totalXP: weeklyActions.reduce((sum, a) => sum + a.xpReward, 0),
      averageSatisfaction: weeklyActions.reduce((sum, a) => sum + (a.satisfaction || 3), 0) / weeklyActions.length,
      averageDifficulty: weeklyActions.reduce((sum, a) => sum + (a.difficulty || 3), 0) / weeklyActions.length
    },
    feelingBreakdown: feelingDistribution.map((f) => ({
      feeling: f.feeling,
      count: f.count,
      percentage: f.percentage,
      actions: f.actions
    })),
    actionDetails: weeklyActions.map((a) => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      difficulty: a.difficulty,
      reflection: a.reflection,
      xpReward: a.xpReward
    })),
    reflections: weeklyActions.filter((a) => a.reflection).map((a) => a.reflection)
  };
  const systemMessage = `You are a personal development expert analyzing weekly growth data. Provide insights that are encouraging, actionable, and personalized. Focus on patterns, learning opportunities, and celebrating achievements.`;
  const prompt = `Analyze this weekly data and provide a learning summary in JSON format with three arrays:
1. insights: 2-3 key observations about patterns, feelings, or achievements
2. patterns: 1-2 recurring themes or behaviors noticed
3. recommendations: 2-3 specific, actionable suggestions for continued growth

Data: ${JSON.stringify(summaryData, null, 2)}

Respond with only valid JSON containing these three arrays.`;
  const aiResponse = await callOpenAI(prompt, systemMessage);
  if (aiResponse) {
    try {
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      const parsed = JSON.parse(cleanResponse);
      return {
        insights: parsed.insights || ["You've been making consistent progress on your goals."],
        patterns: parsed.patterns || ["You're building good habits through regular reflection."],
        recommendations: parsed.recommendations || ["Continue reflecting on your experiences to build self-awareness."]
      };
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      console.error("Raw response:", aiResponse);
    }
  }
  const insights = [];
  const patterns = [];
  const recommendations = [];
  if (feelingDistribution.length > 0) {
    const topFeeling = feelingDistribution[0];
    insights.push(`You felt ${topFeeling.feeling.toLowerCase()} most often this week (${topFeeling.percentage}% of the time).`);
    if (topFeeling.percentage > 50) {
      insights.push("You're maintaining a consistent positive emotional state across your tasks.");
    }
  }
  const actionTypes = weeklyActions.map((a) => a.title.toLowerCase());
  const commonWords = actionTypes.join(" ").split(" ").filter((word) => word.length > 3);
  const wordCounts = {};
  commonWords.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  const frequentWords = Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([word]) => word);
  if (frequentWords.length > 0) {
    patterns.push(`You've been focusing on activities related to: ${frequentWords.join(", ")}.`);
  }
  const avgSatisfaction = weeklyActions.reduce((sum, action) => sum + (action.satisfaction || 3), 0) / weeklyActions.length;
  if (avgSatisfaction < 3) {
    recommendations.push("Consider adjusting your task difficulty or breaking complex tasks into smaller, more manageable steps.");
  } else if (avgSatisfaction > 4) {
    recommendations.push("You're finding great satisfaction in your tasks. Consider taking on slightly more challenging goals.");
  }
  if (weeklyActions.length < 5) {
    recommendations.push("Try to complete a few more actions this week to build momentum and gather more insights.");
  }
  recommendations.push("Continue reflecting on your feelings after each task to build self-awareness.");
  return { insights, patterns, recommendations };
}
async function generateAchievementStory(weeklyActions, achievements2, totalXP, streak) {
  const storyData = {
    weekStats: {
      totalActions: weeklyActions.length,
      totalXP,
      streak,
      achievements: achievements2.map((a) => a.title)
    },
    actionHighlights: weeklyActions.map((a) => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      reflection: a.reflection,
      xpReward: a.xpReward
    })),
    topFeelings: weeklyActions.filter((a) => a.feeling).reduce((acc, action) => {
      acc[action.feeling] = (acc[action.feeling] || 0) + 1;
      return acc;
    }, {})
  };
  const systemMessage = `You are a motivational storyteller who creates engaging, personal narratives about someone's weekly achievements. Write in a warm, encouraging tone that celebrates their progress and makes them feel proud of their accomplishments. Focus on the journey, the emotions, and the growth.`;
  const prompt = `Create an engaging story about this person's weekly achievements in JSON format with one field:
1. story: A compelling 2-3 paragraph narrative that tells the story of their week, highlighting their accomplishments, feelings, and growth. Make it personal, motivational, and story-like.

Data: ${JSON.stringify(storyData, null, 2)}

Respond with only valid JSON containing the story field.`;
  const aiResponse = await callOpenAI(prompt, systemMessage);
  if (aiResponse) {
    try {
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      const parsed = JSON.parse(cleanResponse);
      return parsed.story || generateFallbackStory(weeklyActions, achievements2, totalXP, streak);
    } catch (error) {
      console.error("Failed to parse OpenAI achievement story response:", error);
      console.error("Raw response:", aiResponse);
      return generateFallbackStory(weeklyActions, achievements2, totalXP, streak);
    }
  }
  return generateFallbackStory(weeklyActions, achievements2, totalXP, streak);
}
function generateFallbackStory(weeklyActions, achievements2, totalXP, streak) {
  const actionCount = weeklyActions.length;
  const achievementCount = achievements2.length;
  let story = `This week, you've been on an incredible journey of growth and self-discovery. `;
  if (actionCount > 0) {
    story += `You completed ${actionCount} meaningful actions, each one a step forward in your personal development. `;
  }
  if (totalXP > 0) {
    story += `With ${totalXP} XP earned, you've built up significant momentum in your growth garden. `;
  }
  if (achievementCount > 0) {
    story += `Your dedication has been recognized with ${achievementCount} new achievement${achievementCount > 1 ? "s" : ""}, marking important milestones in your journey. `;
  }
  if (streak > 0) {
    story += `You've maintained a ${streak}-day streak, showing remarkable consistency and commitment to your goals. `;
  }
  story += `Every action you take, every reflection you make, and every feeling you acknowledge is part of your unique story of growth. You're not just completing tasks\u2014you're building a life of intention and purpose.`;
  return story;
}
async function checkAndCreateAchievements(storage2) {
  try {
    console.log("Checking for achievements...");
    const allActions = await storage2.getAllActions();
    const allGoals = await storage2.getGoals();
    const existingAchievements = await storage2.getAchievements();
    const completedActions = allActions.filter((action) => action.isCompleted);
    const totalActions = allActions.length;
    const totalGoals = allGoals.length;
    const activeGoals = allGoals.filter((goal) => goal.status === "active").length;
    console.log("Current stats:", {
      completedActions: completedActions.length,
      totalActions,
      totalGoals,
      activeGoals,
      existingAchievements: existingAchievements.length
    });
    const achievementCriteria = [
      {
        id: "first-action",
        title: "First Step",
        description: "Completed your first action",
        iconName: "\u{1F331}",
        condition: () => completedActions.length === 1
      },
      {
        id: "action-streak",
        title: "Action Hero",
        description: "Completed 5 actions",
        iconName: "\u26A1",
        condition: () => completedActions.length >= 5
      },
      {
        id: "goal-setter",
        title: "Goal Setter",
        description: "Created your first goal",
        iconName: "\u{1F3AF}",
        condition: () => totalGoals >= 1
      },
      {
        id: "multi-goal",
        title: "Multi-Tasker",
        description: "Created 3 goals",
        iconName: "\u{1F333}",
        condition: () => totalGoals >= 3
      },
      {
        id: "level-up",
        title: "Level Up!",
        description: "Reached level 2 with any goal",
        iconName: "\u{1F4C8}",
        condition: () => allGoals.some((goal) => goal.currentLevel >= 2)
      },
      {
        id: "master-gardener",
        title: "Master Gardener",
        description: "Reached level 5 with any goal",
        iconName: "\u{1F451}",
        condition: () => allGoals.some((goal) => goal.currentLevel >= 5)
      },
      {
        id: "consistency",
        title: "Consistency King",
        description: "Completed 10 actions",
        iconName: "\u{1F525}",
        condition: () => completedActions.length >= 10
      },
      {
        id: "variety",
        title: "Variety Seeker",
        description: "Created goals of different plant types",
        iconName: "\u{1F33A}",
        condition: () => {
          const plantTypes = new Set(allGoals.map((goal) => goal.plantType));
          return plantTypes.size >= 3;
        }
      }
    ];
    for (const criterion of achievementCriteria) {
      const alreadyUnlocked = existingAchievements.some(
        (achievement) => achievement.title === criterion.title
      );
      console.log(`Checking ${criterion.title}:`, {
        alreadyUnlocked,
        conditionMet: criterion.condition()
      });
      if (!alreadyUnlocked && criterion.condition()) {
        console.log(`Creating achievement: ${criterion.title}`);
        await storage2.createAchievement({
          title: criterion.title,
          description: criterion.description,
          iconName: criterion.iconName
        });
      }
    }
    console.log("Achievement check completed");
  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}
async function callOpenAI(prompt, systemMessage = "") {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  console.log("\u{1F50D} OpenAI API Key check:");
  console.log("  - Key exists:", !!OPENAI_API_KEY);
  console.log("  - Key length:", OPENAI_API_KEY?.length || 0);
  console.log("  - Key starts with:", OPENAI_API_KEY?.substring(0, 20) || "undefined");
  if (!OPENAI_API_KEY) {
    console.log("OpenAI API key not found, using fallback analysis");
    return null;
  }
  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemMessage || "You are a helpful AI assistant that analyzes personal growth data and provides insightful, encouraging feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      console.error("OpenAI API error:", response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    return null;
  }
}
async function registerRoutes(app2) {
  const router = express.Router();
  function getUserStorage(req) {
    const userId = req.userId;
    console.log("\u{1F50D} getUserStorage - userId:", userId);
    if (!userId) {
      console.error("\u274C getUserStorage - No userId found in request");
      throw new Error("User not authenticated");
    }
    console.log("\u{1F50D} getUserStorage - Creating storage for user:", userId);
    const storage2 = createStorage(userId);
    console.log("\u{1F50D} getUserStorage - Storage created successfully");
    return storage2;
  }
  app2.get("/api/health", (_req, res) => {
    const { getDb: getDb2 } = (init_db(), __toCommonJS(db_exports));
    const isDbConnected = !!getDb2();
    res.status(200).json({
      status: "ok",
      message: "API is healthy",
      storage: {
        type: isDbConnected ? "database" : "memory",
        persistent: isDbConnected,
        warning: isDbConnected ? null : "Data will not persist between server restarts"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/storage-status", (_req, res) => {
    const { getDb: getDb2 } = (init_db(), __toCommonJS(db_exports));
    const isDbConnected = !!getDb2();
    res.json({
      type: isDbConnected ? "database" : "memory",
      persistent: isDbConnected,
      connected: isDbConnected,
      warning: isDbConnected ? null : "Your data is stored in memory and will not persist between server restarts. Database connection issues detected."
    });
  });
  app2.get("/api/test", (_req, res) => {
    res.json({ message: "Test endpoint working", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/goals", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const goals2 = await userStorage.getGoals();
      res.json(goals2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });
  app2.get("/api/goals/:id", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const id = parseInt(req.params.id);
      const goal = await userStorage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });
  app2.post("/api/goals", authenticateUser, async (req, res) => {
    try {
      console.log("\u{1F3AF} POST /api/goals - Creating goal with data:", req.body);
      console.log("\u{1F3AF} User ID from auth:", req.userId);
      const userStorage = getUserStorage(req);
      console.log("\u{1F3AF} Got user storage successfully");
      const goalData = insertGoalSchema.parse(req.body);
      console.log("\u{1F3AF} Parsed goal data:", goalData);
      const goal = await userStorage.createGoal(goalData);
      console.log("\u{1F3AF} Created goal successfully:", goal);
      await checkAndCreateAchievements(userStorage);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to create goal", details: errorMessage });
    }
  });
  app2.patch("/api/goals/:id", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const id = parseInt(req.params.id);
      const updates = req.body;
      const goal = await userStorage.updateGoal(id, updates);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });
  app2.delete("/api/goals/:id", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const id = parseInt(req.params.id);
      const deleted = await userStorage.deleteGoal(id);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });
  app2.get("/api/actions", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const actions2 = await userStorage.getAllActions();
      res.json(actions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });
  app2.get("/api/goals/:goalId/actions", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const goalId = parseInt(req.params.goalId);
      const actions2 = await userStorage.getActionsByGoal(goalId);
      res.json(actions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });
  app2.post("/api/actions", authenticateUser, async (req, res) => {
    try {
      console.log("Received action data:", req.body);
      const userStorage = getUserStorage(req);
      const actionData = insertActionSchema.parse(req.body);
      console.log("Parsed action data:", actionData);
      const action = await userStorage.createAction(actionData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.log("Zod validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid action data", details: error.errors });
      }
      console.log("Action creation error:", error);
      res.status(500).json({ error: "Failed to create action" });
    }
  });
  app2.patch("/api/actions/:id/complete", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const id = parseInt(req.params.id);
      const action = await userStorage.getAction(id);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      const updatedAction = await userStorage.updateAction(id, {
        isCompleted: true,
        completedAt: /* @__PURE__ */ new Date()
      });
      const goal = await userStorage.getGoal(action.goalId);
      if (goal) {
        const newXP = goal.currentXP + action.xpReward;
        const newLevel = Math.floor(newXP / goal.maxXP) + 1;
        await userStorage.updateGoal(action.goalId, {
          currentXP: newXP % goal.maxXP,
          currentLevel: Math.max(goal.currentLevel, newLevel),
          lastWatered: /* @__PURE__ */ new Date()
        });
      }
      await checkAndCreateAchievements(userStorage);
      res.json(updatedAction);
    } catch (error) {
      console.error("Error completing action:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to complete action", details: errorMessage });
    }
  });
  app2.patch("/api/actions/:id/reflection", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const id = parseInt(req.params.id);
      const action = await userStorage.getAction(id);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      const { feeling, reflection, difficulty, satisfaction, reflectedAt } = req.body;
      const updatedAction = await userStorage.updateAction(id, {
        feeling,
        reflection,
        difficulty,
        satisfaction,
        reflectedAt: reflectedAt ? new Date(reflectedAt) : /* @__PURE__ */ new Date()
      });
      res.json(updatedAction);
    } catch (error) {
      console.error("Error saving reflection:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to save reflection", details: errorMessage });
    }
  });
  app2.delete("/api/actions/:id", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const id = parseInt(req.params.id);
      const deleted = await userStorage.deleteAction(id);
      if (!deleted) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting action:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to delete action", details: errorMessage });
    }
  });
  app2.get("/api/achievements", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const achievements2 = await userStorage.getAchievements();
      res.json(achievements2);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch achievements", details: errorMessage });
    }
  });
  app2.post("/api/achievements", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const achievementData = insertAchievementSchema.parse(req.body);
      const achievement = await userStorage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid achievement data", details: error.errors });
      }
      console.error("Error creating achievement:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to create achievement", details: errorMessage });
    }
  });
  app2.post("/api/achievements/check", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      await checkAndCreateAchievements(userStorage);
      res.json({ message: "Achievements checked", achievements: await userStorage.getAchievements() });
    } catch (error) {
      console.error("Error checking achievements:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to check achievements", details: errorMessage });
    }
  });
  app2.get("/api/daily-habits", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      const habits = await userStorage.getDailyHabits(startDate, endDate);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching daily habits:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch daily habits", details: errorMessage });
    }
  });
  app2.post("/api/daily-habits", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const habitData = insertDailyHabitSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const habit = await userStorage.createDailyHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Invalid habit data", details: error.errors });
      }
      console.error("Error creating daily habit:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to create daily habit", details: errorMessage });
    }
  });
  app2.get("/api/daily-habits/:date", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { date } = req.params;
      const habit = await userStorage.getDailyHabit(date);
      res.json(habit || null);
    } catch (error) {
      console.error("Error fetching daily habit:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch daily habit", details: errorMessage });
    }
  });
  app2.patch("/api/daily-habits/:date", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { date } = req.params;
      const updates = req.body;
      const habit = await userStorage.updateDailyHabit(date, updates);
      if (!habit) {
        return res.status(404).json({ error: "Daily habit not found" });
      }
      res.json(habit);
    } catch (error) {
      console.error("Error updating daily habit:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to update daily habit", details: errorMessage });
    }
  });
  app2.get("/api/reports/weekly-reflection", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const now = /* @__PURE__ */ new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const allActions = await userStorage.getAllActions();
      const weeklyActions = allActions.filter(
        (action) => action.isCompleted && action.reflectedAt && new Date(action.reflectedAt) >= weekStart && new Date(action.reflectedAt) <= weekEnd
      );
      if (weeklyActions.length === 0) {
        return res.json(null);
      }
      const feelingCounts = {};
      weeklyActions.forEach((action) => {
        if (action.feeling) {
          if (!feelingCounts[action.feeling]) {
            feelingCounts[action.feeling] = { count: 0, actions: [] };
          }
          feelingCounts[action.feeling].count++;
          feelingCounts[action.feeling].actions.push(action.title);
        }
      });
      const totalReflections = weeklyActions.length;
      const feelingDistribution = Object.entries(feelingCounts).map(([feeling, data]) => ({
        feeling,
        emoji: getFeelingEmoji(feeling),
        count: data.count,
        percentage: Math.round(data.count / totalReflections * 100),
        actions: data.actions
      }));
      const totalXP = weeklyActions.reduce((sum, action) => sum + action.xpReward, 0);
      const achievements2 = await userStorage.getAchievements();
      const weeklyAchievements = achievements2.filter((achievement) => {
        return true;
      });
      const streak = Math.min(7, weeklyActions.length);
      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);
      const achievementStory = await generateAchievementStory(weeklyActions, weeklyAchievements, totalXP, streak);
      const report = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: weeklyAchievements.map((a) => a.title),
          streak,
          story: achievementStory
        },
        learningSummary,
        aiAnalysis
      };
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate weekly report" });
    }
  });
  app2.post("/api/reports/weekly-reflection", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const now = /* @__PURE__ */ new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const allActions = await userStorage.getAllActions();
      const weeklyActions = allActions.filter(
        (action) => action.isCompleted && action.reflectedAt && new Date(action.reflectedAt) >= weekStart && new Date(action.reflectedAt) <= weekEnd
      );
      if (weeklyActions.length === 0) {
        return res.json({ message: "No reflection data available for this week" });
      }
      const feelingCounts = {};
      weeklyActions.forEach((action) => {
        if (action.feeling) {
          if (!feelingCounts[action.feeling]) {
            feelingCounts[action.feeling] = { count: 0, actions: [] };
          }
          feelingCounts[action.feeling].count++;
          feelingCounts[action.feeling].actions.push(action.title);
        }
      });
      const totalReflections = weeklyActions.length;
      const feelingDistribution = Object.entries(feelingCounts).map(([feeling, data]) => ({
        feeling,
        emoji: getFeelingEmoji(feeling),
        count: data.count,
        percentage: Math.round(data.count / totalReflections * 100),
        actions: data.actions
      }));
      const totalXP = weeklyActions.reduce((sum, action) => sum + action.xpReward, 0);
      const achievements2 = await userStorage.getAchievements();
      const streak = Math.min(7, weeklyActions.length);
      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);
      const achievementStory = await generateAchievementStory(weeklyActions, achievements2, totalXP, streak);
      const report = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: achievements2.map((a) => a.title),
          streak,
          story: achievementStory
        },
        learningSummary,
        aiAnalysis
      };
      res.json(report);
    } catch (error) {
      console.error("Error generating weekly report:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to generate weekly report", details: errorMessage });
    }
  });
  app2.post("/api/reports/regenerate-insights", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const now = /* @__PURE__ */ new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const allActions = await userStorage.getAllActions();
      const weeklyActions = allActions.filter(
        (action) => action.isCompleted && action.reflectedAt && new Date(action.reflectedAt) >= weekStart && new Date(action.reflectedAt) <= weekEnd
      );
      if (weeklyActions.length === 0) {
        return res.json({ message: "No reflection data available for this week" });
      }
      const feelingCounts = {};
      weeklyActions.forEach((action) => {
        if (action.feeling) {
          if (!feelingCounts[action.feeling]) {
            feelingCounts[action.feeling] = { count: 0, actions: [] };
          }
          feelingCounts[action.feeling].count++;
          feelingCounts[action.feeling].actions.push(action.title);
        }
      });
      const totalReflections = weeklyActions.length;
      const feelingDistribution = Object.entries(feelingCounts).map(([feeling, data]) => ({
        feeling,
        emoji: getFeelingEmoji(feeling),
        count: data.count,
        percentage: Math.round(data.count / totalReflections * 100),
        actions: data.actions
      }));
      const totalXP = weeklyActions.reduce((sum, action) => sum + action.xpReward, 0);
      const achievements2 = await userStorage.getAchievements();
      const weeklyAchievements = achievements2.filter((achievement) => {
        return true;
      });
      const streak = Math.min(7, weeklyActions.length);
      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);
      const report = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: weeklyAchievements.map((a) => a.title),
          streak
        },
        learningSummary,
        aiAnalysis
      };
      res.json(report);
    } catch (error) {
      console.error("Error regenerating insights:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to regenerate insights", details: errorMessage });
    }
  });
  app2.get("/api/reports/historical", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { weeks = "8" } = req.query;
      const weeksBack = parseInt(weeks);
      const reports = [];
      const now = /* @__PURE__ */ new Date();
      for (let i = 0; i < weeksBack; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (now.getDay() + i * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const allActions = await userStorage.getAllActions();
        const weeklyActions = allActions.filter(
          (action) => action.isCompleted && action.reflectedAt && new Date(action.reflectedAt) >= weekStart && new Date(action.reflectedAt) <= weekEnd
        );
        if (weeklyActions.length > 0) {
          const feelingCounts = {};
          weeklyActions.forEach((action) => {
            if (action.feeling) {
              if (!feelingCounts[action.feeling]) {
                feelingCounts[action.feeling] = { count: 0, actions: [] };
              }
              feelingCounts[action.feeling].count++;
              feelingCounts[action.feeling].actions.push(action.title);
            }
          });
          const totalReflections = weeklyActions.length;
          const feelingDistribution = Object.entries(feelingCounts).map(([feeling, data]) => ({
            feeling,
            emoji: getFeelingEmoji(feeling),
            count: data.count,
            percentage: Math.round(data.count / totalReflections * 100),
            actions: data.actions
          }));
          const totalXP = weeklyActions.reduce((sum, action) => sum + action.xpReward, 0);
          const achievements2 = await userStorage.getAchievements();
          const streak = Math.min(7, weeklyActions.length);
          const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
          const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);
          const achievementStory = await generateAchievementStory(weeklyActions, achievements2, totalXP, streak);
          reports.push({
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            feelingDistribution,
            accomplishments: {
              totalActions: weeklyActions.length,
              totalXP,
              achievements: achievements2.map((a) => a.title),
              streak,
              story: achievementStory
            },
            learningSummary,
            aiAnalysis
          });
        }
      }
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch historical reports" });
    }
  });
  app2.get("/api/reports/historical/:weekStart", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const { weekStart } = req.params;
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      const allActions = await userStorage.getAllActions();
      const weeklyActions = allActions.filter(
        (action) => action.isCompleted && action.reflectedAt && new Date(action.reflectedAt) >= startDate && new Date(action.reflectedAt) <= endDate
      );
      if (weeklyActions.length === 0) {
        return res.status(404).json({ error: "No data available for this week" });
      }
      const feelingCounts = {};
      weeklyActions.forEach((action) => {
        if (action.feeling) {
          if (!feelingCounts[action.feeling]) {
            feelingCounts[action.feeling] = { count: 0, actions: [] };
          }
          feelingCounts[action.feeling].count++;
          feelingCounts[action.feeling].actions.push(action.title);
        }
      });
      const totalReflections = weeklyActions.length;
      const feelingDistribution = Object.entries(feelingCounts).map(([feeling, data]) => ({
        feeling,
        emoji: getFeelingEmoji(feeling),
        count: data.count,
        percentage: Math.round(data.count / totalReflections * 100),
        actions: data.actions
      }));
      const totalXP = weeklyActions.reduce((sum, action) => sum + action.xpReward, 0);
      const achievements2 = await userStorage.getAchievements();
      const streak = Math.min(7, weeklyActions.length);
      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);
      const achievementStory = await generateAchievementStory(weeklyActions, achievements2, totalXP, streak);
      const report = {
        weekStart: startDate.toISOString(),
        weekEnd: endDate.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: achievements2.map((a) => a.title),
          streak,
          story: achievementStory
        },
        learningSummary,
        aiAnalysis
      };
      res.json(report);
    } catch (error) {
      console.error("Error fetching historical report:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to fetch historical report", details: errorMessage });
    }
  });
  app2.post("/api/goals/check-health", authenticateUser, async (req, res) => {
    try {
      const userStorage = getUserStorage(req);
      const goals2 = await userStorage.getGoals();
      const now = /* @__PURE__ */ new Date();
      const updatedGoals = [];
      for (const goal of goals2) {
        if (goal.status === "active") {
          const hoursSinceWatered = (now.getTime() - goal.lastWatered.getTime()) / (1e3 * 60 * 60);
          if (hoursSinceWatered > 168) {
            await userStorage.updateGoal(goal.id, { status: "withered" });
            updatedGoals.push({ ...goal, status: "withered" });
          } else if (hoursSinceWatered > 72) {
            updatedGoals.push({ ...goal, needsAttention: true });
          }
        }
      }
      res.json({ updatedGoals });
    } catch (error) {
      console.error("Error checking tree health:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to check tree health", details: errorMessage });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// api/index.ts
init_db();
var app = express2();
app.locals.storage = storage;
var allowedOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  "https://growthgarden-app.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some((allowed) => origin.includes(allowed.replace("https://", "").replace("http://", "")))) {
      return callback(null, true);
    }
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express2.json());
var dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error("Database initialization failed, continuing with in-memory storage");
    }
  }
  next();
});
app.get("/", (req, res) => {
  res.json({
    message: "Growth Garden API is running on Vercel!",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: "vercel"
  });
});
await registerRoutes(app);
var index_default = app;
export {
  index_default as default
};
