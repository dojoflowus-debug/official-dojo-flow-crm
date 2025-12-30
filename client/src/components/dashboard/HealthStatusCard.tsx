import { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type HealthStatus = "healthy" | "warning" | "risk";

interface HealthStatusCardProps {
  status: HealthStatus;
  count: number;
  label: string;
  onClick?: () => void;
  className?: string;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    bgClass: "md-health-healthy",
    textColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    label: "Healthy",
    glowColor: "hover:shadow-emerald-500/20",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "md-health-warning",
    textColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
    label: "Needs Attention",
    glowColor: "hover:shadow-amber-500/20",
  },
  risk: {
    icon: XCircle,
    bgClass: "md-health-risk",
    textColor: "text-red-400",
    iconBg: "bg-red-500/20",
    label: "At Risk",
    glowColor: "hover:shadow-red-500/20",
  },
};

export function HealthStatusCard({
  status,
  count,
  label,
  onClick,
  className,
}: HealthStatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "md-glass-card p-6 text-left w-full transition-all duration-300",
        config.bgClass,
        config.glowColor,
        "hover:shadow-lg",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", config.iconBg)}>
          <Icon className={cn("w-6 h-6", config.textColor)} />
        </div>
        <div>
          <p className="text-sm text-white/60">{label || config.label}</p>
          <p className={cn("text-3xl font-bold mt-1", config.textColor)}>
            {count}
          </p>
        </div>
      </div>
    </button>
  );
}

export default HealthStatusCard;
