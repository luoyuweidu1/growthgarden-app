import { Check, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Action } from "@shared/schema";

interface ActionItemProps {
  action: Action;
}

export function ActionItem({ action }: ActionItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/actions/${action.id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
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
        return "bg-forest-50 border-forest-200";
      case 'overdue':
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
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
        return <Play className="text-blue-500" size={16} />;
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
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium"
          size="sm"
        >
          {completeMutation.isPending ? "Saving..." : "Rescue"}
        </Button>
      );
    }
    
    return (
      <Button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
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
    <Card className={cn("rounded-2xl border transition-all duration-200", getActionStyles())}>
      <CardContent className="flex items-center space-x-4 p-4">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
          {getActionIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{action.title}</h3>
          <p className="text-sm text-slate-600">
            {action.description && `${action.description} • `}
            {getStatusText()}
          </p>
        </div>
        {getActionButton()}
      </CardContent>
    </Card>
  );
}
