import { Sprout, Check, Network, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: 'seedling' | 'check' | 'tree' | 'alert';
  color: 'forest' | 'blue' | 'purple' | 'orange';
}

const iconMap = {
  seedling: Sprout,
  check: Check,
  tree: Network,
  alert: AlertTriangle,
};

const colorMap = {
  forest: {
    bg: "bg-gradient-to-br from-forest-100/80 to-forest-200/60",
    text: "text-forest-600",
    value: "text-forest-700",
    border: "border-forest-200/50",
  },
  blue: {
    bg: "bg-gradient-to-br from-sage-100/80 to-sage-200/60", 
    text: "text-sage-600",
    value: "text-sage-700",
    border: "border-sage-200/50",
  },
  purple: {
    bg: "bg-gradient-to-br from-moss-100/80 to-moss-200/60",
    text: "text-moss-600", 
    value: "text-moss-700",
    border: "border-moss-200/50",
  },
  orange: {
    bg: "bg-gradient-to-br from-clay-100/80 to-clay-200/60",
    text: "text-clay-600",
    value: "text-clay-700",
    border: "border-clay-200/50",
  },
};

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const Icon = iconMap[icon];
  const colorStyles = colorMap[color];

  return (
    <div className="biomorphic-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-sage-600 mb-1">{title}</p>
          <p className={cn("text-2xl font-semibold", colorStyles.value)}>{value}</p>
        </div>
        <div className={cn("p-3 organic-shape shadow-sm", colorStyles.bg)}>
          <Icon className={cn("text-lg", colorStyles.text)} size={20} />
        </div>
      </div>
    </div>
  );
}
