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

interface ActionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
}

export function ActionCreationModal({ isOpen, onClose, goals }: ActionCreationModalProps) {
  const [formData, setFormData] = useState<Partial<Action>>({
    title: '',
    description: '',
    goalId: goals.length > 0 ? goals[0].id : 0,
    xpReward: 15,
    personalReward: '',
    dueDate: null,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        goalId: goals.length > 0 ? goals[0].id : 0,
        xpReward: 15,
        personalReward: '',
        dueDate: null,
      });
    }
  }, [isOpen, goals]);

  const createActionMutation = useMutation({
    mutationFn: async (actionData: Partial<Action>) => {
      const response = await apiRequest("POST", "/api/actions", actionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Action created!",
        description: "Your new action has been planted and is ready to grow.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create action. Please try again.",
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

    const actionData: Partial<Action> = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      goalId: formData.goalId || (goals.length > 0 ? goals[0].id : 0),
      xpReward: formData.xpReward || 15,
      personalReward: formData.personalReward?.trim() || null,
      dueDate: formData.dueDate || null,
    };
    
    createActionMutation.mutate(actionData);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto biomorphic-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sage-800">Add New Action</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-sage-700">
              Action Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Analyze Apple's AI strategy"
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
              required
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-sage-700">Select Goal</Label>
            <Select
              value={(formData.goalId || 0) > 0 ? (formData.goalId || 0).toString() : ""}
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
          
          <div className="flex justify-end space-x-4 pt-6">
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
              disabled={createActionMutation.isPending}
              className="biomorphic-button"
            >
              {createActionMutation.isPending ? "Creating..." : "Add Action"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}