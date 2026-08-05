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
}

export function StatCard({
  label,
  value,
  icon: Icon,
  bgColor = "bg-primary/10",
  textColor = "text-primary",
  progress,
}: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-lg transition">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Icon */}
          <div className={`${bgColor} p-3 rounded-lg w-fit`}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>

          {/* Content */}
          <div>
            <p className="text-sm  font-medium">
              {label}
            </p>
            <p className="text-3xl font-bold   mt-1">
              {value}
            </p>
          </div>

          {/* Progress Bar (optional) */}
          {progress !== undefined && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
