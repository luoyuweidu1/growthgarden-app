import { useState } from "react";
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
import { cn } from "@/lib/utils";
import type { InsertGoal } from "@shared/schema";

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
  const [formData, setFormData] = useState<InsertGoal>({
    name: '',
    description: '',
    plantType: 'sprout',
    timelineMonths: 3,
  });
  const [selectedPlantType, setSelectedPlantType] = useState('sprout');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGoalMutation = useMutation({
    mutationFn: async (goalData: InsertGoal) => {
      const response = await apiRequest("POST", "/api/goals", goalData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Goal created!",
        description: "Your new goal has been planted in your garden.",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
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

    createGoalMutation.mutate({
      ...formData,
      plantType: selectedPlantType,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">Plant a New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Goal Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Become a skilled investor"
              className="mt-2"
              required
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">Choose Your Plant</Label>
            <div className="grid grid-cols-4 gap-4 mt-2">
              {plantTypes.map((plant) => (
                <div
                  key={plant.value}
                  onClick={() => setSelectedPlantType(plant.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center cursor-pointer transition-colors",
                    selectedPlantType === plant.value
                      ? "border-forest-300 bg-forest-50"
                      : "border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="text-3xl mb-2">{plant.emoji}</div>
                  <span className="text-sm font-medium">{plant.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Goal Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you want to achieve..."
              rows={3}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="timeline" className="text-sm font-medium text-slate-700">
              Timeline
            </Label>
            <Select
              value={formData.timelineMonths.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timelineMonths: parseInt(value) }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGoalMutation.isPending}
              className="bg-forest-500 hover:bg-forest-600"
            >
              {createGoalMutation.isPending ? "Planting..." : "Plant Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
