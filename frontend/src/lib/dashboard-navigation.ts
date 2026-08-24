import { CheckSquare, PlusCircle, MessageSquare, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavigationSection {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

export const navigationSections: NavigationSection[] = [
  {
    id: "tasks",
    label: "Tasks Dashboard",
    icon: CheckSquare,
    href: "/dashboard/todos",
  },
  {
    id: "chat",
    label: "AI Chat Assistant",
    icon: MessageSquare,
    href: "/dashboard/chat",
  },
  {
    id: "create-task",
    label: "Quick Add Task",
    icon: PlusCircle,
    href: "/dashboard/create-task",
  },
  {
    id: "settings",
    label: "AI Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function getActiveSection(pathname: string): string | null {
  for (const section of navigationSections) {
    if (pathname === section.href || (section.href !== "/dashboard" && pathname.startsWith(section.href))) {
      return section.id;
    }
  }
  // Default to tasks if in overview or root dashboard
  if (pathname.startsWith("/dashboard")) {
    return "tasks";
  }
  return null;
}
