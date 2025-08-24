import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Action } from "@shared/schema";

interface ActionReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action;
  onComplete: () => void;
  onSkip: () => void;
}

const feelingEmojis = [
  { emoji: "😊", label: "Happy", value: "Happy" },
  { emoji: "🎉", label: "Excited", value: "Excited" },
  { emoji: "😌", label: "Relaxed", value: "Relaxed" },
  { emoji: "💪", label: "Accomplished", value: "Accomplished" },
  { emoji: "😌", label: "Relieved", value: "Relieved" },
  { emoji: "😎", label: "Confident", value: "Confident" },
  { emoji: "🤔", label: "Thoughtful", value: "Thoughtful" },
  { emoji: "😴", label: "Tired", value: "Tired" },
  { emoji: "😅", label: "Stressed", value: "Stressed" },
  { emoji: "😤", label: "Frustrated", value: "Frustrated" },
  { emoji: "😇", label: "Grateful", value: "Grateful" },
  { emoji: "🤗", label: "Proud", value: "Proud" },
];

export function ActionReflectionModal({ isOpen, onClose, action, onComplete, onSkip }: ActionReflectionModalProps) {
  const [formData, setFormData] = useState({
    feeling: '',
    reflection: '',
    difficulty: '3',
    satisfaction: '3',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveReflectionMutation = useMutation({
    mutationFn: async (reflectionData: any) => {
      await apiRequest("PATCH", `/api/actions/${action.id}/reflection`, reflectionData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      toast({
        title: "Reflection saved!",
        description: "Your thoughts have been recorded for future reference.",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reflectionData = {
      feeling: formData.feeling.trim(),
      reflection: formData.reflection.trim(),
      difficulty: parseInt(formData.difficulty),
      satisfaction: parseInt(formData.satisfaction),
      reflectedAt: new Date(),
    };
    
    saveReflectionMutation.mutate(reflectionData);
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleEmojiSelect = (emojiData: { emoji: string; label: string; value: string }) => {
    setFormData(prev => ({ ...prev, feeling: emojiData.value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto biomorphic-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sage-800">How did it go?</DialogTitle>
          <p className="text-sage-600 mt-2">Take a moment to reflect on completing "{action.title}"</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label className="text-sm font-medium text-sage-700">
              How are you feeling right now? *
            </Label>
            
            {/* Emoji Selection */}
            <div className="mt-3">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {feelingEmojis.map((emojiData) => (
                  <button
                    key={emojiData.value}
                    type="button"
                    onClick={() => handleEmojiSelect(emojiData)}
                    className={`organic-shape p-3 text-center transition-all duration-200 hover:scale-105 ${
                      formData.feeling === emojiData.value
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-sage-50 hover:bg-sage-100 border border-sage-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{emojiData.emoji}</div>
                    <div className="text-xs font-medium">{emojiData.label}</div>
                  </button>
                ))}
              </div>
              
              {/* Custom Feeling Input */}
              <Input
                value={formData.feeling}
                onChange={(e) => setFormData(prev => ({ ...prev, feeling: e.target.value }))}
                placeholder="Or type your own feeling..."
                className="organic-shape border-sage-200 focus:border-primary transition-all duration-300"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="reflection" className="text-sm font-medium text-sage-700">
              What did you learn or notice? (Optional)
            </Label>
            <Textarea
              id="reflection"
              value={formData.reflection}
              onChange={(e) => setFormData(prev => ({ ...prev, reflection: e.target.value }))}
              placeholder="Share any insights, challenges, or observations from completing this action..."
              rows={4}
              className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty" className="text-sm font-medium text-sage-700">
                How difficult was this task?
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="biomorphic-card">
                  <SelectItem value="1">1 - Very Easy</SelectItem>
                  <SelectItem value="2">2 - Easy</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Challenging</SelectItem>
                  <SelectItem value="5">5 - Very Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="satisfaction" className="text-sm font-medium text-sage-700">
                How satisfied are you with the result?
              </Label>
              <Select
                value={formData.satisfaction}
                onValueChange={(value) => setFormData(prev => ({ ...prev, satisfaction: value }))}
              >
                <SelectTrigger className="mt-2 organic-shape border-sage-200 focus:border-primary transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="biomorphic-card">
                  <SelectItem value="1">1 - Not Satisfied</SelectItem>
                  <SelectItem value="2">2 - Somewhat Satisfied</SelectItem>
                  <SelectItem value="3">3 - Satisfied</SelectItem>
                  <SelectItem value="4">4 - Very Satisfied</SelectItem>
                  <SelectItem value="5">5 - Extremely Satisfied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Summary */}
          <div className="biomorphic-card p-4 bg-sage-50/50">
            <h3 className="font-semibold text-sage-800 mb-2">Action Summary</h3>
            <div className="space-y-1 text-sm text-sage-600">
              <p><span className="font-medium">Action:</span> {action.title}</p>
              {action.description && (
                <p><span className="font-medium">Description:</span> {action.description}</p>
              )}
              <p><span className="font-medium">XP Earned:</span> +{action.xpReward} XP</p>
              {action.personalReward && (
                <p><span className="font-medium">Personal Reward:</span> {action.personalReward}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between space-x-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="organic-shape hover:bg-sage-100/50 transition-all duration-300"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={saveReflectionMutation.isPending}
              className="biomorphic-button"
            >
              {saveReflectionMutation.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 