"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Zap, BarChart3, Tags } from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Easy Task Management",
    description:
      "Create, edit, and organize your todos with a clean and intuitive interface.",
  },
  {
    icon: Zap,
    title: "Smart Organization",
    description:
      "Filter and organize tasks by priority levels and custom tags for better productivity.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description:
      "Monitor your productivity with real-time statistics and progress tracking.",
  },
  {
    icon: Tags,
    title: "Tag-Based Filtering",
    description:
      "Use custom tags to categorize and quickly find your tasks.",
  },
];

export function Features() {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to stay organized and productive
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="bg-muted p-3 rounded-lg w-fit border border-border/50">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
