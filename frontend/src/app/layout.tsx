import type { Metadata } from "next";
import { AuthProvider } from "@/providers/auth-provider";
import { TasksProvider } from "@/providers/tasks-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Todo App",
  description: "A modern todo application with authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <TasksProvider>
            {children}
          </TasksProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
