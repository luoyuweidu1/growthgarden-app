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
    bg: "bg-green-100",
    text: "text-green-600",
    value: "text-green-700",
  },
  blue: {
    bg: "bg-blue-100", 
    text: "text-blue-600",
    value: "text-blue-700",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600", 
    value: "text-purple-700",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    value: "text-orange-700",
  },
};

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const Icon = iconMap[icon];
  const colorStyles = colorMap[color];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={cn("text-2xl font-semibold", colorStyles.value)}>{value}</p>
        </div>
        <div className={cn("p-3 rounded-full", colorStyles.bg)}>
          <Icon className={cn("text-lg", colorStyles.text)} size={20} />
        </div>
      </div>
    </div>
  );
}
