import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sprout, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { GoalTreeCard } from "@/components/goal-tree-card";
import { ActionItem } from "@/components/action-item";
import { GoalCreationModal } from "@/components/goal-creation-modal";
import { ActionCreationModal } from "@/components/action-creation-modal";
import { calculateTreeHealth } from "@/lib/tree-health";
import type { Goal, Action, Achievement } from "@shared/schema";

export default function Dashboard() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const { data: goals = [], isLoading: goalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: allActions = [], isLoading: actionsLoading } = useQuery<Action[]>({
    queryKey: ["/api/actions"],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  if (goalsLoading || actionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-500"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-forest-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-forest-500 rounded-full flex items-center justify-center">
                <Sprout className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-forest-800">GrowthGarden</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm text-slate-600">Daily Streak: <span className="font-semibold text-forest-600">7 days</span></span>
                <span className="text-sm text-slate-600">Level: <span className="font-semibold text-purple-600">Gardener</span></span>
              </div>
              <Button variant="ghost" size="sm" className="p-2 rounded-full">
                <User className="text-forest-600" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to Your Growth Garden</h1>
          <p className="text-slate-600 text-lg">Nurture your goals and watch your personal growth flourish</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Goals"
            value={activeGoals}
            icon="seedling"
            color="forest"
          />
          <StatsCard
            title="Completed Today"
            value={completedToday}
            icon="check"
            color="blue"
          />
          <StatsCard
            title="Trees Mature"
            value={matureGoals}
            icon="tree"
            color="purple"
          />
          <StatsCard
            title="Need Attention"
            value={goalsNeedingAttention}
            icon="alert"
            color="orange"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            onClick={() => setIsGoalModalOpen(true)}
            className="bg-forest-500 hover:bg-forest-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
            size="lg"
          >
            <Plus className="mr-2" size={20} />
            Plant New Goal
          </Button>
          {goals.length > 0 && (
            <Button
              onClick={() => setIsActionModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
              size="lg"
            >
              <Plus className="mr-2" size={20} />
              Add Action
            </Button>
          )}
        </div>

        {/* Garden Grid */}
        <Card className="rounded-3xl shadow-lg border border-slate-200 p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Your Growth Garden</h2>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm" className="px-4 py-2">
                Grid View
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {goals.map((goal) => (
              <GoalTreeCard key={goal.id} goal={goal} />
            ))}
            
            {/* Empty Plot for New Goal */}
            <div
              onClick={() => setIsGoalModalOpen(true)}
              className="flex flex-col items-center space-y-4 p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 hover:border-forest-300 hover:bg-forest-50 transition-all duration-300 cursor-pointer"
            >
              <div className="w-20 h-20 flex items-center justify-center text-4xl opacity-50">
                <Plus className="text-slate-400" size={32} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-slate-600 text-sm">Plant New Goal</h3>
                <p className="text-xs text-slate-500 mt-1">Click to add</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Actions */}
        <Card className="rounded-3xl shadow-lg border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Today's Actions</h2>
          
          <div className="space-y-4">
            {upcomingActions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No actions scheduled for today</p>
            ) : (
              upcomingActions.map((action) => (
                <ActionItem key={action.id} action={action} />
              ))
            )}
          </div>
        </Card>

        {/* Progress Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Progress */}
          <Card className="rounded-3xl shadow-lg border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Weekly Progress</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">Actions Completed</span>
                  <span className="text-sm font-bold text-forest-600">
                    {allActions.filter(a => a.isCompleted).length}/{allActions.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-forest-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(allActions.filter(a => a.isCompleted).length / Math.max(allActions.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">Goals On Track</span>
                  <span className="text-sm font-bold text-blue-600">{activeGoals}/{goals.length}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(activeGoals / Math.max(goals.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Achievements */}
          <Card className="rounded-3xl shadow-lg border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Achievements</h3>
            
            <div className="space-y-4">
              {achievements.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Complete your first action to unlock achievements!</p>
              ) : (
                achievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-4 p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-lg">{achievement.iconName}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{achievement.title}</h4>
                      <p className="text-sm text-slate-600">{achievement.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
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
    </div>
  );
}
