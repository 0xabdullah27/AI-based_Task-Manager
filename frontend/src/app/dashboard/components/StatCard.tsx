"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatVariant = "total" | "completed" | "today" | "overdue";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  variant?: StatVariant;
  progress?: number;
  subtitle?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const VARIANT_CONFIGS: Record<
  StatVariant,
  {
    iconBg: string;
    activeBar: string;
    activeBg: string;
  }
> = {
  total: {
    iconBg: "bg-primary/10 text-primary border border-primary/20",
    activeBar: "bg-primary",
    activeBg: "bg-primary/[0.06]",
  },
  completed: {
    iconBg: "bg-success/10 text-success border border-success/20",
    activeBar: "bg-success",
    activeBg: "bg-success/[0.06]",
  },
  today: {
    iconBg: "bg-warning/10 text-warning border border-warning/20",
    activeBar: "bg-warning",
    activeBg: "bg-warning/[0.06]",
  },
  overdue: {
    iconBg: "bg-destructive/10 text-destructive border border-destructive/20",
    activeBar: "bg-destructive",
    activeBg: "bg-destructive/[0.06]",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "total",
  progress,
  onClick,
  isActive = false,
}: StatCardProps) {
  const config = VARIANT_CONFIGS[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between p-5 rounded-xl border border-border/60 transition-all duration-200 cursor-pointer text-left shadow-sm overflow-hidden",
        isActive
          ? cn(config.activeBg, "shadow-md")
          : "bg-card/60 backdrop-blur-md hover:bg-card/90 hover:border-border"
      )}
    >
      {/* Left Side: Vertical Text Stack */}
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        <p className="text-[12px] font-normal uppercase tracking-wider text-muted-foreground/60 truncate">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] leading-tight font-bold text-foreground group-hover:text-primary transition-colors">
            {value}
          </span>
          {progress !== undefined && (
            <span className="text-[14px] font-semibold text-success">
              ({progress}%)
            </span>
          )}
        </div>
      </div>

      {/* Right Side: Icon wrapped in soft circular bubble */}
      <div
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
          config.iconBg
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Smooth Floating Active State Indicator Bar */}
      {isActive && (
        <div
          className={cn(
            "absolute bottom-0 inset-x-3 h-0.5 rounded-full",
            config.activeBar
          )}
        />
      )}
    </button>
  );
}


