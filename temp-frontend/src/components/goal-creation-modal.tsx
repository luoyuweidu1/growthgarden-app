import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
// Define the goal type locally since we removed the shared schema
interface InsertGoal {
  name: string;
  description?: string;
  plantType: string;
  timelineMonths: number;
}

interface GoalCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plantTypes = [
  { value: 'sprout', emoji: '🌱', name: 'Sprout' },
  { value: 'herb', emoji: '🌿', name: 'Herb' },
  { value: 'tree', emoji: '🌳', name: 'Tree' },
  { value: 'flower', emoji: '🌸', name: 'Flower' },
];

export function GoalCreationModal({ isOpen, onClose }: GoalCreationModalProps) {
  const { user } = useAuth();
  const [selectedPlantType, setSelectedPlantType] = useState('sprout');
  const [formData, setFormData] = useState<InsertGoal>({
    name: '',
    description: '',
    plantType: selectedPlantType,
    timelineMonths: 3,
  });

  // No need to manage userId in the frontend - backend sets it from auth

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: InsertGoal) => {
      console.log('🌱 Creating goal:', goalData);
      const response = await apiRequest("POST", "/api/goals", goalData);
      const result = await response.json();
      console.log('🌱 Goal created successfully:', result);
      return result;
    },
    onSuccess: (newGoal) => {
      console.log('🌱 Goal creation success, new goal:', newGoal);
      console.log('🌱 Current query cache state:', queryClient.getQueryData(["/api/goals"]));
      
      // Force invalidate and refetch
      console.log('🌱 Invalidating and refetching goals query...');
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.refetchQueries({ queryKey: ["/api/goals"] });
      
      // Also try to manually update the cache
      const currentGoals = queryClient.getQueryData(["/api/goals"]) as any[] || [];
      console.log('🌱 Current goals in cache:', currentGoals.length);
      queryClient.setQueryData(["/api/goals"], [...currentGoals, newGoal]);
      console.log('🌱 Updated goals in cache:', [...currentGoals, newGoal]);
      
      toast({
        title: "Goal created!",
        description: "Your new goal has been planted in your garden.",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      console.error('🌱 Goal creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create goal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      plantType: 'sprout',
      timelineMonths: 3,
    });
    setSelectedPlantType('sprout');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Goal name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a goal.",
        variant: "destructive",
      });
      return;
    }

    createGoalMutation.mutate(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto biomorphic-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sage-800">Plant a New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-sage-700">
              Goal Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Become a skilled investor"
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
              required
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-sage-700">Choose Your Plant</Label>
            <div className="grid grid-cols-4 gap-4 mt-2">
              {plantTypes.map((plant) => (
                <div
                  key={plant.value}
                  onClick={() => {
                    setSelectedPlantType(plant.value);
                    setFormData(prev => ({ ...prev, plantType: plant.value }));
                  }}
                  className={cn(
                    "p-4 organic-shape border-2 text-center cursor-pointer transition-all duration-300",
                    selectedPlantType === plant.value
                      ? "border-forest-300 bg-gradient-to-br from-forest-50/80 to-forest-100/60 shadow-lg"
                      : "border-sage-300 hover:bg-sage-50/50 hover:border-sage-400"
                  )}
                >
                  <div className="text-3xl mb-2">{plant.emoji}</div>
                  <span className="text-sm font-medium text-sage-700">{plant.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-sage-700">
              Goal Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you want to achieve..."
              rows={3}
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
            />
          </div>
          
          <div>
            <Label htmlFor="timeline" className="text-sm font-medium text-sage-700">
              Timeline
            </Label>
            <Select
              value={(formData.timelineMonths || 3).toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timelineMonths: parseInt(value) }))}
            >
              <SelectTrigger className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="biomorphic-card">
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">1 year</SelectItem>
                <SelectItem value="24">2 years</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={createGoalMutation.isPending}
              className="biomorphic-button"
            >
              {createGoalMutation.isPending ? "Planting..." : "Plant Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
