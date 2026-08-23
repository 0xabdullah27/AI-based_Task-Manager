"use client";

import { MousePointerClick, Sparkles, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    title: "1. Add Your Tasks",
    description: "Quickly dump everything on your mind into TaskHub. Don't worry about organization yet—just get it out.",
  },
  {
    icon: Sparkles,
    title: "2. Let AI Organize",
    description: "Our AI agent automatically analyzes, tags, and prioritizes your tasks based on urgency and context.",
  },
  {
    icon: CheckCircle2,
    title: "3. Get Things Done",
    description: "Follow your optimized daily plan and check off tasks with satisfaction. Watch your productivity soar.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">How TaskHub Works</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A frictionless workflow designed to get out of your way.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line (hidden on mobile) */}
          <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] bg-border/60 z-0" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-background border-2 border-foreground flex items-center justify-center mb-6 shadow-sm">
                  <Icon className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
