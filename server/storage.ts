import { goals, actions, achievements, dailyHabits, type Goal, type InsertGoal, type Action, type InsertAction, type Achievement, type InsertAchievement, type DailyHabit, type InsertDailyHabit } from "@shared/schema";
import { db } from "./db.js";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Goals
  getGoals(): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Actions
  getActionsByGoal(goalId: number): Promise<Action[]>;
  getAllActions(): Promise<Action[]>;
  getAction(id: number): Promise<Action | undefined>;
  createAction(action: InsertAction): Promise<Action>;
  updateAction(id: number, updates: Partial<Action>): Promise<Action | undefined>;
  deleteAction(id: number): Promise<boolean>;
  
  // Achievements
  getAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Daily Habits
  getDailyHabit(date: string): Promise<DailyHabit | undefined>;
  getDailyHabits(startDate: string, endDate: string): Promise<DailyHabit[]>;
  createDailyHabit(habit: InsertDailyHabit): Promise<DailyHabit>;
  updateDailyHabit(date: string, updates: Partial<DailyHabit>): Promise<DailyHabit | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor(private userId: string) {}

  // Goals
  async getGoals(): Promise<Goal[]> {
    if (!db) throw new Error("Database not available");
    console.log(`🔍 Fetching goals for user: ${this.userId}`);
    const result = await db.select().from(goals).where(eq(goals.userId, this.userId));
    console.log(`📊 Found ${result.length} goals for user: ${this.userId}`);
    return result;
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(goals).where(
      and(eq(goals.id, id), eq(goals.userId, this.userId))
    );
    return result[0];
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(goals).values({
      ...insertGoal,
      userId: this.userId
    }).returning();
    return result[0];
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.update(goals).set(updates).where(
      and(eq(goals.id, id), eq(goals.userId, this.userId))
    ).returning();
    return result[0];
  }

  async deleteGoal(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not available");
    const result = await db.delete(goals).where(
      and(eq(goals.id, id), eq(goals.userId, this.userId))
    ).returning();
    return result.length > 0;
  }

  // Actions
  async getActionsByGoal(goalId: number): Promise<Action[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(actions).where(
      and(eq(actions.goalId, goalId), eq(actions.userId, this.userId))
    );
  }

  async getAllActions(): Promise<Action[]> {
    if (!db) throw new Error("Database not available");
    console.log(`🔍 Fetching actions for user: ${this.userId}`);
    const result = await db.select().from(actions).where(eq(actions.userId, this.userId));
    console.log(`📊 Found ${result.length} actions for user: ${this.userId}`);
    return result;
  }

  async getAction(id: number): Promise<Action | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(actions).where(
      and(eq(actions.id, id), eq(actions.userId, this.userId))
    );
    return result[0];
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(actions).values({
      ...insertAction,
      userId: this.userId,
      dueDate: insertAction.dueDate ? new Date(insertAction.dueDate) : null
    }).returning();
    return result[0];
  }

  async updateAction(id: number, updates: Partial<Action>): Promise<Action | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.update(actions).set(updates).where(
      and(eq(actions.id, id), eq(actions.userId, this.userId))
    ).returning();
    return result[0];
  }

  async deleteAction(id: number): Promise<boolean> {
    if (!db) throw new Error("Database not available");
    const result = await db.delete(actions).where(
      and(eq(actions.id, id), eq(actions.userId, this.userId))
    ).returning();
    return result.length > 0;
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(achievements).where(eq(achievements.userId, this.userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(achievements).values({
      ...insertAchievement,
      userId: this.userId
    }).returning();
    return result[0];
  }

  // Daily Habits
  async getDailyHabit(date: string): Promise<DailyHabit | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(dailyHabits).where(
      and(eq(dailyHabits.date, date), eq(dailyHabits.userId, this.userId))
    );
    return result[0];
  }

  async getDailyHabits(startDate: string, endDate: string): Promise<DailyHabit[]> {
    if (!db) throw new Error("Database not available");
    return await db.select().from(dailyHabits).where(
      and(
        gte(dailyHabits.date, startDate),
        lte(dailyHabits.date, endDate),
        eq(dailyHabits.userId, this.userId)
      )
    );
  }

  async createDailyHabit(insertHabit: InsertDailyHabit): Promise<DailyHabit> {
    if (!db) throw new Error("Database not available");
    const result = await db.insert(dailyHabits).values({
      ...insertHabit,
      userId: this.userId
    }).returning();
    return result[0];
  }

  async updateDailyHabit(date: string, updates: Partial<DailyHabit>): Promise<DailyHabit | undefined> {
    if (!db) throw new Error("Database not available");
    const result = await db.update(dailyHabits).set(updates).where(
      and(eq(dailyHabits.date, date), eq(dailyHabits.userId, this.userId))
    ).returning();
    return result[0];
  }
}

export class MemStorage implements IStorage {
  private goals: Map<number, Goal>;
  private actions: Map<number, Action>;
  private achievements: Map<number, Achievement>;
  private dailyHabits: Map<string, DailyHabit>; // Key is date string (YYYY-MM-DD)
  private currentGoalId: number;
  private currentActionId: number;
  private currentAchievementId: number;
  private currentDailyHabitId: number;

  constructor(private userId: string) {
    this.goals = new Map();
    this.actions = new Map();
    this.achievements = new Map();
    this.dailyHabits = new Map();
    this.currentGoalId = 1;
    this.currentActionId = 1;
    this.currentAchievementId = 1;
    this.currentDailyHabitId = 1;
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values());
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentGoalId++;
    const goal: Goal = {
      id,
      userId: this.userId,
      name: insertGoal.name,
      description: insertGoal.description || null,
      plantType: insertGoal.plantType,
      timelineMonths: insertGoal.timelineMonths ?? 3,
      currentLevel: 1,
      currentXP: 0,
      maxXP: 100,
      status: 'active',
      lastWatered: new Date(),
      createdAt: new Date(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Actions
  async getActionsByGoal(goalId: number): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(action => action.goalId === goalId);
  }

  async getAllActions(): Promise<Action[]> {
    return Array.from(this.actions.values());
  }

  async getAction(id: number): Promise<Action | undefined> {
    return this.actions.get(id);
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const id = this.currentActionId++;
    const action: Action = {
      id,
      userId: this.userId,
      title: insertAction.title,
      description: insertAction.description ?? null,
      goalId: insertAction.goalId,
      xpReward: insertAction.xpReward ?? 15,
      personalReward: insertAction.personalReward ?? null,
      dueDate: insertAction.dueDate ? (typeof insertAction.dueDate === 'string' ? new Date(insertAction.dueDate) : insertAction.dueDate) : null,
      isCompleted: false,
      completedAt: null,
      feeling: null,
      reflection: null,
      difficulty: null,
      satisfaction: null,
      reflectedAt: null,
      createdAt: new Date(),
    };
    this.actions.set(id, action);
    return action;
  }

  async updateAction(id: number, updates: Partial<Action>): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (!action) return undefined;
    
    const updatedAction = { ...action, ...updates };
    this.actions.set(id, updatedAction);
    return updatedAction;
  }

  async deleteAction(id: number): Promise<boolean> {
    return this.actions.delete(id);
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.currentAchievementId++;
    const achievement: Achievement = {
      ...insertAchievement,
      id,
      unlockedAt: new Date(),
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  // Daily Habits
  async getDailyHabit(date: string): Promise<DailyHabit | undefined> {
    return this.dailyHabits.get(date);
  }

  async getDailyHabits(startDate: string, endDate: string): Promise<DailyHabit[]> {
    return Array.from(this.dailyHabits.values()).filter(habit => 
      habit.date >= startDate && habit.date <= endDate
    );
  }

  async createDailyHabit(insertHabit: InsertDailyHabit): Promise<DailyHabit> {
    const id = this.currentDailyHabitId++;
    const habit: DailyHabit = {
      id,
      userId: this.userId,
      date: insertHabit.date,
      eatHealthy: insertHabit.eatHealthy ?? false,
      exercise: insertHabit.exercise ?? false,
      sleepBefore11pm: insertHabit.sleepBefore11pm ?? false,
      notes: insertHabit.notes ?? null,
      createdAt: new Date(),
    };
    this.dailyHabits.set(insertHabit.date, habit);
    return habit;
  }

  async updateDailyHabit(date: string, updates: Partial<DailyHabit>): Promise<DailyHabit | undefined> {
    const habit = this.dailyHabits.get(date);
    if (!habit) return undefined;
    
    const updatedHabit = { ...habit, ...updates };
    this.dailyHabits.set(date, updatedHabit);
    return updatedHabit;
  }
}

// Create a function to get storage instance with user context
export function createStorage(userId: string): IStorage {
  if (db) {
    console.log(`🔗 Using database storage for user: ${userId}`);
    return new DatabaseStorage(userId);
  } else {
    console.log(`⚠️  Using in-memory storage for user: ${userId} (no database connection)`);
    return new MemStorage(userId);
  }
}

// For backward compatibility, export a default storage (will be replaced by user-specific storage)
export const storage = createStorage('default-user');
