import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage, default to 'en'
    const savedLanguage = localStorage.getItem('growthgarden-language');
    return (savedLanguage as Language) || 'en';
  });

  const translations = {
    en: {
      // Navigation
      'nav.dailyStreak': 'Daily Streak',
      'nav.level': 'Level',
      'nav.gardener': 'Gardener',
      'nav.export': 'Export',
      'nav.weeklyReport': 'Weekly Report',
      'nav.signOut': 'Sign Out',
      
      // Welcome
      'welcome.title': 'Welcome to Growth Garden',
      'welcome.subtitle': 'Planting a garden of your own — a place where your insight, creativity, and passion could take root and bloom',
      
      // Stats
      'stats.activeGoals': 'Active Goals',
      'stats.completedToday': 'Completed Today',
      'stats.treesMature': 'Trees Mature',
      'stats.needAttention': 'Need Attention',
      
      // Actions
      'actions.plantGoal': 'Plant Goal',
      'actions.createAction': 'Create Action',
      'actions.viewAll': 'View All',
      'actions.completed': 'Completed',
      'actions.upcoming': 'Upcoming',
      'actions.noActions': 'No actions yet. Create your first action to get started!',
      'actions.todaysActions': 'Today\'s Actions',
      'actions.noScheduled': 'No actions scheduled for today',
      
      // Goals
      'goals.title': 'Your Growth Garden',
      'goals.noGoals': 'No goals planted yet. Plant your first goal to start growing!',
      'goals.checkAchievements': 'Check',
      'goals.checking': 'Checking...',
      'goals.deleteGoal': 'Delete Goal',
      'goals.deleteConfirmation': 'Are you sure you want to delete "{goalName}"? This will permanently remove the goal and all its associated actions from your garden. This action cannot be undone.',
      'goals.deleting': 'Deleting...',
      'goals.deleted': 'Goal deleted',
      'goals.deletedDescription': 'Your goal has been removed from your garden.',
      
      // Achievements
      'achievements.title': 'Recent Activity',
      'achievements.noActivity': 'Complete your first action to see activity here!',
      'achievements.goal': 'Goal',
      'achievements.completed': 'Completed',
      'achievements.feeling': 'Feeling',
      'achievements.satisfaction': 'Satisfaction',
      'achievements.reward': 'Reward',
      
      // Daily Habits
      'habits.eatHealthy': 'Eat Healthy',
      'habits.exercise': 'Exercise',
      'habits.sleepBefore11pm': 'Sleep Before 11 PM',
      'habits.notes': 'How did you feel today? Any challenges or wins with your habits?',
      'habits.save': 'Save Habits',
      'habits.saving': 'Saving...',
      'habits.completed': 'habits completed',
      'habits.perfectFoundation': 'Perfect foundation! 🌱',
      
      // Weekly Report
      'weeklyReport.title': 'Weekly Reflection Report',
      'weeklyReport.generate': 'Generate Your Weekly Insights',
      'weeklyReport.generateDescription': 'Get AI-powered insights about your feelings, accomplishments, and learnings from the past week.',
      'weeklyReport.generateButton': 'Generate Report',
      'weeklyReport.generating': 'Generating...',
      'weeklyReport.feelingDistribution': 'Feeling Distribution',
      'weeklyReport.accomplishmentCelebration': 'Accomplishment Celebration',
      'weeklyReport.actionsCompleted': 'Actions Completed',
      'weeklyReport.xpEarned': 'XP Earned',
      'weeklyReport.dayStreak': 'Day Streak',
      'weeklyReport.yourWeeksStory': 'Your Week\'s Story:',
      'weeklyReport.achievementsUnlocked': 'Achievements Unlocked:',
      'weeklyReport.learningSummary': 'Learning Summary',
      'weeklyReport.keyInsights': 'Key Insights:',
      'weeklyReport.patternsNoticed': 'Patterns Noticed:',
      'weeklyReport.recommendations': 'Recommendations:',
      'weeklyReport.regenerateAI': '🔄 Regenerate AI Insights',
      'weeklyReport.regenerating': 'Regenerating...',
      'weeklyReport.viewHistorical': 'View Historical Reports',
      
      // Historical Reports
      'historicalReports.title': 'Historical Reports',
      'historicalReports.showLast': 'Show last:',
      'historicalReports.weeks': 'weeks',
      'historicalReports.noData': 'No Historical Data',
      'historicalReports.noDataDescription': 'Complete some actions with reflections to generate historical reports.',
      'historicalReports.loading': 'Loading your historical insights...',
      'historicalReports.actions': 'actions',
      'historicalReports.xp': 'XP',
      'weeklyReport.detailed': 'Weekly Report',
      
      // Modals
      'modal.actionsThatLed': 'Actions that led to this feeling:',
      'modal.aiAnalysis': 'AI Analysis:',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.close': 'Close',
    },
    zh: {
      // Navigation
      'nav.dailyStreak': '每日连续',
      'nav.level': '等级',
      'nav.gardener': '园丁',
      'nav.export': '导出',
      'nav.weeklyReport': '周报',
      'nav.signOut': '退出登录',
      
      // Welcome
      'welcome.title': '欢迎来到成长花园',
      'welcome.subtitle': '种植属于你自己的花园 — 一个让你的洞察力、创造力和激情生根发芽的地方',
      
      // Stats
      'stats.activeGoals': '活跃目标',
      'stats.completedToday': '今日完成',
      'stats.treesMature': '成熟树木',
      'stats.needAttention': '需要关注',
      
      // Actions
      'actions.plantGoal': '种植目标',
      'actions.createAction': '创建行动',
      'actions.viewAll': '查看全部',
      'actions.completed': '已完成',
      'actions.upcoming': '即将到来',
      'actions.noActions': '还没有行动。创建你的第一个行动开始吧！',
      'actions.todaysActions': '今日行动',
      'actions.noScheduled': '今天没有安排行动',
      
      // Goals
      'goals.title': '你的成长花园',
      'goals.noGoals': '还没有种植目标。种植你的第一个目标开始成长吧！',
      'goals.checkAchievements': '检查',
      'goals.checking': '检查中...',
      'goals.deleteGoal': '删除目标',
      'goals.deleteConfirmation': '你确定要删除"{goalName}"吗？这将永久删除该目标及其所有相关行动。此操作无法撤销。',
      'goals.deleting': '删除中...',
      'goals.deleted': '目标已删除',
      'goals.deletedDescription': '你的目标已从花园中移除。',
      
      // Achievements
      'achievements.title': '最近活动',
      'achievements.noActivity': '完成你的第一个行动来查看活动！',
      'achievements.goal': '目标',
      'achievements.completed': '已完成',
      'achievements.feeling': '感受',
      'achievements.satisfaction': '满意度',
      'achievements.reward': '奖励',
      
      // Daily Habits
      'habits.eatHealthy': '健康饮食',
      'habits.exercise': '锻炼',
      'habits.sleepBefore11pm': '11点前睡觉',
      'habits.notes': '今天感觉如何？有什么挑战或收获吗？',
      'habits.save': '保存习惯',
      'habits.saving': '保存中...',
      'habits.completed': '个习惯完成',
      'habits.perfectFoundation': '完美基础！🌱',
      
      // Weekly Report
      'weeklyReport.title': '周反思报告',
      'weeklyReport.generate': '生成你的周洞察',
      'weeklyReport.generateDescription': '获取关于你感受、成就和学习的AI驱动洞察。',
      'weeklyReport.generateButton': '生成报告',
      'weeklyReport.generating': '生成中...',
      'weeklyReport.feelingDistribution': '感受分布',
      'weeklyReport.accomplishmentCelebration': '成就庆祝',
      'weeklyReport.actionsCompleted': '完成行动',
      'weeklyReport.xpEarned': '获得经验',
      'weeklyReport.dayStreak': '连续天数',
      'weeklyReport.yourWeeksStory': '你的一周故事:',
      'weeklyReport.achievementsUnlocked': '解锁成就:',
      'weeklyReport.learningSummary': '学习总结',
      'weeklyReport.keyInsights': '关键洞察:',
      'weeklyReport.patternsNoticed': '发现的模式:',
      'weeklyReport.recommendations': '建议:',
      'weeklyReport.regenerateAI': '🔄 重新生成AI洞察',
      'weeklyReport.regenerating': '重新生成中...',
      'weeklyReport.viewHistorical': '查看历史报告',
      
      // Historical Reports
      'historicalReports.title': '历史报告',
      'historicalReports.showLast': '显示最近:',
      'historicalReports.weeks': '周',
      'historicalReports.noData': '无历史数据',
      'historicalReports.noDataDescription': '完成一些带反思的行动来生成历史报告。',
      'historicalReports.loading': '加载你的历史洞察...',
      'historicalReports.actions': '行动',
      'historicalReports.xp': '经验',
      'weeklyReport.detailed': '周报告',
      
      // Modals
      'modal.actionsThatLed': '导致这种感受的行动:',
      'modal.aiAnalysis': 'AI分析:',
      
      // Common
      'common.loading': '加载中...',
      'common.error': '错误',
      'common.success': '成功',
      'common.cancel': '取消',
      'common.save': '保存',
      'common.close': '关闭',
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('growthgarden-language', newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 