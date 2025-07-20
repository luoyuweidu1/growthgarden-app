import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
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
  goalId: integer("goal_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").notNull().default(15),
  isCompleted: boolean("is_completed").notNull().default(false),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
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

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
