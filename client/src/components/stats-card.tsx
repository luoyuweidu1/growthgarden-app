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
    bg: "bg-forest-100",
    text: "text-forest-600",
    value: "text-forest-600",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    value: "text-blue-600",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    value: "text-purple-600",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    value: "text-orange-600",
  },
};

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const Icon = iconMap[icon];
  const colorStyles = colorMap[color];

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">{title}</p>
            <p className={cn("text-2xl font-bold", colorStyles.value)}>{value}</p>
          </div>
          <div className={cn("p-3 rounded-full", colorStyles.bg)}>
            <Icon className={cn("text-xl", colorStyles.text)} size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
