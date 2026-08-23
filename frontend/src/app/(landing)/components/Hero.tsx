"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { InteractiveAgent } from "./InteractiveAgent";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-background text-foreground px-4 py-16 overflow-hidden">
      {/* Background Effects (subdued for Notion style) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-muted/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-muted/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Headline & CTAs (7 columns on desktop) */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border/60 text-xs font-semibold text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-foreground/70" />
            <span>Next-Gen AI Task Management</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Master Your Workflow with{" "}
            <span className="text-foreground border-b-2 border-foreground/20">
              Intelligent AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
            Organize tasks, manage priorities, and chat in natural language with your personal AI agent. Effortless productivity built for modern teams.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-2">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background px-8 py-6 text-base font-semibold shadow-sm cursor-pointer rounded-xl"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-muted text-foreground px-8 py-6 text-base font-semibold cursor-pointer rounded-xl"
              >
                Sign In to Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-6 border-t border-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-foreground/70" />
              <span>Real-time AI Chat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-foreground/70" />
              <span>Instant Task Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-foreground/70" />
              <span>Secure Authentication</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive AI Mascot Agent (5 columns on desktop) */}
        <div className="lg:col-span-5 flex justify-center">
          <InteractiveAgent />
        </div>
      </div>
    </section>
  );
}
