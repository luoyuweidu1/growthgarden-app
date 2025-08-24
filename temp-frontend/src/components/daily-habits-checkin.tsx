import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Apple, Dumbbell, Moon, CheckCircle, Circle } from "lucide-react";
import type { DailyHabit } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";

interface DailyHabitsCheckinProps {
  date?: string; // Optional date, defaults to today
}

export function DailyHabitsCheckin({ date }: DailyHabitsCheckinProps) {
  const [habits, setHabits] = useState({
    eatHealthy: false,
    exercise: false,
    sleepBefore11pm: false,
  });
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Use provided date or today's date
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Fetch existing habit data for the date
  const { data: existingHabit, isLoading } = useQuery<DailyHabit | null>({
    queryKey: ["/api/daily-habits", targetDate],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/daily-habits/${targetDate}`);
      return response.json();
    },
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (existingHabit) {
      setHabits({
        eatHealthy: existingHabit.eatHealthy,
        exercise: existingHabit.exercise,
        sleepBefore11pm: existingHabit.sleepBefore11pm,
      });
      setNotes(existingHabit.notes || "");
      setIsEditing(false);
    }
  }, [existingHabit]);

  const saveHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      if (existingHabit) {
        // Update existing habit
        const response = await apiRequest("PATCH", `/api/daily-habits/${targetDate}`, habitData);
        return response.json();
      } else {
        // Create new habit
        const response = await apiRequest("POST", "/api/daily-habits", {
          date: targetDate,
          ...habitData,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-habits", targetDate] });
      toast({
        title: "Life Energy Saved!",
        description: "Your daily habits have been recorded. Keep building your foundation! 💪",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your daily habits. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveHabitMutation.mutate({
      eatHealthy: habits.eatHealthy,
      exercise: habits.exercise,
      sleepBefore11pm: habits.sleepBefore11pm,
      notes: notes,
    });
  };

  const handleHabitToggle = (habit: keyof typeof habits) => {
    setHabits(prev => ({ ...prev, [habit]: !prev[habit] }));
    setIsEditing(true);
  };

  const completedCount = Object.values(habits).filter(Boolean).length;
  const isAllCompleted = completedCount === 3;

      return (
      <Card className="biomorphic-card shadow-lg">

              <CardContent className="space-y-0 p-0 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>

            {/* Habit toggles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4">
                <Apple className="text-primary mb-3" size={24} />
                <Label className="text-sm font-medium text-sage-800 text-center mb-3">{t('habits.eatHealthy')}</Label>
                <Switch
                  checked={habits.eatHealthy}
                  onCheckedChange={() => handleHabitToggle('eatHealthy')}
                />
              </div>

              <div className="flex flex-col items-center p-4">
                <Dumbbell className="text-primary mb-3" size={24} />
                <Label className="text-sm font-medium text-sage-800 text-center mb-3">{t('habits.exercise')}</Label>
                <Switch
                  checked={habits.exercise}
                  onCheckedChange={() => handleHabitToggle('exercise')}
                />
              </div>

              <div className="flex flex-col items-center p-4">
                <Moon className="text-primary mb-3" size={24} />
                <Label className="text-sm font-medium text-sage-800 text-center mb-3">{t('habits.sleepBefore11pm')}</Label>
                <Switch
                  checked={habits.sleepBefore11pm}
                  onCheckedChange={() => handleHabitToggle('sleepBefore11pm')}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 flex justify-center">
              <Input
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNotes(e.target.value);
                  setIsEditing(true);
                }}
                placeholder={t('habits.notes')}
                className="organic-shape border-sage-200 focus:border-primary transition-all duration-300 w-4/5"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {isAllCompleted ? (
                  <>
                    <CheckCircle size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">{t('habits.perfectFoundation')}</span>
                  </>
                ) : (
                  <span className="text-sm text-sage-600">
                    {completedCount}/3 {t('habits.completed')}
                  </span>
                )}
              </div>
              
              <Button
                onClick={handleSave}
                disabled={saveHabitMutation.isPending}
                className="biomorphic-button"
              >
                {saveHabitMutation.isPending ? t('habits.saving') : t('habits.save')}
              </Button>
            </div>


          </>
        )}
      </CardContent>
    </Card>
  );
} 