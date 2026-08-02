"use client";

import { useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatCard } from "../components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function OverviewPage() {
  const { tasks, isLoading, fetchTasks } = useTasks();
  const stats = useDashboardStats(tasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completionPercentage = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Header - T063: Use semantic theme variables */}
      <div>
        <h1 className="text-3xl font-bold text-black">
          Dashboard Overview
        </h1>
        <p className="mt-2" >
          Welcome back! Here&apos;s your task summary for today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Tasks"
              value={stats.total}
              icon={BarChart3}
              bgColor="bg-blue-50 dark:bg-blue-900/30"
              textColor="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              bgColor="bg-green-50 dark:bg-green-900/30"
              textColor="text-green-600 dark:text-green-400"
              progress={completionPercentage}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Clock}
              bgColor="bg-yellow-50 dark:bg-yellow-900/30"
              textColor="text-yellow-600 dark:text-yellow-400"
            />
            <StatCard
              label="Today's Tasks"
              value={stats.today}
              icon={Zap}
              bgColor="bg-purple-50 dark:bg-purple-900/30"
              textColor="text-purple-600 dark:text-purple-400"
            />
          </>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && stats.total === 0 && (
        <div className="text-center py-12 rounded-lg">
          <BarChart3 className="h-12 w-12  mx-auto mb-4" />
          <h3 className="text-lg font-semibold  mb-2">
            No tasks yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your first task to get started
          </p>
          <Link href="/dashboard/todos">
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground cursor-pointer">
              Create Task
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      {!isLoading && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/todos">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition cursor-pointer">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                View All Tasks
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage and organize your tasks
              </p>
            </div>
          </Link>
          <Link href="/dashboard/priority">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition cursor-pointer">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                By Priority
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Filter by task priority level
              </p>
            </div>
          </Link>
          <Link href="/dashboard/tags">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition cursor-pointer">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                By Tags
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Organize by custom tags
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
