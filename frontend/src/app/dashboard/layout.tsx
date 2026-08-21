"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, getJwtToken } from "@/lib/auth-client";
import { Sidebar } from "./components/Sidebar";
import { DashboardNav } from "./components/DashboardNav";
import { MobileMenu } from "./components/MobileMenu";
import { ChatProvider } from "@/providers/chat-provider";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }

    // Log auth token and user ID on dashboard entry
    if (session) {
      const token = getJwtToken();
      console.log("🔑 [Dashboard] JWT Token:", token);
      console.log("👤 [Dashboard] User ID:", session.user?.id);
      console.log("👤 [Dashboard] User Email:", session.user?.email);
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ChatProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border">
          <Sidebar />
        </aside>

        {/* Mobile Menu */}
        <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Main Content */}
        <div className="md:ml-64">
          {/* Top Navigation */}
          <DashboardNav onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

          {/* Page Content */}
          <main className="p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
