"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 md:p-8 text-center space-y-6 shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading your tasks."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4" />
              Back to Overview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
