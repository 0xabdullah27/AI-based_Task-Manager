"use client";

import type { LucideIcon } from "lucide-react";

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
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    activeBg: string;
    activeBorder: string;
  }
> = {
  total: {
    iconBg: "bg-blue-500/15 border border-blue-500/30",
    iconColor: "text-blue-400",
    badgeBg: "bg-blue-500/10 border border-blue-500/20",
    badgeText: "text-blue-400",
    activeBg: "bg-blue-500/10",
    activeBorder: "border-l-4 border-l-blue-500",
  },
  completed: {
    iconBg: "bg-emerald-500/15 border border-emerald-500/30",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border border-emerald-500/20",
    badgeText: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-l-4 border-l-emerald-500",
  },
  today: {
    iconBg: "bg-amber-500/15 border border-amber-500/30",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 border border-amber-500/20",
    badgeText: "text-amber-400",
    activeBg: "bg-amber-500/10",
    activeBorder: "border-l-4 border-l-amber-500",
  },
  overdue: {
    iconBg: "bg-rose-500/15 border border-rose-500/30",
    iconColor: "text-rose-400",
    badgeBg: "bg-rose-500/10 border border-rose-500/20",
    badgeText: "text-rose-400",
    activeBg: "bg-rose-500/10",
    activeBorder: "border-l-4 border-l-rose-500",
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
      className={`group relative flex items-center justify-between px-4 py-3 text-left transition-all duration-200 cursor-pointer ${
        isActive
          ? `${config.activeBg} ${config.activeBorder} font-semibold`
          : "hover:bg-muted/40"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Glowing Icon Container */}
        <div
          className={`flex items-center justify-center p-2 rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${config.iconBg}`}
        >
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>

        {/* Label & Big Value */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors">
              {value}
            </span>
            {progress !== undefined && (
              <span className={`text-[10px] font-bold ${config.badgeText}`}>
                ({progress}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right active pill */}
      {isActive && (
        <span className="ml-2 flex-shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
          Active
        </span>
      )}
    </button>
  );
}
