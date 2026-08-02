"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  navigationSections,
  getActiveSection,
} from "@/lib/dashboard-navigation";
import { LogOut, CheckSquare } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const activeSection = getActiveSection(pathname);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="h-full flex flex-col overflow-y-auto p-4 space-y-6">
      {/* Logo - T021: Use primary color variable */}
      <div className="flex items-center gap-2 px-2">
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <CheckSquare className="w-5 h-5" />
        </div>
        <span
          className="font-bold text-lg hidden sm:block"
          style={{ color: "var(--foreground)" }}
        >
          TaskHub
        </span>
      </div>

      <Separator style={{ backgroundColor: "var(--border)" }} />

      {/* User Info */}
      <div className="px-2 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--foreground)" }}
            >
              {session?.user?.name || "User"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--muted-foreground)" }}
            >
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      <Separator style={{ backgroundColor: "var(--border)" }} />

      {/* Navigation - T023: Use semantic variables with proper states */}
      <nav className="flex-1 space-y-2">
        {navigationSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => router.push(section.href)}
              style={
                isActive
                  ? {
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }
                  : {
                      color: "var(--muted-foreground)",
                    }
              }
              className={`w-full   flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80`}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "var(--border)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }
              }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <Separator style={{ backgroundColor: "var(--border)" }} />

      {/* Sign Out Button - T054: Use semantic theme variables */}
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="bg-secondary text-secondary-foreground cursor-pointer hover:bg-primary/80"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
