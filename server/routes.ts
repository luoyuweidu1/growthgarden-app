import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGoalSchema, insertActionSchema, insertAchievementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Goals routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const goal = await storage.getGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const goal = await storage.updateGoal(id, updates);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Actions routes
  app.get("/api/actions", async (req, res) => {
    try {
      const actions = await storage.getAllActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  app.get("/api/goals/:goalId/actions", async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const actions = await storage.getActionsByGoal(goalId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  app.post("/api/actions", async (req, res) => {
    try {
      console.log("Received action data:", req.body);
      const actionData = insertActionSchema.parse(req.body);
      console.log("Parsed action data:", actionData);
      const action = await storage.createAction(actionData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Zod validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid action data", details: error.errors });
      }
      console.log("Action creation error:", error);
      res.status(500).json({ error: "Failed to create action" });
    }
  });

  app.patch("/api/actions/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const action = await storage.getAction(id);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }

      // Mark action as completed
      const updatedAction = await storage.updateAction(id, {
        isCompleted: true,
        completedAt: new Date(),
      });

      // Update goal XP and last watered
      const goal = await storage.getGoal(action.goalId);
      if (goal) {
        const newXP = goal.currentXP + action.xpReward;
        const newLevel = Math.floor(newXP / goal.maxXP) + 1;
        
        await storage.updateGoal(action.goalId, {
          currentXP: newXP % goal.maxXP,
          currentLevel: Math.max(goal.currentLevel, newLevel),
          lastWatered: new Date(),
        });
      }

      res.json(updatedAction);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete action" });
    }
  });

  app.delete("/api/actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAction(id);
      if (!deleted) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete action" });
    }
  });

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const achievementData = insertAchievementSchema.parse(req.body);
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid achievement data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create achievement" });
    }
  });

  // Health check for withering trees
  app.post("/api/goals/check-health", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      const now = new Date();
      const updatedGoals = [];

      for (const goal of goals) {
        if (goal.status === 'active') {
          const hoursSinceWatered = (now.getTime() - goal.lastWatered.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceWatered > 168) { // 7 days = 168 hours
            await storage.updateGoal(goal.id, { status: 'withered' });
            updatedGoals.push({ ...goal, status: 'withered' });
          } else if (hoursSinceWatered > 72) { // 3 days = 72 hours
            updatedGoals.push({ ...goal, needsAttention: true });
          }
        }
      }

      res.json({ updatedGoals });
    } catch (error) {
      res.status(500).json({ error: "Failed to check tree health" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
