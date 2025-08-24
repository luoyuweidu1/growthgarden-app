import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sprout, Plus, Download, User, Check, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GoalCreationModal } from "@/components/goal-creation-modal";
import { ActionCreationModal } from "@/components/action-creation-modal";
import { ExportModal } from "@/components/export-modal";
import { GoalTreeCard } from "@/components/goal-tree-card";
import { StatsCard } from "@/components/stats-card";
import { ActionItem } from "@/components/action-item";
import { WeeklyReflectionReport } from "@/components/weekly-reflection-report";

import { DailyHabitsCheckin } from "@/components/daily-habits-checkin";
import { StorageStatusBanner } from "@/components/storage-status-banner";
import { apiRequest } from "@/lib/queryClient";
// Define types locally since we removed shared schema
interface Goal {
  id: string;
  name: string;
  title?: string;
  plantType: string;
  currentLevel?: number;
  currentXP?: number;
  maxXP?: number;
  status?: string;
  lastWatered?: string | Date;
  description?: string;
  timelineMonths?: number;
  progress?: number;
  category?: string;
  priority?: string;
  created_at?: string;
  target_date?: string;
  user_id?: string;
}

interface Action {
  id: string;
  goalId: string;
  title: string;
  status: string;
  description?: string;
  priority?: string;
  created_at?: string;
  due_date?: string;
  user_id?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}
import { calculateTreeHealth } from "@/lib/tree-health";
import { useAuth } from "@/components/auth-provider";

export default function Dashboard() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

  const queryClient = useQueryClient();
  const { signOut, user, loading } = useAuth();
  const { t } = useLanguage();

  // Check if user is authenticated
  useEffect(() => {
    console.log('🔐 Dashboard Auth Check:', {
      hasUser: !!user,
      userEmail: user?.email,
      loading
    });
    
    if (!loading && !user) {
      console.log('❌ No authenticated user found, redirecting to login...');
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [user, loading]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Trigger achievement check on page load
  const achievementCheckMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/achievements/check");
    },
    onSuccess: () => {
      // Invalidate achievements query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
    },
  });

  useEffect(() => {
    achievementCheckMutation.mutate();
  }, []);

  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Log goals query changes
  useEffect(() => {
    console.log('🎯 Goals query state changed:', {
      goalsCount: goals.length,
      goalsLoading,
      goalsError: goalsError?.message,
      goals: goals.map(g => ({ id: g.id, name: g.name }))
    });
  }, [goals, goalsLoading, goalsError]);

  const { data: allActions = [], isLoading: actionsLoading, error: actionsError } = useQuery<Action[]>({
    queryKey: ["/api/actions"],
  });

  // Debug logging
  console.log('🏡 Dashboard Debug:', {
    goalsCount: goals.length,
    goalsLoading,
    goalsError,
    actionsCount: allActions.length,
    actionsLoading,
    actionsError
  });

  // Automatic API test on mount (only once)
  useEffect(() => {
    const testAPI = async () => {
      console.log('🤖 Automatic API test on dashboard load...');
      try {
        const response = await apiRequest("GET", "/api/goals");
        const data = await response.json();
        console.log('🤖 Automatic API test - Response:', data);
        console.log('🤖 Automatic API test - Status:', response.status);
        console.log('🤖 Automatic API test - Goals count:', data.length);
      } catch (error) {
        console.error('🤖 Automatic API test - Error:', error);
      }
    };
    
    // Only run if not loading to avoid multiple calls
    if (!goalsLoading && !actionsLoading) {
      testAPI();
    }
  }, [goalsLoading, actionsLoading]); // Run when loading states change

  // Add global debug functions for manual testing
  useEffect(() => {
    (window as any).debugGoals = {
      testAPI: async () => {
        console.log('🌍 Manual API test from console...');
        try {
          const response = await apiRequest("GET", "/api/goals");
          const data = await response.json();
          console.log('🌍 Console API test - Response:', data);
          return data;
        } catch (error) {
          console.error('🌍 Console API test - Error:', error);
          return error;
        }
      },
      refreshGoals: () => {
        console.log('🌍 Manual refresh from console...');
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
        queryClient.refetchQueries({ queryKey: ["/api/goals"] });
      },
      clearCache: () => {
        console.log('🌍 Manual cache clear from console...');
        queryClient.clear();
        queryClient.refetchQueries();
      }
    };
    console.log('🌍 Debug functions available: window.debugGoals.testAPI(), window.debugGoals.refreshGoals(), window.debugGoals.clearCache()');
  }, [queryClient]);

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  if (goalsLoading || actionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center fluid-gradient">
        <div className="organic-shape bg-white/80 backdrop-blur-sm p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const activeGoals = goals.filter(goal => goal.status === 'active').length;
  const matureGoals = goals.filter(goal => goal.currentLevel >= 5).length;
  const goalsNeedingAttention = goals.filter(goal => {
    const health = calculateTreeHealth(goal.lastWatered);
    return health.status === 'warning';
  }).length;

  const todaysActions = allActions.filter(action => {
    const today = new Date();
    const actionDate = new Date(action.createdAt);
    return actionDate.toDateString() === today.toDateString();
  });

  const completedToday = todaysActions.filter(action => action.isCompleted).length;

  // Get today's actions for display
  const upcomingActions = allActions
    .filter(action => !action.isCompleted)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen fluid-gradient">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-sage-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="organic-shape bg-gradient-to-br from-primary to-moss-500 w-12 h-12 flex items-center justify-center shadow-lg animate-float">
                <Sprout className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-sage-800">Growth Garden</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm text-sage-600">{t('nav.dailyStreak')}: <span className="font-semibold text-primary">7 days</span></span>
                <span className="text-sm text-sage-600">{t('nav.level')}: <span className="font-semibold text-primary">{t('nav.gardener')}</span></span>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Button
                  onClick={() => setIsExportModalOpen(true)}
                  variant="ghost"
                  className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('nav.export')}
                </Button>
                <Button
                  onClick={() => setIsWeeklyReportOpen(true)}
                  variant="ghost"
                  className="organic-shape hover:bg-sage-100/50 transition-all duration-300 border border-primary/20"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-primary font-medium">{t('nav.weeklyReport')}</span>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="organic-shape hover:bg-red-100/50 transition-all duration-300 text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.signOut')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="text-center mb-6">
          <div className="organic-shape bg-white/80 backdrop-blur-sm p-8 mb-4 inline-block">
            <h1 className="text-4xl font-bold text-sage-800 mb-3">{t('welcome.title')}</h1>
            <p className="text-sage-600 text-lg max-w-md mx-auto">{t('welcome.subtitle')}</p>
          </div>
        </div>

        {/* Storage Status Banner */}
        <StorageStatusBanner />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={t('stats.activeGoals')}
            value={activeGoals}
            icon="seedling"
            color="forest"
          />
          <StatsCard
            title={t('stats.completedToday')}
            value={completedToday}
            icon="check"
            color="blue"
          />
          <StatsCard
            title={t('stats.treesMature')}
            value={matureGoals}
            icon="tree"
            color="purple"
          />
          <StatsCard
            title={t('stats.needAttention')}
            value={goalsNeedingAttention}
            icon="alert"
            color="orange"
          />
        </div>

        {/* Life Energy Cornerstone */}
        <div className="mb-8">
          <DailyHabitsCheckin />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-12">
          <Button
            onClick={() => setIsGoalModalOpen(true)}
            className="biomorphic-button text-white px-8 py-4 font-medium text-base"
            size="lg"
          >
            <Plus className="mr-2" size={18} />
            {t('actions.plantGoal')}
          </Button>
          {goals.length > 0 && (
            <Button
              onClick={() => setIsActionModalOpen(true)}
              variant="outline"
              className="organic-shape border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 font-medium text-base shadow-lg transition-all duration-300 hover:shadow-xl"
              size="lg"
            >
              <Plus className="mr-2" size={18} />
              {t('actions.createAction')}
            </Button>
          )}
        </div>

        {/* Garden Grid */}
        <div className="biomorphic-card p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-sage-800">{t('goals.title')}</h2>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('🔄 DEBUG BUTTON CLICKED - Manual refresh triggered');
                  console.log('🔄 QueryClient available:', !!queryClient);
                  console.log('🔄 Current goals before refresh:', goals.length);
                  try {
                    console.log('🔄 Step 1: Invalidating queries...');
                    await queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
                    console.log('🔄 Step 2: Refetching queries...');
                    const result = await queryClient.refetchQueries({ queryKey: ["/api/goals"] });
                    console.log('🔄 Refresh completed successfully:', result);
                    console.log('🔄 Goals after refresh:', goals.length);
                  } catch (error) {
                    console.error('🔄 Refresh error:', error);
                  }
                }}
                className="organic-shape px-4 py-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300"
              >
                🔄 Debug Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('🧪 TEST API BUTTON CLICKED - Testing API directly...');
                  console.log('🧪 apiRequest function available:', typeof apiRequest);
                  try {
                    const response = await apiRequest("GET", "/api/goals");
                    console.log('🧪 Response received:', response);
                    const data = await response.json();
                    console.log('🧪 Direct API response:', data);
                    console.log('🧪 Response status:', response.status);
                    console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
                  } catch (error) {
                    console.error('🧪 Direct API error:', error);
                    console.error('🧪 Error details:', {
                      name: (error as Error).name,
                      message: (error as Error).message,
                      stack: (error as Error).stack
                    });
                  }
                }}
                className="organic-shape px-4 py-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300"
              >
                🧪 Test API
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('🔬 DEBUG DB BUTTON CLICKED - Checking database contents...');
                  console.log('🔬 Button click detected, starting API call...');
                  try {
                    console.log('🔬 Making request to /api/debug/goals...');
                    const response = await apiRequest("GET", "/api/debug/goals");
                    console.log('🔬 Response received:', response);
                    console.log('🔬 Response status:', response.status);
                    const data = await response.json();
                    console.log('🔬 Database debug response:', data);
                    console.log('🔬 Current User ID:', data.currentUserId);
                    console.log('🔬 Total goals in database:', data.totalGoalsInDatabase);
                    console.log('🔬 All goals:', data.allGoals);
                    console.log('🔬 User goals count:', data.userGoalsCount);
                    console.log('🔬 User goals:', data.userGoals);
                  } catch (error) {
                    console.error('🔬 Database debug error:', error);
                    console.error('🔬 Error type:', typeof error);
                    console.error('🔬 Error details:', {
                      name: (error as Error).name,
                      message: (error as Error).message,
                      stack: (error as Error).stack
                    });
                  }
                }}
                className="organic-shape px-4 py-2 border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all duration-300"
              >
                🔬 Debug DB
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('🗑️ Clearing all React Query cache...');
                  queryClient.clear();
                  console.log('🗑️ Cache cleared, refetching...');
                  queryClient.refetchQueries();
                }}
                className="organic-shape px-4 py-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-300"
              >
                🗑️ Clear Cache
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('🔑 Force logout and redirect to login...');
                  try {
                    await signOut();
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                  // Clear all local storage/session storage that might contain auth data
                  localStorage.clear();
                  sessionStorage.clear();
                  // Force page reload to clear any cached auth state
                  window.location.href = '/login';
                }}
                className="organic-shape px-4 py-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all duration-300"
              >
                🔑 Force Re-Login
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('🔍 CACHE INSPECT - Current React Query state:');
                  const cache = queryClient.getQueryCache();
                  const goalsQuery = cache.find({ queryKey: ["/api/goals"] });
                  console.log('🔍 Goals query in cache:', {
                    exists: !!goalsQuery,
                    state: goalsQuery?.state,
                    data: goalsQuery?.state.data,
                    dataUpdatedAt: goalsQuery?.state.dataUpdatedAt ? new Date(goalsQuery.state.dataUpdatedAt) : null,
                    error: goalsQuery?.state.error,
                    status: goalsQuery?.state.status
                  });
                  console.log('🔍 All cache queries:', cache.getAll().map(q => ({ 
                    key: q.queryKey, 
                    status: q.state.status,
                    dataLength: Array.isArray(q.state.data) ? q.state.data.length : 'not array'
                  })));
                }}
                className="organic-shape px-4 py-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-300"
              >
                🔍 Cache Info
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('🔐 AUTH INSPECT - Checking detailed auth state...');
                  try {
                    const { supabase } = await import('@/components/auth-provider');
                    const { data: { session }, error } = await supabase.auth.getSession();
                    console.log('🔐 Raw Supabase session:', {
                      hasSession: !!session,
                      hasAccessToken: !!session?.access_token,
                      hasRefreshToken: !!session?.refresh_token,
                      accessTokenLength: session?.access_token?.length,
                      refreshTokenLength: session?.refresh_token?.length,
                      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
                      isExpired: session?.expires_at ? Date.now() > session.expires_at * 1000 : false,
                      minutesUntilExpiry: session?.expires_at ? Math.round((session.expires_at * 1000 - Date.now()) / 60000) : null,
                      userEmail: session?.user?.email,
                      userId: session?.user?.id,
                      error: error?.message
                    });
                  } catch (error) {
                    console.error('🔐 Error checking auth state:', error);
                  }
                }}
                className="organic-shape px-4 py-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                🔐 Auth Info
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsExportModalOpen(true)}
                className="organic-shape px-4 py-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Download size={16} className="mr-2" />
                {t('nav.export')} Progress
              </Button>
              <Button variant="ghost" size="sm" className="organic-shape px-4 py-2 text-sage-500 hover:text-sage-700 transition-all duration-300">
                Grid View
              </Button>
            </div>
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-gray-100 rounded text-sm space-y-2">
              <div><strong>Debug Info:</strong></div>
              <div className={`${user ? 'text-green-600' : 'text-red-600'}`}>
                Auth: {user ? `✅ ${user.email}` : '❌ Not authenticated'}
              </div>
              <div>Goals: {goals.length} loaded, Loading: {goalsLoading ? 'Yes' : 'No'}</div>
              <div>Actions: {allActions.length} loaded, Loading: {actionsLoading ? 'Yes' : 'No'}</div>
              {goalsError && <div className="text-red-600">Goals Error: {String(goalsError)}</div>}
              {actionsError && <div className="text-red-600">Actions Error: {String(actionsError)}</div>}
              {!user && <div className="text-yellow-600 font-semibold">⚠️ Authentication required - click "🔑 Re-Login" button</div>}
              <div className="text-xs text-gray-600">
                Query Cache Keys: {JSON.stringify(queryClient.getQueryCache().getAll().map(q => q.queryKey))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {goals.map((goal) => (
              <GoalTreeCard key={goal.id} goal={goal} actions={allActions} />
            ))}
            
            {/* Empty Plot for New Goal */}
            <div
              onClick={() => setIsGoalModalOpen(true)}
              className="organic-shape-alt flex flex-col items-center space-y-4 p-4 bg-gradient-to-b from-sage-50 to-moss-50 border-2 border-dashed border-sage-300 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer animate-ripple"
            >
              <div className="w-20 h-20 flex items-center justify-center text-4xl opacity-50">
                <Plus className="text-sage-400" size={32} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sage-600 text-sm">{t('actions.plantGoal')}</h3>
                <p className="text-xs text-sage-500 mt-1">Click to add</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Actions */}
        <div className="biomorphic-card p-8 mb-8">
          <h2 className="text-2xl font-semibold text-sage-800 mb-6">{t('actions.todaysActions')}</h2>
          
          <div className="space-y-4">
            {upcomingActions.length === 0 ? (
              <p className="text-sage-500 text-center py-8">{t('actions.noScheduled')}</p>
            ) : (
              upcomingActions.map((action) => (
                <ActionItem key={action.id} action={action} />
              ))
            )}
          </div>
        </div>

        {/* Progress Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Progress */}
          <div className="biomorphic-card p-8">
            <h3 className="text-xl font-semibold text-sage-800 mb-6">Weekly Progress</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-sage-600">Actions Completed</span>
                  <span className="text-sm font-bold text-primary">
                    {allActions.filter(a => a.isCompleted).length}/{allActions.length}
                  </span>
                </div>
                <div className="w-full bg-sage-200/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-moss-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(allActions.filter(a => a.isCompleted).length / Math.max(allActions.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-sage-600">Goals On Track</span>
                  <span className="text-sm font-bold text-moss-600">{activeGoals}/{goals.length}</span>
                </div>
                <div className="w-full bg-sage-200/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-moss-500 to-clay-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(activeGoals / Math.max(goals.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card Placeholder */}
          <div className="biomorphic-card p-8">
            <h3 className="text-xl font-semibold text-sage-800 mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-sage-600">Total XP Earned</span>
                <span className="text-lg font-bold text-primary">
                  {allActions.filter(a => a.isCompleted).reduce((sum, action) => sum + action.xpReward, 0)} XP
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-sage-600">Current Streak</span>
                <span className="text-lg font-bold text-moss-600">7 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-sage-600">Highest Level</span>
                <span className="text-lg font-bold text-clay-600">
                  {goals.length > 0 ? Math.max(...goals.map(g => g.currentLevel)) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements & Actions */}
        <div className="biomorphic-card p-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-sage-800">{t('achievements.title')}</h3>
            <Button
              onClick={() => achievementCheckMutation.mutate()}
              disabled={achievementCheckMutation.isPending}
              variant="ghost"
              size="sm"
              className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
            >
              {achievementCheckMutation.isPending ? t('goals.checking') : "🔄 " + t('goals.checkAchievements')}
            </Button>
          </div>
          
          <div className="space-y-4">
            {achievements.length === 0 && allActions.filter(action => action.isCompleted).length === 0 ? (
              <p className="text-sage-500 text-center py-8">{t('achievements.noActivity')}</p>
            ) : (
              <>
                {/* Show completed actions first */}
                {allActions
                  .filter(action => action.isCompleted)
                  .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
                  .slice(0, 3)
                  .map((action) => {
                    const goal = goals.find(g => g.id === action.goalId);
                    return (
                      <div key={`action-${action.id}`} className="organic-shape flex items-center space-x-4 p-4 bg-gradient-to-r from-forest-50 to-forest-100/60 border border-forest-200/50">
                        <div className="organic-shape w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center">
                          <Check className="text-white" size={16} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sage-800">{action.title}</h4>
                          <p className="text-sm text-sage-600">
                            {goal?.name && `${t('achievements.goal')}: ${goal.name} • `}
                            {action.completedAt && `${t('achievements.completed')} ${new Date(action.completedAt).toLocaleDateString()}`}
                          </p>
                          {action.feeling && (
                            <p className="text-xs text-moss-600 mt-1">
                              😊 {t('achievements.feeling')}: {action.feeling}
                              {action.satisfaction && ` • ${t('achievements.satisfaction')}: ${action.satisfaction}/5`}
                            </p>
                          )}
                          {action.personalReward && (
                            <p className="text-xs text-moss-600 mt-1">
                              🎁 {t('achievements.reward')}: {action.personalReward}
                            </p>
                          )}
                        </div>
                        <div className="text-forest-500 text-sm font-medium">
                          +{action.xpReward} XP
                        </div>
                      </div>
                    );
                  })}
                
                {/* Show achievements */}
                {achievements.slice(0, 3).map((achievement) => (
                  <div key={`achievement-${achievement.id}`} className="organic-shape flex items-center space-x-4 p-4 bg-gradient-to-r from-clay-50 to-stone-50 border border-clay-200">
                    <div className="organic-shape w-10 h-10 bg-gradient-to-br from-clay-500 to-stone-500 flex items-center justify-center">
                      <span className="text-white text-lg">{achievement.iconName}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sage-800">{achievement.title}</h4>
                      <p className="text-sm text-sage-600">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Goal Creation Modal */}
      <GoalCreationModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
      
      {/* Action Creation Modal */}
      <ActionCreationModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        goals={goals}
      />
      
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        goals={goals}
        actions={allActions}
      />

      <WeeklyReflectionReport
        isOpen={isWeeklyReportOpen}
        onClose={() => setIsWeeklyReportOpen(false)}
      />


    </div>
  );
}
