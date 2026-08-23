"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  bgColor?: string;
  textColor?: string;
  progress?: number;
  onClick?: () => void;
  isActive?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  bgColor = "bg-primary/10",
  textColor = "text-primary",
  progress,
  onClick,
  isActive = false,
}: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${
        isActive
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border/70 bg-card hover:border-primary/40"
      }`}
    >
      <CardContent className="p-4 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`${bgColor} p-2.5 rounded-xl flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  {value}
                </span>
                {progress !== undefined && (
                  <span className="text-[11px] font-semibold text-emerald-500">
                    {progress}% done
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar (optional) */}
        {progress !== undefined && (
          <div className="w-full bg-muted/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
