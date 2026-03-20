import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    direction?: "up" | "down" | "neutral";
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      title,
      value,
      subtitle,
      icon: Icon,
      trend,
      variant = "default",
      size = "md",
      onClick,
      ...props
    },
    ref
  ) => {
    const getTrendIcon = () => {
      if (!trend) return null;
      const direction = trend.direction || (trend.value >= 0 ? "up" : "down");
      switch (direction) {
        case "up":
          return <TrendingUp className="h-3.5 w-3.5" />;
        case "down":
          return <TrendingDown className="h-3.5 w-3.5" />;
        default:
          return <Minus className="h-3.5 w-3.5" />;
      }
    };

    const getTrendColor = () => {
      if (!trend) return "";
      const direction = trend.direction || (trend.value >= 0 ? "up" : "down");
      switch (direction) {
        case "up":
          return "text-success";
        case "down":
          return "text-destructive";
        default:
          return "text-muted-foreground";
      }
    };

    const getVariantStyles = () => {
      switch (variant) {
        case "primary":
          return "border-primary/20 bg-primary/5";
        case "success":
          return "border-success/20 bg-success/5";
        case "warning":
          return "border-warning/20 bg-warning/5";
        case "destructive":
          return "border-destructive/20 bg-destructive/5";
        default:
          return "bg-card";
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case "sm":
          return { value: "text-xl", padding: "p-4" };
        case "lg":
          return { value: "text-4xl", padding: "p-6" };
        default:
          return { value: "text-2xl", padding: "p-5" };
      }
    };

    const sizeStyles = getSizeStyles();

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border shadow-card transition-card hover:shadow-card-hover",
          sizeStyles.padding,
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-label truncate">{title}</p>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-bold tracking-tight tabular-nums leading-none",
                  sizeStyles.value
                )}
              >
                {value}
              </span>
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    getTrendColor()
                  )}
                >
                  {getTrendIcon()}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {(subtitle || trend?.label) && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle || trend?.label}
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex-shrink-0 p-2 rounded-lg bg-muted/50">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  }
);
MetricCard.displayName = "MetricCard";

export { MetricCard };
export type { MetricCardProps };
