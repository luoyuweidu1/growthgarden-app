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
import type { InsertAction, Goal } from "@shared/schema";

interface ActionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
}

export function ActionCreationModal({ isOpen, onClose, goals }: ActionCreationModalProps) {
  const [formData, setFormData] = useState<InsertAction>({
    title: '',
    description: '',
    goalId: goals.length > 0 ? goals[0].id : 0,
    xpReward: 15,
    dueDate: null,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize form when modal opens or goals change
  useEffect(() => {
    if (isOpen && goals.length > 0) {
      setFormData(prev => ({
        ...prev,
        goalId: prev.goalId === 0 ? goals[0].id : prev.goalId
      }));
    }
  }, [isOpen, goals]);

  const createActionMutation = useMutation({
    mutationFn: async (actionData: InsertAction) => {
      const response = await apiRequest("POST", "/api/actions", actionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      toast({
        title: "Action created!",
        description: "Your new action has been added to your goal.",
      });
      resetForm();
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goalId: goals.length > 0 ? goals[0].id : 0,
      xpReward: 15,
      dueDate: null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
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

    createActionMutation.mutate(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">Add New Action</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Action Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Analyze Apple's AI strategy"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">Select Goal</Label>
            <Select
              value={formData.goalId > 0 ? formData.goalId.toString() : ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, goalId: parseInt(value) }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose which goal this action supports" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id.toString()}>
                    {goal.name} (Level {goal.currentLevel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add more details about this action..."
              rows={3}
              className="mt-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="xp" className="text-sm font-medium text-slate-700">
                XP Reward
              </Label>
              <Select
                value={formData.xpReward?.toString() || "15"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, xpReward: parseInt(value) }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 XP (Quick task)</SelectItem>
                  <SelectItem value="15">15 XP (Regular task)</SelectItem>
                  <SelectItem value="25">25 XP (Important task)</SelectItem>
                  <SelectItem value="50">50 XP (Major milestone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium text-slate-700">
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
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createActionMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {createActionMutation.isPending ? "Creating..." : "Add Action"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}