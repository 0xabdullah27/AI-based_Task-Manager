"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  navigationSections,
  getActiveSection,
} from "@/lib/dashboard-navigation";
import { LogOut, ChevronsUpDown, Plus } from "lucide-react";
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

  const workspaceName = session?.user?.name
    ? `${session.user.name.split(" ")[0]}'s Workspace`
    : "My Workspace";

  return (
    <div className="h-full flex flex-col overflow-y-auto p-2 bg-sidebar text-sidebar-foreground">
      {/* Workspace Selector (Notion Style) */}
      <div className="flex items-center gap-2 px-2 py-3 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors mt-2">
        <div className="h-5 w-5 flex items-center justify-center rounded-[3px] bg-foreground text-background text-[10px] font-bold">
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground leading-tight">
            {workspaceName}
          </p>
          <p className="text-[11px] truncate text-muted-foreground leading-tight">
            Free Plan
          </p>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
      </div>

      <div className="h-4" /> {/* Spacer */}

      {/* Navigation */}
      <nav className="flex-1 space-y-[2px]">
        {navigationSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => router.push(section.href)}
              className={cn(
                "w-full cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} strokeWidth={1.5} />
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-[2px] mt-auto pt-4 pb-2">
        <ThemeToggle showLabel className="w-full justify-start px-3 py-1.5 h-auto text-muted-foreground hover:bg-sidebar-accent hover:text-foreground rounded-md transition-colors" />

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:opacity-50 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          <span className="truncate">{isSigningOut ? "Signing out..." : "Log out"}</span>
        </button>
      </div>
    </div>
  );
}
