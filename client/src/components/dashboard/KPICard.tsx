import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
  icon?: ReactNode;
  accentColor?: "red" | "green" | "amber" | "blue" | "purple";
  className?: string;
}

const accentStyles = {
  red: {
    gradient: "from-red-500/20 to-red-500/5",
    text: "text-red-400",
    glow: "shadow-red-500/10",
    border: "border-red-500/20",
  },
  green: {
    gradient: "from-emerald-500/20 to-emerald-500/5",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/10",
    border: "border-emerald-500/20",
  },
  amber: {
    gradient: "from-amber-500/20 to-amber-500/5",
    text: "text-amber-400",
    glow: "shadow-amber-500/10",
    border: "border-amber-500/20",
  },
  blue: {
    gradient: "from-blue-500/20 to-blue-500/5",
    text: "text-blue-400",
    glow: "shadow-blue-500/10",
    border: "border-blue-500/20",
  },
  purple: {
    gradient: "from-purple-500/20 to-purple-500/5",
    text: "text-purple-400",
    glow: "shadow-purple-500/10",
    border: "border-purple-500/20",
  },
};

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  accentColor = "red",
  className,
}: KPICardProps) {
  const accent = accentStyles[accentColor];

  return (
    <div
      className={cn(
        "md-kpi-card group relative",
        "hover:border-white/10 transition-all duration-300",
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          `bg-gradient-to-br ${accent.gradient}`
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm font-medium text-white/60">{title}</span>
          {icon && (
            <div className={cn("p-2 rounded-lg bg-white/5", accent.text)}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-end gap-3">
          <span className={cn("text-4xl font-bold", accent.text)}>{value}</span>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm mb-1",
                trend.direction === "up" ? "text-emerald-400" : "text-red-400"
              )}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {trend.direction === "up" ? "+" : "-"}
                {Math.abs(trend.value)}
              </span>
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-white/40 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default KPICard;
