"use client";

import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardNav } from "./components/DashboardNav";
import { MobileMenu } from "./components/MobileMenu";
import { ChatProvider } from "@/providers/chat-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
