import { db } from './db';
import { goals, actions, achievements, dailyHabits, users, type Goal, type InsertGoal, type Action, type InsertAction, type Achievement, type InsertAchievement, type DailyHabit, type InsertDailyHabit, type User, type InsertUser } from "@shared/schema";
import { eq, and, gte, lte } from 'drizzle-orm';
import type { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private currentUserId: string | null = null;

  constructor() {
    // Check if database is available
    if (!db) {
      throw new Error('Database connection not available. Please set DATABASE_URL or SUPABASE_DB_URL environment variable.');
    }
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  private requireUser() {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }
    return this.currentUserId;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db!.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db!.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db!.insert(users).values(userData).returning();
    return result[0];
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    const userId = this.requireUser();
    return await db!.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const userId = this.requireUser();
    const result = await db!.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, userId))).limit(1);
    return result[0];
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const userId = this.requireUser();
    const result = await db!.insert(goals).values({
      ...insertGoal,
      userId,
      currentLevel: 1,
      currentXP: 0,
      maxXP: 100,
      status: 'active',
      lastWatered: new Date(),
    }).returning();
    return result[0];
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const userId = this.requireUser();
    const result = await db!.update(goals)
      .set(updates)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteGoal(id: number): Promise<boolean> {
    const userId = this.requireUser();
    const result = await db!.delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Actions
  async getActionsByGoal(goalId: number): Promise<Action[]> {
    const userId = this.requireUser();
    return await db!.select().from(actions).where(and(eq(actions.goalId, goalId), eq(actions.userId, userId)));
  }

  async getAllActions(): Promise<Action[]> {
    const userId = this.requireUser();
    return await db!.select().from(actions).where(eq(actions.userId, userId));
  }

  async getAction(id: number): Promise<Action | undefined> {
    const userId = this.requireUser();
    const result = await db!.select().from(actions).where(and(eq(actions.id, id), eq(actions.userId, userId))).limit(1);
    return result[0];
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const userId = this.requireUser();
    const result = await db!.insert(actions).values({
      ...insertAction,
      userId,
      isCompleted: false,
      completedAt: null,
      feeling: null,
      reflection: null,
      difficulty: null,
      satisfaction: null,
      reflectedAt: null,
      dueDate: insertAction.dueDate ? new Date(insertAction.dueDate) : null,
    }).returning();
    return result[0];
  }

  async updateAction(id: number, updates: Partial<Action>): Promise<Action | undefined> {
    const userId = this.requireUser();
    const result = await db!.update(actions)
      .set(updates)
      .where(and(eq(actions.id, id), eq(actions.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteAction(id: number): Promise<boolean> {
    const userId = this.requireUser();
    const result = await db!.delete(actions)
      .where(and(eq(actions.id, id), eq(actions.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    const userId = this.requireUser();
    return await db!.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const userId = this.requireUser();
    const result = await db!.insert(achievements).values({
      ...insertAchievement,
      userId,
    }).returning();
    return result[0];
  }

  // Daily Habits
  async getDailyHabit(date: string): Promise<DailyHabit | undefined> {
    const userId = this.requireUser();
    const result = await db!.select().from(dailyHabits).where(and(eq(dailyHabits.date, date), eq(dailyHabits.userId, userId))).limit(1);
    return result[0];
  }

  async getDailyHabits(startDate: string, endDate: string): Promise<DailyHabit[]> {
    const userId = this.requireUser();
    return await db!.select().from(dailyHabits).where(and(eq(dailyHabits.userId, userId), gte(dailyHabits.date, startDate), lte(dailyHabits.date, endDate)));
  }

  async createDailyHabit(insertHabit: InsertDailyHabit): Promise<DailyHabit> {
    const userId = this.requireUser();
    const result = await db!.insert(dailyHabits).values({
      ...insertHabit,
      userId,
    }).returning();
    return result[0];
  }

  async updateDailyHabit(date: string, updates: Partial<DailyHabit>): Promise<DailyHabit | undefined> {
    const userId = this.requireUser();
    const result = await db!.update(dailyHabits)
      .set(updates)
      .where(and(eq(dailyHabits.date, date), eq(dailyHabits.userId, userId)))
      .returning();
    return result[0];
  }
} 