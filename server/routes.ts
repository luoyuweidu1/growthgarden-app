import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { insertGoalSchema, insertActionSchema, insertAchievementSchema, insertDailyHabitSchema } from "@shared/schema";
import { z } from "zod";
import { authenticateUser } from "./auth.js";

// Helper functions for weekly reflection report
function getFeelingEmoji(feeling: string): string {
  const emojiMap: Record<string, string> = {
    "Happy": "😊",
    "Excited": "🎉",
    "Relaxed": "😌",
    "Accomplished": "💪",
    "Relieved": "😌",
    "Confident": "😎",
    "Thoughtful": "🤔",
    "Tired": "😴",
    "Stressed": "😅",
    "Frustrated": "😤",
    "Grateful": "😇",
    "Proud": "🤗",
  };
  return emojiMap[feeling] || "😊";
}

async function generateAIAnalysis(weeklyActions: any[], feelingDistribution: any[]) {
  const positiveFeelings = ["Happy", "Excited", "Accomplished", "Confident", "Proud", "Grateful"];
  const negativeFeelings = ["Tired", "Stressed", "Frustrated"];
  
  const positiveActions = weeklyActions.filter(action => 
    action.feeling && positiveFeelings.includes(action.feeling)
  );
  const negativeActions = weeklyActions.filter(action => 
    action.feeling && negativeFeelings.includes(action.feeling)
  );

  // Prepare data for OpenAI analysis
  const analysisData = {
    totalActions: weeklyActions.length,
    feelingDistribution: feelingDistribution.map(f => ({
      feeling: f.feeling,
      count: f.count,
      percentage: f.percentage,
      actions: f.actions
    })),
    positiveActions: positiveActions.map(a => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      difficulty: a.difficulty,
      reflection: a.reflection
    })),
    negativeActions: negativeActions.map(a => ({
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
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
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

  // Fallback analysis if OpenAI fails
  let positivePatterns = "You've been feeling great about tasks that involve ";
  if (positiveActions.length > 0) {
    const commonThemes = positiveActions.map(a => a.title.toLowerCase()).slice(0, 3);
    positivePatterns += commonThemes.join(", ") + ". These activities seem to energize and motivate you.";
  } else {
    positivePatterns = "You've been maintaining a positive outlook on your tasks this week.";
  }

  let negativePatterns = "Tasks that made you feel challenged include ";
  if (negativeActions.length > 0) {
    const commonThemes = negativeActions.map(a => a.title.toLowerCase()).slice(0, 3);
    negativePatterns += commonThemes.join(", ") + ". Consider breaking these down into smaller steps or adjusting your approach.";
  } else {
    negativePatterns = "You've been handling challenges well this week with minimal stress.";
  }

  const growthAreas = "Focus on building consistency with activities that make you feel accomplished, and consider what made those experiences particularly rewarding.";

  return { positivePatterns, negativePatterns, growthAreas };
}

async function generateLearningSummary(weeklyActions: any[], feelingDistribution: any[]) {
  // Prepare comprehensive data for OpenAI
  const summaryData = {
    weekStats: {
      totalActions: weeklyActions.length,
      totalXP: weeklyActions.reduce((sum, a) => sum + a.xpReward, 0),
      averageSatisfaction: weeklyActions.reduce((sum, a) => sum + (a.satisfaction || 3), 0) / weeklyActions.length,
      averageDifficulty: weeklyActions.reduce((sum, a) => sum + (a.difficulty || 3), 0) / weeklyActions.length
    },
    feelingBreakdown: feelingDistribution.map(f => ({
      feeling: f.feeling,
      count: f.count,
      percentage: f.percentage,
      actions: f.actions
    })),
    actionDetails: weeklyActions.map(a => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      difficulty: a.difficulty,
      reflection: a.reflection,
      xpReward: a.xpReward
    })),
    reflections: weeklyActions.filter(a => a.reflection).map(a => a.reflection)
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
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
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

  // Fallback analysis if OpenAI fails
  const insights: string[] = [];
  const patterns: string[] = [];
  const recommendations: string[] = [];

  // Generate insights based on feeling distribution
  if (feelingDistribution.length > 0) {
    const topFeeling = feelingDistribution[0];
    insights.push(`You felt ${topFeeling.feeling.toLowerCase()} most often this week (${topFeeling.percentage}% of the time).`);
    
    if (topFeeling.percentage > 50) {
      insights.push("You're maintaining a consistent positive emotional state across your tasks.");
    }
  }

  // Generate patterns based on action types
  const actionTypes = weeklyActions.map(a => a.title.toLowerCase());
  const commonWords = actionTypes.join(" ").split(" ").filter(word => word.length > 3);
  const wordCounts: Record<string, number> = {};
  commonWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  const frequentWords = Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  if (frequentWords.length > 0) {
    patterns.push(`You've been focusing on activities related to: ${frequentWords.join(", ")}.`);
  }

  // Generate recommendations
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

async function generateAchievementStory(weeklyActions: any[], achievements: any[], totalXP: number, streak: number) {
  // Prepare data for OpenAI
  const storyData = {
    weekStats: {
      totalActions: weeklyActions.length,
      totalXP: totalXP,
      streak: streak,
      achievements: achievements.map(a => a.title)
    },
    actionHighlights: weeklyActions.map(a => ({
      title: a.title,
      feeling: a.feeling,
      satisfaction: a.satisfaction,
      reflection: a.reflection,
      xpReward: a.xpReward
    })),
    topFeelings: weeklyActions
      .filter(a => a.feeling)
      .reduce((acc, action) => {
        acc[action.feeling] = (acc[action.feeling] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  };

  const systemMessage = `You are a motivational storyteller who creates engaging, personal narratives about someone's weekly achievements. Write in a warm, encouraging tone that celebrates their progress and makes them feel proud of their accomplishments. Focus on the journey, the emotions, and the growth.`;

  const prompt = `Create an engaging story about this person's weekly achievements in JSON format with one field:
1. story: A compelling 2-3 paragraph narrative that tells the story of their week, highlighting their accomplishments, feelings, and growth. Make it personal, motivational, and story-like.

Data: ${JSON.stringify(storyData, null, 2)}

Respond with only valid JSON containing the story field.`;

  const aiResponse = await callOpenAI(prompt, systemMessage);
  
  if (aiResponse) {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return parsed.story || generateFallbackStory(weeklyActions, achievements, totalXP, streak);
    } catch (error) {
      console.error("Failed to parse OpenAI achievement story response:", error);
      console.error("Raw response:", aiResponse);
      return generateFallbackStory(weeklyActions, achievements, totalXP, streak);
    }
  }

  return generateFallbackStory(weeklyActions, achievements, totalXP, streak);
}

function generateFallbackStory(weeklyActions: any[], achievements: any[], totalXP: number, streak: number) {
  const actionCount = weeklyActions.length;
  const achievementCount = achievements.length;
  
  let story = `This week, you've been on an incredible journey of growth and self-discovery. `;
  
  if (actionCount > 0) {
    story += `You completed ${actionCount} meaningful actions, each one a step forward in your personal development. `;
  }
  
  if (totalXP > 0) {
    story += `With ${totalXP} XP earned, you've built up significant momentum in your growth garden. `;
  }
  
  if (achievementCount > 0) {
    story += `Your dedication has been recognized with ${achievementCount} new achievement${achievementCount > 1 ? 's' : ''}, marking important milestones in your journey. `;
  }
  
  if (streak > 0) {
    story += `You've maintained a ${streak}-day streak, showing remarkable consistency and commitment to your goals. `;
  }
  
  story += `Every action you take, every reflection you make, and every feeling you acknowledge is part of your unique story of growth. You're not just completing tasks—you're building a life of intention and purpose.`;
  
  return story;
}

// Achievement checking function
async function checkAndCreateAchievements(storage: any) {
  try {
    console.log("Checking for achievements...");
    const allActions = await storage.getAllActions();
    const allGoals = await storage.getGoals();
    const existingAchievements = await storage.getAchievements();
    
    const completedActions = allActions.filter(action => action.isCompleted);
    const totalActions = allActions.length;
    const totalGoals = allGoals.length;
    const activeGoals = allGoals.filter(goal => goal.status === 'active').length;
    
    console.log("Current stats:", {
      completedActions: completedActions.length,
      totalActions,
      totalGoals,
      activeGoals,
      existingAchievements: existingAchievements.length
    });
    
    // Define achievement criteria
    const achievementCriteria = [
      {
        id: 'first-action',
        title: 'First Step',
        description: 'Completed your first action',
        iconName: '🌱',
        condition: () => completedActions.length === 1
      },
      {
        id: 'action-streak',
        title: 'Action Hero',
        description: 'Completed 5 actions',
        iconName: '⚡',
        condition: () => completedActions.length >= 5
      },
      {
        id: 'goal-setter',
        title: 'Goal Setter',
        description: 'Created your first goal',
        iconName: '🎯',
        condition: () => totalGoals >= 1
      },
      {
        id: 'multi-goal',
        title: 'Multi-Tasker',
        description: 'Created 3 goals',
        iconName: '🌳',
        condition: () => totalGoals >= 3
      },
      {
        id: 'level-up',
        title: 'Level Up!',
        description: 'Reached level 2 with any goal',
        iconName: '📈',
        condition: () => allGoals.some(goal => goal.currentLevel >= 2)
      },
      {
        id: 'master-gardener',
        title: 'Master Gardener',
        description: 'Reached level 5 with any goal',
        iconName: '👑',
        condition: () => allGoals.some(goal => goal.currentLevel >= 5)
      },
      {
        id: 'consistency',
        title: 'Consistency King',
        description: 'Completed 10 actions',
        iconName: '🔥',
        condition: () => completedActions.length >= 10
      },
      {
        id: 'variety',
        title: 'Variety Seeker',
        description: 'Created goals of different plant types',
        iconName: '🌺',
        condition: () => {
          const plantTypes = new Set(allGoals.map(goal => goal.plantType));
          return plantTypes.size >= 3;
        }
      }
    ];

    // Check each achievement criterion
    for (const criterion of achievementCriteria) {
      const alreadyUnlocked = existingAchievements.some(achievement => 
        achievement.title === criterion.title
      );
      
      console.log(`Checking ${criterion.title}:`, {
        alreadyUnlocked,
        conditionMet: criterion.condition()
      });
      
      if (!alreadyUnlocked && criterion.condition()) {
        console.log(`Creating achievement: ${criterion.title}`);
        await storage.createAchievement({
          title: criterion.title,
          description: criterion.description,
          iconName: criterion.iconName,
        });
      }
    }
    
    console.log("Achievement check completed");
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

// OpenAI API integration
async function callOpenAI(prompt: string, systemMessage: string = "") {
  // Read environment variables at runtime
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  // Debug logging
  console.log("🔍 OpenAI API Key check:");
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
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
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
        temperature: 0.7,
      }),
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

export async function registerRoutes(app: express.Express): Promise<Server> {
  const storage = app.locals.storage;
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", message: "API is healthy" });
  });
  
  // Goals routes - require authentication
  app.get("/api/goals", authenticateUser, async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", authenticateUser, async (req, res) => {
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

  app.post("/api/goals", authenticateUser, async (req, res) => {
    try {
      const goalData = insertGoalSchema.parse({
        ...req.body,
        userId: (req as any).userId
      });
      const goal = await storage.createGoal(goalData);
      
      // Check for achievements to unlock
      await checkAndCreateAchievements(storage);
      
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid goal data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", authenticateUser, async (req, res) => {
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

  app.delete("/api/goals/:id", authenticateUser, async (req, res) => {
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

  // Actions routes - require authentication
  app.get("/api/actions", authenticateUser, async (req, res) => {
    try {
      const actions = await storage.getAllActions();
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  app.get("/api/goals/:goalId/actions", authenticateUser, async (req, res) => {
    try {
      const goalId = parseInt(req.params.goalId);
      const actions = await storage.getActionsByGoal(goalId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch actions" });
    }
  });

  app.post("/api/actions", authenticateUser, async (req, res) => {
    try {
      console.log("Received action data:", req.body);
      const actionData = insertActionSchema.parse({
        ...req.body,
        userId: (req as any).userId
      });
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

  app.patch("/api/actions/:id/complete", authenticateUser, async (req, res) => {
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

      // Check for achievements to unlock
      await checkAndCreateAchievements(storage);

      res.json(updatedAction);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete action" });
    }
  });

  app.patch("/api/actions/:id/reflection", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const action = await storage.getAction(id);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }

      const { feeling, reflection, difficulty, satisfaction, reflectedAt } = req.body;
      
      const updatedAction = await storage.updateAction(id, {
        feeling,
        reflection,
        difficulty,
        satisfaction,
        reflectedAt: reflectedAt ? new Date(reflectedAt) : new Date(),
      });

      res.json(updatedAction);
    } catch (error) {
      res.status(500).json({ error: "Failed to save reflection" });
    }
  });

  app.delete("/api/actions/:id", authenticateUser, async (req, res) => {
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
  app.get("/api/achievements", authenticateUser, async (req, res) => {
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

  // Manual achievement check endpoint
  app.post("/api/achievements/check", authenticateUser, async (req, res) => {
    try {
      await checkAndCreateAchievements(storage);
      res.json({ message: "Achievements checked", achievements: await storage.getAchievements() });
    } catch (error) {
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Daily Habits routes
  app.get("/api/daily-habits/:date", authenticateUser, async (req, res) => {
    try {
      const { date } = req.params;
      const habit = await storage.getDailyHabit(date);
      res.json(habit || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily habit" });
    }
  });

  app.get("/api/daily-habits", authenticateUser, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      const habits = await storage.getDailyHabits(startDate as string, endDate as string);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily habits" });
    }
  });

  app.post("/api/daily-habits", authenticateUser, async (req, res) => {
    try {
      const habitData = insertDailyHabitSchema.parse({
        ...req.body,
        userId: (req as any).userId
      });
      const habit = await storage.createDailyHabit(habitData);
      res.status(201).json(habit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid habit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create daily habit" });
    }
  });

  app.patch("/api/daily-habits/:date", authenticateUser, async (req, res) => {
    try {
      const { date } = req.params;
      const updates = req.body;
      const habit = await storage.updateDailyHabit(date, updates);
      if (!habit) {
        return res.status(404).json({ error: "Daily habit not found" });
      }
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update daily habit" });
    }
  });

  // Weekly Reflection Report endpoints
  app.get("/api/reports/weekly-reflection", async (req, res) => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);

      // Get all actions with reflections from the past week
      const allActions = await storage.getAllActions();
      const weeklyActions = allActions.filter((action: any) => 
        action.isCompleted && 
        action.reflectedAt && 
        new Date(action.reflectedAt) >= weekStart && 
        new Date(action.reflectedAt) <= weekEnd
      );

      if (weeklyActions.length === 0) {
        return res.json(null); // No data for the week
      }

      // Calculate feeling distribution
      const feelingCounts: Record<string, { count: number; actions: string[] }> = {};
      weeklyActions.forEach((action: any) => {
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
        percentage: Math.round((data.count / totalReflections) * 100),
        actions: data.actions
      }));

      // Calculate accomplishments
      const totalXP = weeklyActions.reduce((sum: number, action: any) => sum + action.xpReward, 0);
      const achievements = await storage.getAchievements();
      const weeklyAchievements = achievements.filter(achievement => {
        // This is a simplified check - in a real app you'd track when achievements were unlocked
        return true; // For demo purposes, show all achievements
      });

      // Calculate streak (simplified - in real app you'd track daily completion)
      const streak = Math.min(7, weeklyActions.length);

      // Generate AI analysis
      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);

      // Generate learning summary
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);

      // Generate achievement story
      const achievementStory = await generateAchievementStory(weeklyActions, weeklyAchievements, totalXP, streak);

      const report = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: weeklyAchievements.map(a => a.title),
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

  app.post("/api/reports/weekly-reflection", async (req, res) => {
    try {
      // This endpoint triggers the report generation
      // In a real app, you might want to cache this or generate it asynchronously
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const allActions = await storage.getAllActions();
      const weeklyActions = allActions.filter((action: any) => 
        action.isCompleted && 
        action.reflectedAt && 
        new Date(action.reflectedAt) >= weekStart && 
        new Date(action.reflectedAt) <= weekEnd
      );

      if (weeklyActions.length === 0) {
        return res.json({ message: "No reflection data available for this week" });
      }

      // Generate the same report as GET endpoint
      const feelingCounts: Record<string, { count: number; actions: string[] }> = {};
      weeklyActions.forEach((action: any) => {
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
        percentage: Math.round((data.count / totalReflections) * 100),
        actions: data.actions
      }));

      const totalXP = weeklyActions.reduce((sum: number, action: any) => sum + action.xpReward, 0);
      const achievements = await storage.getAchievements();
      const streak = Math.min(7, weeklyActions.length);

      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);
      const achievementStory = await generateAchievementStory(weeklyActions, achievements, totalXP, streak);

      const report = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: achievements.map(a => a.title),
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

  app.post("/api/reports/regenerate-insights", async (req, res) => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const allActions = await storage.getAllActions();
      const weeklyActions = allActions.filter((action: any) => 
        action.isCompleted && 
        action.reflectedAt && 
        new Date(action.reflectedAt) >= weekStart && 
        new Date(action.reflectedAt) <= weekEnd
      );

      if (weeklyActions.length === 0) {
        return res.json({ message: "No reflection data available for this week" });
      }

      // Calculate feeling distribution
      const feelingCounts: Record<string, { count: number; actions: string[] }> = {};
      weeklyActions.forEach((action: any) => {
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
        percentage: Math.round((data.count / totalReflections) * 100),
        actions: data.actions
      }));

      // Calculate accomplishments
      const totalXP = weeklyActions.reduce((sum: number, action: any) => sum + action.xpReward, 0);
      const achievements = await storage.getAchievements();
      const weeklyAchievements = achievements.filter(achievement => {
        return true; // For demo purposes, show all achievements
      });

      const streak = Math.min(7, weeklyActions.length);

      // Regenerate AI analysis with latest data
      const aiAnalysis = await generateAIAnalysis(weeklyActions, feelingDistribution);
      const learningSummary = await generateLearningSummary(weeklyActions, feelingDistribution);

      const report = {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        feelingDistribution,
        accomplishments: {
          totalActions: weeklyActions.length,
          totalXP,
          achievements: weeklyAchievements.map(a => a.title),
          streak
        },
        learningSummary,
        aiAnalysis
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to regenerate insights" });
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
