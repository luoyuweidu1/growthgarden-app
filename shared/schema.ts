import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User authentication table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  plantType: text("plant_type").notNull(), // 'sprout', 'herb', 'tree', 'flower'
  currentLevel: integer("current_level").notNull().default(1),
  currentXP: integer("current_xp").notNull().default(0),
  maxXP: integer("max_xp").notNull().default(100),
  timelineMonths: integer("timeline_months").notNull().default(3),
  status: text("status").notNull().default('active'), // 'active', 'completed', 'withered'
  lastWatered: timestamp("last_watered").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goalId: integer("goal_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").notNull().default(15),
  personalReward: text("personal_reward"), // Custom reward for completing the task
  isCompleted: boolean("is_completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  // Reflection fields
  feeling: text("feeling"), // How the user felt after completing the action
  reflection: text("reflection"), // User's reflection on the action
  difficulty: integer("difficulty"), // 1-5 scale of task difficulty
  satisfaction: integer("satisfaction"), // 1-5 scale of satisfaction with result
  reflectedAt: timestamp("reflected_at"), // When the reflection was recorded
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const dailyHabits = pgTable("daily_habits", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  eatHealthy: boolean("eat_healthy").notNull().default(false),
  exercise: boolean("exercise").notNull().default(false),
  sleepBefore11pm: boolean("sleep_before_11pm").notNull().default(false),
  notes: text("notes"), // Optional notes for the day
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true, // Exclude userId - it will be set by the backend based on auth
  currentLevel: true,
  currentXP: true,
  maxXP: true,
  status: true,
  lastWatered: true,
  createdAt: true,
});

export const insertActionSchema = createInsertSchema(actions).omit({
  id: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
}).extend({
  dueDate: z.union([z.date(), z.string().datetime(), z.null()]).optional(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertDailyHabitSchema = createInsertSchema(dailyHabits).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type DailyHabit = typeof dailyHabits.$inferSelect;
export type InsertDailyHabit = z.infer<typeof insertDailyHabitSchema>;
