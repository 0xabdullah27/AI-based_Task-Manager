"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Bot } from "lucide-react";

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/40 to-background text-foreground px-4 py-20">
      <div className="max-w-4xl text-center space-y-8">
        {/* Illustration/Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-primary/20 p-6 rounded-full">
            <Bot className="w-24 h-24 text-primary" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Organize Your Tasks with <span className="text-primary">Ease</span>
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A modern, intuitive todo application designed to help you stay organized and focused on what matters most.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 px-8"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
