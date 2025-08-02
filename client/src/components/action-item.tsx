import { useState } from "react";
import { Check, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ActionReflectionModal } from "./action-reflection-modal";
import type { Action } from "@shared/schema";

interface ActionItemProps {
  action: Action;
}

export function ActionItem({ action }: ActionItemProps) {
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/actions/${action.id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Action completed!",
        description: `You earned ${action.xpReward} XP and watered your tree.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartAction = () => {
    // Open reflection modal first, don't complete action yet
    setIsReflectionModalOpen(true);
  };

  const handleReflectionComplete = () => {
    // Complete the action after reflection is saved
    completeMutation.mutate();
    setIsReflectionModalOpen(false);
  };

  const handleReflectionSkip = () => {
    // Complete the action when reflection is skipped
    completeMutation.mutate();
    setIsReflectionModalOpen(false);
  };

  const getActionStatus = () => {
    if (action.isCompleted) return 'completed';
    if (action.dueDate) {
      const now = new Date();
      const dueDate = new Date(action.dueDate);
      if (now > dueDate) return 'overdue';
    }
    return 'pending';
  };

  const getActionStyles = () => {
    const status = getActionStatus();
    switch (status) {
      case 'completed':
        return "bg-gradient-to-br from-forest-50/80 to-forest-100/60 border-forest-200/50";
      case 'overdue':
        return "bg-gradient-to-br from-red-50/80 to-red-100/60 border-red-200/50";
      default:
        return "bg-gradient-to-br from-sage-50/80 to-sage-100/60 border-sage-200/50";
    }
  };

  const getActionIcon = () => {
    const status = getActionStatus();
    switch (status) {
      case 'completed':
        return <Check className="text-forest-500" size={16} />;
      case 'overdue':
        return <AlertTriangle className="text-red-500" size={16} />;
      default:
        return <Play className="text-sage-500" size={16} />;
    }
  };

  const getActionButton = () => {
    const status = getActionStatus();
    
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
            handleStartAction();
          }}
          disabled={completeMutation.isPending}
          className="organic-shape px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium shadow-lg transition-all duration-300"
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
          handleStartAction();
        }}
        disabled={completeMutation.isPending}
        className="organic-shape px-4 py-2 bg-gradient-to-r from-sage-500 to-moss-500 hover:from-sage-600 hover:to-moss-600 text-white text-sm font-medium shadow-lg transition-all duration-300"
        size="sm"
      >
        {completeMutation.isPending ? "Starting..." : "Start"}
      </Button>
    );
  };

  const getStatusText = () => {
    const status = getActionStatus();
    
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

  return (
    <>
      <Card className={cn("organic-shape border-0 shadow-lg backdrop-blur-sm transition-all duration-300", getActionStyles())}>
        <CardContent className="flex items-center space-x-4 p-4">
          <div className="organic-shape w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            {getActionIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sage-800">{action.title}</h4>
            <p className="text-sm text-sage-600">
              {action.description && `${action.description} • `}
              {getStatusText()}
            </p>
            {action.personalReward && (
              <p className="text-xs text-moss-600 mt-1">
                🎁 Reward: {action.personalReward}
              </p>
            )}
          </div>
          {getActionButton()}
        </CardContent>
      </Card>

      <ActionReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        action={action}
        onComplete={handleReflectionComplete}
        onSkip={handleReflectionSkip}
      />
    </>
  );
}
