import type { Metadata } from "next";
import { TasksProvider } from "@/providers/tasks-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TaskCortex",
  description: "A modern todo application with authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TasksProvider>
            {children}
          </TasksProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
