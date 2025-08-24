import { z } from 'zod';

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  provider: z.enum(['email', 'google', 'github']).default('email'),
  providerId: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
});

// Goal schemas
export const CreateGoalSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  plantType: z.enum(['sprout', 'herb', 'tree', 'flower']).default('sprout'),
  timelineMonths: z.number().int().min(1).max(60).default(3),
});

export const UpdateGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  plantType: z.enum(['sprout', 'herb', 'tree', 'flower']).optional(),
  timelineMonths: z.number().int().min(1).max(60).optional(),
  status: z.enum(['active', 'completed', 'withered', 'paused']).optional(),
});

// Action schemas
export const CreateActionSchema = z.object({
  goalId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  xpReward: z.number().int().min(1).max(100).default(10),
});

export const UpdateActionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().datetime().optional(),
  xpReward: z.number().int().min(1).max(100).optional(),
});

// Daily Habit schemas
export const CreateHabitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eatHealthy: z.boolean().default(false),
  exercise: z.boolean().default(false),
  sleepBefore11pm: z.boolean().default(false),
  notes: z.string().optional(),
});

export const UpdateHabitSchema = z.object({
  eatHealthy: z.boolean().optional(),
  exercise: z.boolean().optional(),
  sleepBefore11pm: z.boolean().optional(),
  notes: z.string().optional(),
});

// Type exports
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type CreateGoal = z.infer<typeof CreateGoalSchema>;
export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;
export type CreateAction = z.infer<typeof CreateActionSchema>;
export type UpdateAction = z.infer<typeof UpdateActionSchema>;
export type CreateHabit = z.infer<typeof CreateHabitSchema>;
export type UpdateHabit = z.infer<typeof UpdateHabitSchema>;

// Express session user type
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: string;
}

declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}