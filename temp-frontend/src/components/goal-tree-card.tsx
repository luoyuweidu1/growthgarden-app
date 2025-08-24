import { Check, ArrowUp, AlertTriangle, Heart, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { calculateTreeHealth } from "@/lib/tree-health";
import { cn } from "@/lib/utils";
import { GoalActionsModal } from "./goal-actions-modal";
import { useState } from "react";
// Define types locally since we removed shared schema
interface Goal {
  id: string;
  name: string;
  plantType: string;
  currentLevel?: number;
  currentXP?: number;
  maxXP?: number;
  status?: string;
  lastWatered?: string | Date;
}

interface Action {
  id: string;
  goalId: string;
  title: string;
  status: string;
}

interface GoalTreeCardProps {
  goal: Goal;
  actions?: Action[];
}

const plantEmojis: Record<string, string> = {
  sprout: "🌱",
  herb: "🌿",
  tree: "🌳",
  flower: "🌸",
};

const getPlantVisualization = (goal: Goal) => {
  // If the goal is withered, show a withered version of the plant type
  if (goal.status === 'withered') {
    switch (goal.plantType) {
      case 'flower': return '🥀';
      case 'tree': return '🌳';
      case 'herb': return '🌿';
      case 'sprout': return '🌱';
      default: return '🥀';
    }
  }
  
  const plantType = goal.plantType;
  const level = goal.currentLevel;
  
  // Define growth stages for each plant type
  const growthStages: Record<string, string[]> = {
    sprout: ['🌱', '🌿', '🌱🌿', '🌱🌿🌱'],
    herb: ['🌿', '🌱🌿', '🌿🌱🌿', '🌿🌱🌿🌱'],
    tree: ['🌱', '🌿', '🌳', '🌳🌿'],
    flower: ['🌸', '🌸🌿', '🌸🌿🌸', '🌸🌿🌸🌿'],
  };
  
  // Get the appropriate growth stage based on level
  const stages = growthStages[plantType] || growthStages.sprout;
  const stageIndex = Math.min(level - 1, stages.length - 1);
  
  return stages[stageIndex];
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
    return "bg-gradient-to-br from-red-50/80 to-red-100/60 border-red-200/50";
  }
  if (health.status === 'warning') {
    return "bg-gradient-to-br from-orange-50/80 to-orange-100/60 border-orange-200/50";
  }
  if (goal.currentLevel >= 5) {
    return "bg-gradient-to-br from-forest-50/80 to-forest-100/60 border-forest-200/50";
  }
  if (goal.currentLevel >= 3) {
    return "bg-gradient-to-br from-moss-50/80 to-moss-100/60 border-moss-200/50";
  }
  if (goal.currentLevel >= 1) {
    return "bg-gradient-to-br from-sage-50/80 to-sage-100/60 border-sage-200/50";
  }
  return "bg-gradient-to-br from-clay-50/80 to-clay-100/60 border-clay-200/50";
};

const getProgressColor = (goal: Goal) => {
  const health = calculateTreeHealth(goal.lastWatered);
  
  if (goal.status === 'withered') return "bg-gradient-to-r from-red-500 to-red-600";
  if (health.status === 'warning') return "bg-gradient-to-r from-orange-500 to-orange-600";
  if (goal.currentLevel >= 5) return "bg-gradient-to-r from-forest-500 to-moss-500";
  if (goal.currentLevel >= 3) return "bg-gradient-to-r from-moss-500 to-sage-500";
  if (goal.currentLevel >= 1) return "bg-gradient-to-r from-sage-500 to-stone-500";
  return "bg-gradient-to-r from-clay-500 to-stone-500";
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

const getPlantTypeName = (plantType: string) => {
  switch (plantType) {
    case 'sprout': return 'Sprout';
    case 'herb': return 'Herb';
    case 'tree': return 'Tree';
    case 'flower': return 'Flower';
    default: return 'Plant';
  }
};

export function GoalTreeCard({ goal, actions = [] }: GoalTreeCardProps) {
  const health = calculateTreeHealth(goal.lastWatered);
  const progressPercentage = (goal.currentXP / goal.maxXP) * 100;
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);

  // Filter actions for this specific goal
  const goalActions = actions.filter(action => action.goalId === goal.id);

  const handleCardClick = () => {
    setIsActionsModalOpen(true);
  };

  return (
    <>
      <Card 
        className={cn(
          "flex flex-col items-center space-y-4 p-4 organic-shape border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer backdrop-blur-sm",
          getCardStyles(goal)
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-0 flex flex-col items-center space-y-4">
          <div className="relative">
            <div className={cn(
              "w-20 h-20 flex items-center justify-center text-6xl",
              goal.status === 'withered' ? "animate-wither" : 
              goal.currentLevel >= 5 ? "animate-pulse-slow" :
              goal.currentLevel >= 1 ? "animate-bounce-subtle" : ""
            )}>
              {getPlantVisualization(goal)}
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white/90 backdrop-blur-sm organic-shape flex items-center justify-center border-2 border-current shadow-sm">
              {getStatusIcon(goal)}
            </div>
          </div>
          
          <div className="text-center w-full">
            <h3 className="font-semibold text-sage-800 text-sm">{goal.name}</h3>
            <p className="text-xs text-sage-600 mt-1">
              {getPlantTypeName(goal.plantType)} • Level {goal.currentLevel} • {getStatusText(goal)}
            </p>
            <div className="w-full bg-sage-200/50 rounded-full h-2 mt-2">
              <div 
                className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(goal))}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <GoalActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
        goal={goal}
        actions={goalActions}
      />
    </>
  );
}
