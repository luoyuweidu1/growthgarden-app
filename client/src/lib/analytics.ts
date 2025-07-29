import type { Goal, Action } from "@shared/schema";

export interface GrowthAnalytics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  witheredGoals: number;
  totalActions: number;
  completedActions: number;
  totalXP: number;
  averageGoalLevel: number;
  completionRate: number;
  activityStreaks: {
    current: number;
    longest: number;
  };
}

export interface DetailedGoalReport {
  goal: Goal;
  actions: Action[];
  actionCount: number;
  completedActionCount: number;
  totalXPFromActions: number;
  averageXPPerAction: number;
  completionRate: number;
  daysActive: number;
  lastActivityDate: Date | null;
}

export function calculateGrowthAnalytics(goals: Goal[], actions: Action[]): GrowthAnalytics {
  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const witheredGoals = goals.filter(g => g.status === 'withered').length;
  
  const totalActions = actions.length;
  const completedActions = actions.filter(a => a.isCompleted).length;
  const totalXP = actions.filter(a => a.isCompleted).reduce((sum, a) => sum + a.xpReward, 0);
  
  const averageGoalLevel = goals.length > 0 
    ? goals.reduce((sum, g) => sum + g.currentLevel, 0) / goals.length 
    : 0;
  
  const completionRate = totalActions > 0 
    ? Math.round((completedActions / totalActions) * 100) 
    : 0;

  // Calculate activity streaks
  const completedDates = actions
    .filter(a => a.isCompleted && a.completedAt)
    .map(a => new Date(a.completedAt!).toDateString())
    .sort();

  const uniqueDates = Array.from(new Set(completedDates));
  const { current, longest } = calculateStreaks(uniqueDates);

  return {
    totalGoals,
    activeGoals,
    completedGoals,
    witheredGoals,
    totalActions,
    completedActions,
    totalXP,
    averageGoalLevel: Math.round(averageGoalLevel * 10) / 10,
    completionRate,
    activityStreaks: { current, longest }
  };
}

export function generateDetailedGoalReport(goals: Goal[], actions: Action[]): DetailedGoalReport[] {
  return goals.map(goal => {
    const goalActions = actions.filter(a => a.goalId === goal.id);
    const completedActions = goalActions.filter(a => a.isCompleted);
    const totalXPFromActions = completedActions.reduce((sum, a) => sum + a.xpReward, 0);
    
    const lastActivityDate = goalActions.length > 0 
      ? new Date(Math.max(...goalActions.map(a => new Date(a.createdAt).getTime())))
      : null;
    
    const firstActivityDate = goalActions.length > 0
      ? new Date(Math.min(...goalActions.map(a => new Date(a.createdAt).getTime())))
      : null;
    
    const daysActive = firstActivityDate && lastActivityDate
      ? Math.ceil((lastActivityDate.getTime() - firstActivityDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    return {
      goal,
      actions: goalActions,
      actionCount: goalActions.length,
      completedActionCount: completedActions.length,
      totalXPFromActions,
      averageXPPerAction: goalActions.length > 0 
        ? Math.round((totalXPFromActions / goalActions.length) * 10) / 10 
        : 0,
      completionRate: goalActions.length > 0 
        ? Math.round((completedActions.length / goalActions.length) * 100) 
        : 0,
      daysActive,
      lastActivityDate
    };
  });
}

export function generateActivityTrends(actions: Action[], days: number = 30): Record<string, number> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const filteredActions = actions.filter(action => {
    const actionDate = new Date(action.createdAt);
    return actionDate >= startDate && actionDate <= endDate;
  });

  const activityByDay: Record<string, number> = {};
  
  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    activityByDay[date.toDateString()] = 0;
  }

  // Count actual activities
  filteredActions.forEach(action => {
    const day = new Date(action.createdAt).toDateString();
    activityByDay[day] = (activityByDay[day] || 0) + 1;
  });

  return activityByDay;
}

function calculateStreaks(sortedDates: string[]): { current: number; longest: number } {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  // Calculate longest streak
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak
  const lastActivityDate = sortedDates[sortedDates.length - 1];
  if (lastActivityDate === today || lastActivityDate === yesterdayStr) {
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const prevDate = new Date(sortedDates[i]);
      const nextDate = new Date(sortedDates[i + 1]);
      const dayDiff = Math.floor((nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

export function exportToCSV(data: any, type: 'summary' | 'detailed' | 'analytics'): string {
  switch (type) {
    case 'summary':
      return generateSummaryCSV(data);
    case 'detailed':
      return generateDetailedCSV(data);
    case 'analytics':
      return generateAnalyticsCSV(data);
    default:
      return '';
  }
}

function generateSummaryCSV(analytics: GrowthAnalytics): string {
  return `Growth Garden Summary Report
Generated,${new Date().toLocaleDateString()}

Metric,Value
Total Goals,${analytics.totalGoals}
Active Goals,${analytics.activeGoals}
Completed Goals,${analytics.completedGoals}
Withered Goals,${analytics.witheredGoals}
Total Actions,${analytics.totalActions}
Completed Actions,${analytics.completedActions}
Total XP Earned,${analytics.totalXP}
Average Goal Level,${analytics.averageGoalLevel}
Completion Rate,${analytics.completionRate}%
Current Streak,${analytics.activityStreaks.current} days
Longest Streak,${analytics.activityStreaks.longest} days`;
}

function generateDetailedCSV(report: DetailedGoalReport[]): string {
  const header = 'Goal Name,Plant Type,Level,XP,Status,Actions Count,Completed Actions,Total XP from Actions,Completion Rate,Days Active,Last Activity';
  
  const rows = report.map(item => {
    const lastActivity = item.lastActivityDate ? item.lastActivityDate.toLocaleDateString() : 'Never';
    return `"${item.goal.name}","${item.goal.plantType}",${item.goal.currentLevel},${item.goal.currentXP},"${item.goal.status}",${item.actionCount},${item.completedActionCount},${item.totalXPFromActions},${item.completionRate}%,${item.daysActive},"${lastActivity}"`;
  });

  return `Growth Garden Detailed Report
Generated,${new Date().toLocaleDateString()}

${header}
${rows.join('\n')}`;
}

function generateAnalyticsCSV(data: { analytics: GrowthAnalytics; trends: Record<string, number> }): string {
  const summarySection = generateSummaryCSV(data.analytics);
  
  const trendsHeader = '\n\nDaily Activity Trends\nDate,Actions Count';
  const trendsRows = Object.entries(data.trends)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, count]) => `"${new Date(date).toLocaleDateString()}",${count}`)
    .join('\n');

  return `${summarySection}${trendsHeader}
${trendsRows}`;
}