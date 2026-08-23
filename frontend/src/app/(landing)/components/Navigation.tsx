"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CheckSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSession } from "@/lib/auth-client";

export function Navigation() {
  const { data: session } = useSession();
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="bg-foreground p-2 rounded-lg">
            <CheckSquare className="w-5 h-5 text-background" />
          </div>
          <span>TaskHub</span>
        </Link>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard">
              <Button className="bg-foreground hover:bg-foreground/90 text-background">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-foreground hover:bg-foreground/90 text-background">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
