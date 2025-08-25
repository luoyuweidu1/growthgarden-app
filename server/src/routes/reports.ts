import express from 'express';
import { prisma } from '../utils/database.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

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
    const aiAnalysis = await generateAIAnalysis(weekActions, weekHabits, userGoals);
    
    // Create accomplishments summary
    const totalXP = weekActions.reduce((sum, action) => sum + action.xpReward, 0);
    const totalActions = weekActions.length;
    
    // Calculate streak (simplified - consecutive days with completed actions)
    const streak = calculateStreak(weekActions);
    
    // Create story based on accomplishments
    const story = generateAccomplishmentStory(weekActions, weekHabits, userGoals);

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
    const aiAnalysis = await generateAIAnalysis(weekActions, weekHabits, userGoals);
    
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
async function generateAIAnalysis(actions: any[], habits: any[], goals: any[]) {
  // This is where you'd integrate with an AI service like OpenAI
  // For now, generating intelligent mock data based on actual user data
  
  const actionsByGoal = actions.reduce((acc, action) => {
    const goalName = action.goal?.name || 'Unknown Goal';
    if (!acc[goalName]) acc[goalName] = [];
    acc[goalName].push(action);
    return acc;
  }, {} as Record<string, any[]>);

  const habitStats = {
    exerciseDays: habits.filter(h => h.exercise).length,
    healthyEatingDays: habits.filter(h => h.eatHealthy).length,
    goodSleepDays: habits.filter(h => h.sleepBefore11pm).length,
    totalDays: habits.length,
  };

  // Generate insights based on actual data
  const insights = [];
  const patterns = [];
  const recommendations = [];

  if (actions.length > 0) {
    const avgXpPerAction = actions.reduce((sum, a) => sum + a.xpReward, 0) / actions.length;
    insights.push(`You completed ${actions.length} actions this week, earning an average of ${Math.round(avgXpPerAction)} XP per action.`);
    
    const mostActiveGoal = Object.entries(actionsByGoal).reduce((max, [goal, actions]) => 
      actions.length > (max.actions?.length || 0) ? { goal, actions } : max, {}
    );
    
    if (mostActiveGoal.goal) {
      insights.push(`You were most active in "${mostActiveGoal.goal}" with ${mostActiveGoal.actions.length} completed actions.`);
    }
  }

  if (habitStats.totalDays > 0) {
    const exerciseRate = Math.round((habitStats.exerciseDays / habitStats.totalDays) * 100);
    const eatingRate = Math.round((habitStats.healthyEatingDays / habitStats.totalDays) * 100);
    const sleepRate = Math.round((habitStats.goodSleepDays / habitStats.totalDays) * 100);
    
    insights.push(`Your healthy habits: ${exerciseRate}% exercise, ${eatingRate}% healthy eating, ${sleepRate}% good sleep.`);
  }

  // Generate patterns
  if (actions.length > 3) {
    patterns.push("You show consistent action-taking behavior throughout the week");
  }
  
  if (habitStats.exerciseDays >= 3) {
    patterns.push("Strong exercise routine with regular physical activity");
  }

  // Generate recommendations
  if (habitStats.exerciseDays < 3) {
    recommendations.push("Try to incorporate more physical activity into your routine");
  }
  
  if (actions.length < 7) {
    recommendations.push("Consider breaking larger goals into smaller, daily actions");
  }

  return {
    insights: insights.length > 0 ? insights : ["Keep building your growth habits - every small step counts!"],
    patterns: patterns.length > 0 ? patterns : ["Building foundation for consistent growth"],
    recommendations: recommendations.length > 0 ? recommendations : ["Continue your current momentum and celebrate small wins"],
    positivePatterns: generatePositivePatterns(actions, habits),
    negativePatterns: generateNegativePatterns(actions, habits),
    growthAreas: generateGrowthAreas(actions, habits, goals),
  };
}

function generatePositivePatterns(actions: any[], habits: any[]): string {
  const positives = [];
  
  if (actions.length > 0) {
    positives.push(`Completed ${actions.length} meaningful actions`);
  }
  
  const exerciseDays = habits.filter(h => h.exercise).length;
  if (exerciseDays >= 3) {
    positives.push(`Maintained exercise routine ${exerciseDays} days`);
  }
  
  const healthyEatingDays = habits.filter(h => h.eatHealthy).length;
  if (healthyEatingDays >= 4) {
    positives.push(`Strong healthy eating habits ${healthyEatingDays} days`);
  }

  return positives.length > 0 
    ? positives.join('. ') + '. Your consistency is building strong foundations for growth!'
    : 'You\'re taking steps toward your goals - keep building momentum!';
}

function generateNegativePatterns(actions: any[], habits: any[]): string {
  const areas = [];
  
  const exerciseDays = habits.filter(h => h.exercise).length;
  if (exerciseDays < 2) {
    areas.push('physical activity could be increased');
  }
  
  const sleepDays = habits.filter(h => h.sleepBefore11pm).length;
  if (sleepDays < 3) {
    areas.push('sleep schedule needs attention');
  }
  
  if (actions.length < 3) {
    areas.push('action completion rate could be improved');
  }

  return areas.length > 0 
    ? `Areas for improvement: ${areas.join(', ')}. Small changes in these areas can lead to big improvements!`
    : 'No significant negative patterns detected. Keep up the great work!';
}

function generateGrowthAreas(actions: any[], habits: any[], goals: any[]): string {
  const suggestions = [];
  
  if (goals.length > actions.length) {
    suggestions.push('Focus on breaking goals into smaller, actionable steps');
  }
  
  const habitStrength = habits.reduce((sum, h) => 
    (h.exercise ? 1 : 0) + (h.eatHealthy ? 1 : 0) + (h.sleepBefore11pm ? 1 : 0), 0
  );
  
  if (habitStrength < habits.length * 2) {
    suggestions.push('Building stronger daily routines will accelerate your progress');
  }
  
  if (actions.length > 0) {
    const avgXP = actions.reduce((sum, a) => sum + a.xpReward, 0) / actions.length;
    if (avgXP < 15) {
      suggestions.push('Consider tackling some higher-impact actions for greater growth');
    }
  }

  return suggestions.length > 0 
    ? suggestions.join('. ') + '. Focus on these areas to unlock your next level of growth!'
    : 'You\'re showing strong growth across all areas. Continue this momentum and consider setting more ambitious goals!';
}

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

function generateAccomplishmentStory(actions: any[], habits: any[], goals: any[]): string {
  if (actions.length === 0 && habits.length === 0) {
    return "This week is a new beginning. Every journey starts with a single step - yours is about to begin!";
  }
  
  const stories = [];
  
  if (actions.length > 0) {
    const totalXP = actions.reduce((sum, a) => sum + a.xpReward, 0);
    stories.push(`You've taken ${actions.length} meaningful actions, earning ${totalXP} XP toward your goals`);
  }
  
  const exerciseDays = habits.filter(h => h.exercise).length;
  const healthyDays = habits.filter(h => h.eatHealthy).length;
  const sleepDays = habits.filter(h => h.sleepBefore11pm).length;
  
  if (exerciseDays + healthyDays + sleepDays > 0) {
    stories.push(`strengthened your foundation with ${exerciseDays + healthyDays + sleepDays} healthy habit completions`);
  }
  
  return stories.length > 0 
    ? stories.join(' and ') + ". Each step forward is building the person you're becoming!"
    : "Every expert was once a beginner. Your growth journey is just getting started!";
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