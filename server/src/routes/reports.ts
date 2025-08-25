import express from 'express';
import { prisma } from '../utils/database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { generateAIAnalysis } from '../utils/ai.js';

const router = express.Router();

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  feelingDistribution: {
    feeling: string;
    emoji: string;
    count: number;
    percentage: number;
    actions: string[];
  }[];
  accomplishments: {
    totalActions: number;
    totalXP: number;
    achievements: string[];
    streak: number;
    story: string;
  };
  learningSummary: {
    insights: string[];
    patterns: string[];
    recommendations: string[];
  };
  aiAnalysis: {
    positivePatterns: string;
    negativePatterns: string;
    growthAreas: string;
  };
}

// Get or generate weekly reflection report
const generateWeeklyReport = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user!.id;
    
    // Calculate week range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    // Get completed actions from the past week
    const weekActions = await prisma.action.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        goal: {
          select: {
            name: true,
            plantType: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Get daily habits from the past week
    const weekHabits = await prisma.dailyHabit.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get user's goals for context
    const userGoals = await prisma.goal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        plantType: true,
        currentLevel: true,
        currentXP: true,
      },
    });

    // Generate AI analysis
    const aiAnalysis = await generateAIAnalysis({
      actions: weekActions,
      habits: weekHabits,
      goals: userGoals
    });
    
    // Create accomplishments summary
    const totalXP = weekActions.reduce((sum, action) => sum + action.xpReward, 0);
    const totalActions = weekActions.length;
    
    // Calculate streak (simplified - consecutive days with completed actions)
    const streak = calculateStreak(weekActions);
    
    // Use AI-generated story
    const story = aiAnalysis.accomplishmentStory;

    // Mock feeling distribution (since we don't have reflection data yet)
    const feelingDistribution = generateMockFeelingDistribution(weekActions);

    const report: WeeklyReport = {
      weekStart: startDate.toISOString(),
      weekEnd: endDate.toISOString(),
      feelingDistribution,
      accomplishments: {
        totalActions,
        totalXP,
        achievements: weekActions.slice(0, 5).map(action => action.title),
        streak,
        story,
      },
      learningSummary: {
        insights: aiAnalysis.insights,
        patterns: aiAnalysis.patterns,
        recommendations: aiAnalysis.recommendations,
      },
      aiAnalysis: {
        positivePatterns: aiAnalysis.positivePatterns,
        negativePatterns: aiAnalysis.negativePatterns,
        growthAreas: aiAnalysis.growthAreas,
      },
    };

    res.json(report);
  } catch (error) {
    console.error('Weekly reflection error:', error);
    res.status(500).json({ error: 'Failed to generate weekly reflection' });
  }
};

// Both GET and POST support for weekly reflection
router.get('/weekly-reflection', authenticateToken, generateWeeklyReport);
router.post('/weekly-reflection', authenticateToken, generateWeeklyReport);

// Regenerate AI insights
router.post('/regenerate-insights', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get fresh data for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const weekActions = await prisma.action.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        goal: {
          select: {
            name: true,
            plantType: true,
          },
        },
      },
    });

    const weekHabits = await prisma.dailyHabit.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const userGoals = await prisma.goal.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        plantType: true,
        currentLevel: true,
        currentXP: true,
      },
    });

    // Generate fresh AI analysis
    const aiAnalysis = await generateAIAnalysis({
      actions: weekActions,
      habits: weekHabits,
      goals: userGoals
    });
    
    res.json({
      success: true,
      aiAnalysis: {
        positivePatterns: aiAnalysis.positivePatterns,
        negativePatterns: aiAnalysis.negativePatterns,
        growthAreas: aiAnalysis.growthAreas,
      },
      learningSummary: {
        insights: aiAnalysis.insights,
        patterns: aiAnalysis.patterns,
        recommendations: aiAnalysis.recommendations,
      },
    });
  } catch (error) {
    console.error('Regenerate insights error:', error);
    res.status(500).json({ error: 'Failed to regenerate AI insights' });
  }
});

// Helper functions

function calculateStreak(actions: any[]): number {
  if (actions.length === 0) return 0;
  
  // Simple streak calculation based on consecutive days with actions
  const actionDates = actions.map(a => new Date(a.completedAt).toDateString());
  const uniqueDates = [...new Set(actionDates)].sort();
  
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i]);
    const previous = new Date(uniqueDates[i - 1]);
    const dayDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return Math.min(streak, uniqueDates.length);
}


function generateMockFeelingDistribution(actions: any[]) {
  // Generate realistic feeling distribution based on actions
  const feelings = [
    { feeling: "Accomplished", emoji: "💪", baseWeight: 30 },
    { feeling: "Happy", emoji: "😊", baseWeight: 25 },
    { feeling: "Confident", emoji: "😎", baseWeight: 20 },
    { feeling: "Grateful", emoji: "😇", baseWeight: 15 },
    { feeling: "Thoughtful", emoji: "🤔", baseWeight: 10 },
  ];
  
  const totalActions = actions.length;
  if (totalActions === 0) {
    return feelings.map(f => ({
      ...f,
      count: 0,
      percentage: 0,
      actions: [],
    }));
  }
  
  return feelings.map(feeling => {
    const count = Math.max(1, Math.floor((feeling.baseWeight / 100) * totalActions));
    const percentage = Math.round((count / totalActions) * 100);
    const actionSample = actions.slice(0, count).map(a => a.title);
    
    return {
      feeling: feeling.feeling,
      emoji: feeling.emoji,
      count,
      percentage,
      actions: actionSample,
    };
  });
}

export default router;