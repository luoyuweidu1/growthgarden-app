import { useState } from "react";
import { Check, Play, AlertTriangle, Plus, Calendar, Target, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActionCreationModal } from "./action-creation-modal";
import { ActionEditModal } from "./action-edit-modal";
import { ActionReflectionModal } from "./action-reflection-modal";
import type { Goal, Action } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

interface GoalActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  actions: Action[];
}

const plantEmojis: Record<string, string> = {
  sprout: "🌱",
  herb: "🌿",
  tree: "🌳",
  flower: "🌸",
};

const getPlantTypeName = (plantType: string) => {
  switch (plantType) {
    case 'sprout': return 'Sprout';
    case 'herb': return 'Herb';
    case 'tree': return 'Tree';
    case 'flower': return 'Flower';
    default: return 'Plant';
  }
};

const getActionStatus = (action: Action) => {
  if (action.isCompleted) return 'completed';
  if (action.dueDate) {
    const now = new Date();
    const dueDate = new Date(action.dueDate);
    if (now > dueDate) return 'overdue';
  }
  return 'pending';
};

const getActionIcon = (action: Action) => {
  const status = getActionStatus(action);
  switch (status) {
    case 'completed':
      return <Check className="text-forest-500" size={16} />;
    case 'overdue':
      return <AlertTriangle className="text-red-500" size={16} />;
    default:
      return <Play className="text-sage-500" size={16} />;
  }
};

const getActionStyles = (action: Action) => {
  const status = getActionStatus(action);
  switch (status) {
    case 'completed':
      return "bg-gradient-to-br from-forest-50/80 to-forest-100/60 border-forest-200/50";
    case 'overdue':
      return "bg-gradient-to-br from-red-50/80 to-red-100/60 border-red-200/50";
    default:
      return "bg-gradient-to-br from-sage-50/80 to-sage-100/60 border-sage-200/50";
  }
};

const getPlantVisualization = (goal: Goal) => {
  const plantType = goal.plantType;
  const level = goal.currentLevel;
  
  // Define growth stages for each plant type
  const growthStages: Record<string, string[]> = {
    sprout: ['🌱', '🌿', '🌱🌿', '🌱🌿🌱'],
    herb: ['🌿', '🌱🌿', '🌿🌱🌿', '🌿🌱🌿🌱'],
    tree: ['🌱', '🌿', '🌳', '🌳🌿'],
    flower: ['🌱', '🌿', '🌸', '🌸🌿'],
  };
  
  // Get the appropriate growth stage based on level
  const stages = growthStages[plantType] || growthStages.sprout;
  const stageIndex = Math.min(level - 1, stages.length - 1);
  
  return stages[stageIndex];
};

export function GoalActionsModal({ isOpen, onClose, goal, actions }: GoalActionsModalProps) {
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isEditActionModalOpen, setIsEditActionModalOpen] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const completeMutation = useMutation({
    mutationFn: async (actionId: number) => {
      await apiRequest("PATCH", `/api/actions/${actionId}/complete`);
    },
    onSuccess: (_, actionId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Action completed!",
        description: "Your plant has been watered and grown stronger.",
      });
      // Find the completed action and open reflection modal
      const completedAction = actions.find(a => a.id === actionId);
      if (completedAction) {
        setSelectedAction(completedAction);
        setIsReflectionModalOpen(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/goals/${goal.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      toast({
        title: t('goals.deleted'),
        description: t('goals.deletedDescription'),
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteAction = (actionId: number) => {
    completeMutation.mutate(actionId);
  };

  const handleEditAction = (action: Action) => {
    setSelectedAction(action);
    setIsEditActionModalOpen(true);
  };

  const getActionButton = (action: Action) => {
    const status = getActionStatus(action);
    
    if (status === 'completed') {
      return (
        <div className="text-forest-500 text-sm font-medium">
          +{action.xpReward} XP
        </div>
      );
    }
    
    if (status === 'overdue') {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleCompleteAction(action.id);
          }}
          disabled={completeMutation.isPending}
          className="organic-shape px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium shadow-lg transition-all duration-300"
          size="sm"
        >
          {completeMutation.isPending ? "Saving..." : "Rescue"}
        </Button>
      );
    }
    
    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleCompleteAction(action.id);
        }}
        disabled={completeMutation.isPending}
        className="organic-shape px-3 py-1 bg-gradient-to-r from-sage-500 to-moss-500 hover:from-sage-600 hover:to-moss-600 text-white text-xs font-medium shadow-lg transition-all duration-300"
        size="sm"
      >
        {completeMutation.isPending ? "Starting..." : "Start"}
      </Button>
    );
  };

  const getStatusText = (action: Action) => {
    const status = getActionStatus(action);
    
    if (status === 'completed') {
      return `Completed ${action.completedAt ? new Date(action.completedAt).toLocaleString() : ''}`;
    }
    
    if (status === 'overdue') {
      if (action.dueDate) {
        const daysPast = Math.ceil((new Date().getTime() - new Date(action.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return `Overdue by ${daysPast} day${daysPast > 1 ? 's' : ''}`;
      }
      return 'Overdue';
    }
    
    if (action.dueDate) {
      const hoursUntilDue = Math.ceil((new Date(action.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60));
      if (hoursUntilDue > 0) {
        return `Due in ${hoursUntilDue} hour${hoursUntilDue > 1 ? 's' : ''}`;
      }
    }
    
    return 'Ready to start';
  };

  const completedActions = actions.filter(action => action.isCompleted);
  const pendingActions = actions.filter(action => !action.isCompleted);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto biomorphic-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-sage-800">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getPlantVisualization(goal)}</div>
                <div>
                  <div className="text-2xl font-bold">{goal.name}</div>
                  <div className="text-sm text-sage-600">
                    {getPlantTypeName(goal.plantType)} • Level {goal.currentLevel} • {actions.length} actions
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="organic-shape hover:bg-red-100/50 text-red-600 hover:text-red-700 transition-all duration-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('goals.deleteGoal')}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Goal Progress */}
            <div className="biomorphic-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sage-800 flex items-center gap-2">
                  <Target size={16} />
                  Goal Progress
                </h3>
                <span className="text-sm text-sage-600">
                  {completedActions.length}/{actions.length} completed
                </span>
              </div>
              <div className="w-full bg-sage-200/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-moss-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${(completedActions.length / Math.max(actions.length, 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Add Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setIsAddActionModalOpen(true)}
                className="biomorphic-button text-white px-6 py-3 font-medium"
              >
                <Plus className="mr-2" size={16} />
                Add New Action
              </Button>
            </div>

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
                  <Play size={16} />
                  Pending Actions ({pendingActions.length})
                </h3>
                <div className="space-y-3">
                  {pendingActions.map((action) => (
                    <Card 
                      key={action.id} 
                      className={cn("organic-shape border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl cursor-pointer", getActionStyles(action))}
                      onClick={() => handleEditAction(action)}
                    >
                      <CardContent className="flex items-center space-x-4 p-4">
                        <div className="w-8 h-8 bg-white/90 backdrop-blur-sm organic-shape flex items-center justify-center shadow-sm">
                          {getActionIcon(action)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sage-800">{action.title}</h4>
                          <p className="text-sm text-sage-600">
                            {action.description && `${action.description} • `}
                            {getStatusText(action)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAction(action);
                            }}
                            variant="ghost"
                            size="sm"
                            className="organic-shape p-1 hover:bg-sage-100/50 transition-all duration-300"
                          >
                            <Edit className="text-sage-600" size={14} />
                          </Button>
                          {getActionButton(action)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Actions */}
            {completedActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-sage-800 mb-4 flex items-center gap-2">
                  <Check size={16} />
                  Completed Actions ({completedActions.length})
                </h3>
                <div className="space-y-3">
                  {completedActions.map((action) => (
                    <Card 
                      key={action.id} 
                      className={cn("organic-shape border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl cursor-pointer", getActionStyles(action))}
                      onClick={() => handleEditAction(action)}
                    >
                      <CardContent className="flex items-center space-x-4 p-4">
                        <div className="w-8 h-8 bg-white/90 backdrop-blur-sm organic-shape flex items-center justify-center shadow-sm">
                          {getActionIcon(action)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sage-800">{action.title}</h4>
                          <p className="text-sm text-sage-600">
                            {action.description && `${action.description} • `}
                            {getStatusText(action)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAction(action);
                            }}
                            variant="ghost"
                            size="sm"
                            className="organic-shape p-1 hover:bg-sage-100/50 transition-all duration-300"
                          >
                            <Edit className="text-sage-600" size={14} />
                          </Button>
                          {getActionButton(action)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Actions Message */}
            {actions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4 opacity-50">🌱</div>
                <h3 className="font-semibold text-sage-800 mb-2">No actions yet</h3>
                <p className="text-sage-600">Add your first action to start growing this {getPlantTypeName(goal.plantType).toLowerCase()}!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ActionCreationModal
        isOpen={isAddActionModalOpen}
        onClose={() => setIsAddActionModalOpen(false)}
        goals={[goal]}
      />

      {selectedAction && (
        <ActionEditModal
          isOpen={isEditActionModalOpen}
          onClose={() => {
            setIsEditActionModalOpen(false);
            setSelectedAction(null);
          }}
          action={selectedAction}
          goals={[goal]}
        />
      )}

      {selectedAction && (
        <ActionReflectionModal
          isOpen={isReflectionModalOpen}
          onClose={() => {
            setIsReflectionModalOpen(false);
            setSelectedAction(null);
          }}
          action={selectedAction}
          onComplete={() => {
            setIsReflectionModalOpen(false);
            setSelectedAction(null);
          }}
          onSkip={() => {
            setIsReflectionModalOpen(false);
            setSelectedAction(null);
          }}
        />
      )}

      {/* Delete Goal Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="biomorphic-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sage-800">{t('goals.deleteGoal')}</AlertDialogTitle>
            <AlertDialogDescription className="text-sage-600">
              {t('goals.deleteConfirmation').replace('{goalName}', goal.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="organic-shape">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteGoalMutation.mutate();
                setIsDeleteDialogOpen(false);
              }}
              disabled={deleteGoalMutation.isPending}
              className="organic-shape bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteGoalMutation.isPending ? t('goals.deleting') : t('goals.deleteGoal')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 