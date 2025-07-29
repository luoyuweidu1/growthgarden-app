import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Action, Goal } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ActionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action;
  goals: Goal[];
}

export function ActionEditModal({ isOpen, onClose, action, goals }: ActionEditModalProps) {
  const [formData, setFormData] = useState<Partial<Action>>({
    title: '',
    description: '',
    goalId: 0,
    xpReward: 15,
    personalReward: '',
    dueDate: null,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize form when modal opens or action changes
  useEffect(() => {
    if (isOpen && action) {
      setFormData({
        title: action.title,
        description: action.description,
        goalId: action.goalId,
        xpReward: action.xpReward,
        personalReward: action.personalReward || '',
        dueDate: action.dueDate,
      });
    }
  }, [isOpen, action]);

  const updateActionMutation = useMutation({
    mutationFn: async (actionData: Partial<Action>) => {
      const response = await apiRequest("PATCH", `/api/actions/${action.id}`, actionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Action updated!",
        description: "Your action has been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/actions/${action.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Action deleted!",
        description: "Your action has been removed.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      toast({
        title: "Error",
        description: "Action title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.goalId) {
      toast({
        title: "Error",
        description: "Please select a goal for this action.",
        variant: "destructive",
      });
      return;
    }

    // Clean the form data to ensure proper serialization
    const cleanedData: Partial<Action> = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      goalId: formData.goalId,
      xpReward: formData.xpReward || 15,
      personalReward: formData.personalReward || null,
      dueDate: formData.dueDate || null,
    };
    
    updateActionMutation.mutate(cleanedData);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this action? This cannot be undone.")) {
      deleteActionMutation.mutate();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto biomorphic-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sage-800">Edit Action</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-sage-700">
              Action Title
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Analyze Apple's AI strategy"
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
              required
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-sage-700">Select Goal</Label>
            <Select
              value={formData.goalId?.toString() || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, goalId: parseInt(value) }))}
            >
              <SelectTrigger className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                <SelectValue placeholder="Choose which goal this action supports" />
              </SelectTrigger>
              <SelectContent className="biomorphic-card">
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id.toString()}>
                    {goal.name} (Level {goal.currentLevel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-sage-700">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add more details about this action..."
              rows={3}
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="xp" className="text-sm font-medium text-sage-700">
                XP Reward
              </Label>
              <Select
                value={(formData.xpReward || 15).toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, xpReward: parseInt(value) }))}
              >
                <SelectTrigger className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="biomorphic-card">
                  <SelectItem value="5">5 XP (Quick task)</SelectItem>
                  <SelectItem value="15">15 XP (Regular task)</SelectItem>
                  <SelectItem value="25">25 XP (Important task)</SelectItem>
                  <SelectItem value="50">50 XP (Major milestone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium text-sage-700">
                Due Date (Optional)
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value ? new Date(e.target.value) : null 
                }))}
                className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="personalReward" className="text-sm font-medium text-sage-700">
              Personal Reward (Optional)
            </Label>
            <Input
              id="personalReward"
              value={formData.personalReward || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, personalReward: e.target.value }))}
              placeholder="e.g., Treat yourself to ice cream, Watch an episode, Take a break..."
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
            />
            <p className="text-xs text-sage-500 mt-1">
              Set a personal reward to motivate yourself when completing this task
            </p>
          </div>

          {/* Action Status */}
          <div className="biomorphic-card p-4">
            <h3 className="font-semibold text-sage-800 mb-2">Action Status</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  action.isCompleted ? "bg-forest-500" : "bg-sage-500"
                )} />
                <span className="text-sm text-sage-600">
                  {action.isCompleted ? "Completed" : "Pending"}
                </span>
              </div>
              {action.isCompleted && (
                <span className="text-sm text-sage-600">
                  Completed on: {action.completedAt ? new Date(action.completedAt).toLocaleDateString() : 'Unknown'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between space-x-4 pt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteActionMutation.isPending}
              className="organic-shape hover:bg-red-100/50 transition-all duration-300"
            >
              {deleteActionMutation.isPending ? "Deleting..." : "Delete Action"}
            </Button>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateActionMutation.isPending}
                className="biomorphic-button"
              >
                {updateActionMutation.isPending ? "Updating..." : "Update Action"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 