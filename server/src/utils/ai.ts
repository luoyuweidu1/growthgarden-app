import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface WeeklyData {
  actions: any[];
  habits: any[];
  goals: any[];
}

interface AIAnalysis {
  insights: string[];
  patterns: string[];
  recommendations: string[];
  positivePatterns: string;
  negativePatterns: string;
  growthAreas: string;
  accomplishmentStory: string;
}

export async function generateAIAnalysis(data: WeeklyData): Promise<AIAnalysis> {
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using fallback analysis');
    return generateFallbackAnalysis(data);
  }

  try {
    const { actions, habits, goals } = data;
    
    // Prepare data summary for AI
    const dataSummary = {
      totalActionsCompleted: actions.length,
      totalXP: actions.reduce((sum, a) => sum + a.xpReward, 0),
      actionsByGoal: actions.reduce((acc, action) => {
        const goalName = action.goal?.name || 'Unknown Goal';
        if (!acc[goalName]) acc[goalName] = [];
        acc[goalName].push({
          title: action.title,
          xp: action.xpReward,
          completedAt: action.completedAt
        });
        return acc;
      }, {} as Record<string, any[]>),
      habitStats: {
        exerciseDays: habits.filter(h => h.exercise).length,
        healthyEatingDays: habits.filter(h => h.eatHealthy).length,
        goodSleepDays: habits.filter(h => h.sleepBefore11pm).length,
        totalDays: habits.length,
      },
      userGoals: goals.map(g => ({ name: g.name, level: g.currentLevel, xp: g.currentXP }))
    };

    const systemPrompt = `You are a personal growth coach and AI assistant for GrowthGarden, a habit and goal tracking app. 
    
    Your role is to provide encouraging, insightful, and actionable analysis of a user's weekly progress. Your tone should be:
    - Encouraging and positive, celebrating all progress
    - Insightful, finding meaningful patterns in the data
    - Actionable, providing specific next steps
    - Personal and warm, like a supportive coach
    
    The user has a gardening/growth metaphor for their goals (goals are plants that grow with XP/watering).
    
    Please analyze the data and provide responses in the exact JSON format requested.`;

    const analysisPrompt = `Based on this weekly data, provide a comprehensive analysis:

    ${JSON.stringify(dataSummary, null, 2)}

    Please provide a JSON response with exactly these fields:
    {
      "insights": ["insight 1", "insight 2", "insight 3"],
      "patterns": ["pattern 1", "pattern 2"],
      "recommendations": ["recommendation 1", "recommendation 2"],
      "positivePatterns": "A paragraph about positive patterns observed",
      "negativePatterns": "A paragraph about areas that need attention (phrase constructively)",
      "growthAreas": "A paragraph about specific areas for growth and improvement",
      "accomplishmentStory": "A warm, encouraging story about their week's accomplishments (2-3 sentences)"
    }

    Guidelines:
    - Keep insights specific to their actual data
    - Make recommendations actionable and specific
    - Use the gardening metaphor naturally when appropriate
    - Be encouraging about any level of progress
    - If they had minimal activity, focus on fresh starts and potential`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let analysis: AIAnalysis;
    try {
      analysis = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!analysis.insights || !analysis.positivePatterns || !analysis.accomplishmentStory) {
      throw new Error('AI response missing required fields');
    }

    return analysis;

  } catch (error) {
    console.error('AI analysis error:', error);
    console.warn('Falling back to rule-based analysis');
    return generateFallbackAnalysis(data);
  }
}

function generateFallbackAnalysis(data: WeeklyData): AIAnalysis {
  const { actions, habits, goals } = data;
  
  const habitStats = {
    exerciseDays: habits.filter(h => h.exercise).length,
    healthyEatingDays: habits.filter(h => h.eatHealthy).length,
    goodSleepDays: habits.filter(h => h.sleepBefore11pm).length,
    totalDays: habits.length,
  };

  const actionsByGoal = actions.reduce((acc, action) => {
    const goalName = action.goal?.name || 'Unknown Goal';
    if (!acc[goalName]) acc[goalName] = [];
    acc[goalName].push(action);
    return acc;
  }, {} as Record<string, any[]>);

  // Generate insights based on actual data
  const insights = [];
  const patterns = [];
  const recommendations = [];

  if (actions.length > 0) {
    const avgXpPerAction = actions.reduce((sum, a) => sum + a.xpReward, 0) / actions.length;
    insights.push(`You completed ${actions.length} actions this week, earning an average of ${Math.round(avgXpPerAction)} XP per action.`);
    
    const mostActiveGoal = Object.entries(actionsByGoal).reduce((max, [goal, actions]) => 
      actions.length > ((max as any).actions?.length || 0) ? { goal, actions } : max, {} as any
    );
    
    if ((mostActiveGoal as any).goal) {
      insights.push(`You were most active in "${(mostActiveGoal as any).goal}" with ${(mostActiveGoal as any).actions.length} completed actions.`);
    }
  } else {
    insights.push("This week is a fresh start - every expert was once a beginner!");
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

  if (habitStats.healthyEatingDays >= 4) {
    patterns.push("Excellent healthy eating habits forming");
  }

  // Generate recommendations
  if (habitStats.exerciseDays < 3) {
    recommendations.push("Try to incorporate more physical activity into your routine - even 15 minutes counts!");
  }
  
  if (actions.length < 7) {
    recommendations.push("Consider breaking larger goals into smaller, daily actions for consistent momentum");
  }

  if (habitStats.goodSleepDays < 3) {
    recommendations.push("Focus on improving your sleep schedule - it's the foundation for all other growth");
  }

  const positivePatterns = generatePositivePatternsText(actions, habitStats);
  const negativePatterns = generateNegativePatternsText(actions, habitStats);
  const growthAreas = generateGrowthAreasText(actions, habitStats, goals);
  const accomplishmentStory = generateAccomplishmentStoryText(actions, habitStats);

  return {
    insights: insights.length > 0 ? insights : ["Keep building your growth habits - every small step counts!"],
    patterns: patterns.length > 0 ? patterns : ["Building foundation for consistent growth"],
    recommendations: recommendations.length > 0 ? recommendations : ["Continue your current momentum and celebrate small wins"],
    positivePatterns,
    negativePatterns,
    growthAreas,
    accomplishmentStory,
  };
}

function generatePositivePatternsText(actions: any[], habitStats: any): string {
  const positives = [];
  
  if (actions.length > 0) {
    positives.push(`completed ${actions.length} meaningful actions`);
  }
  
  if (habitStats.exerciseDays >= 3) {
    positives.push(`maintained exercise routine ${habitStats.exerciseDays} days`);
  }
  
  if (habitStats.healthyEatingDays >= 4) {
    positives.push(`strong healthy eating habits ${habitStats.healthyEatingDays} days`);
  }

  return positives.length > 0 
    ? `This week you ${positives.join(', ')}. Your consistency is building strong foundations for growth like seeds taking root in fertile soil!`
    : 'You\'re planting seeds for future growth - every journey begins with preparation and intention!';
}

function generateNegativePatternsText(actions: any[], habitStats: any): string {
  const areas = [];
  
  if (habitStats.exerciseDays < 2) {
    areas.push('physical activity could be increased');
  }
  
  if (habitStats.goodSleepDays < 3) {
    areas.push('sleep schedule needs attention');
  }
  
  if (actions.length < 3) {
    areas.push('action completion rate could be improved');
  }

  return areas.length > 0 
    ? `Areas for growth: ${areas.join(', ')}. Think of these as opportunities to water different parts of your life garden - small, consistent care leads to beautiful growth!`
    : 'No significant areas of concern detected. Your growth garden is thriving - keep nurturing it!';
}

function generateGrowthAreasText(actions: any[], habitStats: any, goals: any[]): string {
  const suggestions = [];
  
  if (goals.length > actions.length * 2) {
    suggestions.push('focus on breaking goals into smaller, actionable steps');
  }
  
  const habitStrength = habitStats.exerciseDays + habitStats.healthyEatingDays + habitStats.goodSleepDays;
  const maxHabits = habitStats.totalDays * 3;
  
  if (habitStrength < maxHabits * 0.5) {
    suggestions.push('building stronger daily routines will accelerate your progress');
  }
  
  if (actions.length > 0) {
    const avgXP = actions.reduce((sum, a) => sum + a.xpReward, 0) / actions.length;
    if (avgXP < 15) {
      suggestions.push('consider tackling some higher-impact actions for greater growth');
    }
  }

  return suggestions.length > 0 
    ? `${suggestions.join('. ')}. Focus on these areas to unlock your next level of growth - like a gardener knowing exactly where to plant for the best harvest!`
    : 'You\'re showing strong growth across all areas. Consider setting more ambitious goals to match your growing capabilities!';
}

function generateAccomplishmentStoryText(actions: any[], habitStats: any): string {
  if (actions.length === 0 && habitStats.totalDays === 0) {
    return "This week marks the beginning of your growth journey. Like a seed planted in rich soil, your potential is limitless!";
  }
  
  const stories = [];
  
  if (actions.length > 0) {
    const totalXP = actions.reduce((sum, a) => sum + a.xpReward, 0);
    stories.push(`planted ${actions.length} seeds of progress, nurturing them with ${totalXP} XP`);
  }
  
  const totalHabits = habitStats.exerciseDays + habitStats.healthyEatingDays + habitStats.goodSleepDays;
  if (totalHabits > 0) {
    stories.push(`watered your foundation with ${totalHabits} healthy habit completions`);
  }
  
  return stories.length > 0 
    ? `This week, you ${stories.join(' and ')}. Your growth garden is flourishing with each intentional action!`
    : "Every master gardener started with their first seed. Your growth story is about to bloom!";
}

export type { AIAnalysis };