import { Check, ArrowUp, AlertTriangle, Heart, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateTreeHealth } from "@/lib/tree-health";
import { cn } from "@/lib/utils";
import type { Goal } from "@shared/schema";

interface GoalTreeCardProps {
  goal: Goal;
}

const plantEmojis = {
  sprout: "🌱",
  herb: "🌿",
  tree: "🌳",
  flower: "🌸",
};

const getTreeVisualization = (goal: Goal) => {
  if (goal.status === 'withered') return '🥀';
  if (goal.currentLevel >= 5) return '🌳';
  if (goal.currentLevel >= 3) return '🌿';
  if (goal.currentLevel >= 1) return '🌱';
  return '🌰';
};

const getStatusIcon = (goal: Goal) => {
  const health = calculateTreeHealth(goal.lastWatered);
  
  if (goal.status === 'withered') return <AlertTriangle className="text-red-500" size={12} />;
  if (health.status === 'warning') return <AlertTriangle className="text-orange-500" size={12} />;
  if (goal.currentLevel >= 5) return <Check className="text-forest-500" size={12} />;
  if (goal.currentLevel >= 3) return <Heart className="text-purple-500" size={12} />;
  if (goal.currentLevel >= 1) return <ArrowUp className="text-blue-500" size={12} />;
  return <Clock className="text-earth-500" size={12} />;
};

const getCardStyles = (goal: Goal) => {
  const health = calculateTreeHealth(goal.lastWatered);
  
  if (goal.status === 'withered') {
    return "bg-gradient-to-b from-red-50 to-red-100 border-red-200";
  }
  if (health.status === 'warning') {
    return "bg-gradient-to-b from-orange-50 to-orange-100 border-orange-200";
  }
  if (goal.currentLevel >= 5) {
    return "bg-gradient-to-b from-forest-50 to-forest-100 border-forest-200";
  }
  if (goal.currentLevel >= 3) {
    return "bg-gradient-to-b from-purple-50 to-purple-100 border-purple-200";
  }
  if (goal.currentLevel >= 1) {
    return "bg-gradient-to-b from-blue-50 to-blue-100 border-blue-200";
  }
  return "bg-gradient-to-b from-earth-50 to-earth-100 border-earth-200";
};

const getProgressColor = (goal: Goal) => {
  const health = calculateTreeHealth(goal.lastWatered);
  
  if (goal.status === 'withered') return "bg-red-500";
  if (health.status === 'warning') return "bg-orange-500";
  if (goal.currentLevel >= 5) return "bg-forest-500";
  if (goal.currentLevel >= 3) return "bg-purple-500";
  if (goal.currentLevel >= 1) return "bg-blue-500";
  return "bg-earth-500";
};

const getStatusText = (goal: Goal) => {
  const health = calculateTreeHealth(goal.lastWatered);
  
  if (goal.status === 'withered') return "Withered";
  if (health.status === 'warning') return `Needs water in ${Math.ceil(health.hoursUntilDeath)}h`;
  if (goal.currentLevel >= 5) return "Thriving";
  if (goal.currentLevel >= 3) return "Healthy";
  if (goal.currentLevel >= 1) return "Growing";
  return "Just planted";
};

export function GoalTreeCard({ goal }: GoalTreeCardProps) {
  const health = calculateTreeHealth(goal.lastWatered);
  const progressPercentage = (goal.currentXP / goal.maxXP) * 100;

  return (
    <Card className={cn(
      "flex flex-col items-center space-y-4 p-4 rounded-2xl border hover:shadow-lg transition-all duration-300 cursor-pointer",
      getCardStyles(goal)
    )}>
      <CardContent className="p-0 flex flex-col items-center space-y-4">
        <div className="relative">
          <div className={cn(
            "w-20 h-20 flex items-center justify-center text-6xl",
            goal.status === 'withered' ? "animate-wither" : 
            goal.currentLevel >= 5 ? "animate-pulse-slow" :
            goal.currentLevel >= 1 ? "animate-bounce-subtle" : ""
          )}>
            {getTreeVisualization(goal)}
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-current">
            {getStatusIcon(goal)}
          </div>
        </div>
        
        <div className="text-center w-full">
          <h3 className="font-semibold text-slate-800 text-sm">{goal.name}</h3>
          <p className="text-xs text-slate-600 mt-1">
            Level {goal.currentLevel} • {getStatusText(goal)}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(goal))}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
