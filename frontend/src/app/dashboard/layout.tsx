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
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="relative flex items-center justify-center h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-lg font-medium text-foreground tracking-tight">Authenticating</h3>
            <p className="text-sm text-muted-foreground animate-pulse">Setting up your workspace...</p>
          </div>
        </div>
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
