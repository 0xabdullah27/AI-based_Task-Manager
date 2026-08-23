"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  navigationSections,
  getActiveSection,
} from "@/lib/dashboard-navigation";
import { LogOut, CheckSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const activeSection = getActiveSection(pathname);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      setIsSigningOut(false);
    }
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-6 bg-card text-card-foreground">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-2">
        <div className="p-2 rounded-lg bg-primary text-primary-foreground">
          <CheckSquare className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg hidden sm:block text-foreground">
          TaskHub
        </span>
      </Link>

      <Separator />

      {/* User Info */}
      <div className="px-2 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs truncate text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigationSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => router.push(section.href)}
              className={cn(
                "w-full cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <Separator />

      {/* Theme Toggle & Sign Out */}
      <div className="space-y-2">
        <ThemeToggle showLabel className="w-full justify-start px-3 py-2 h-auto" />

        <Button
          onClick={handleSignOut}
          variant="outline"
          disabled={isSigningOut}
          className="w-full justify-start bg-secondary text-secondary-foreground border-border hover:bg-destructive hover:text-destructive-foreground cursor-pointer disabled:opacity-50 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
