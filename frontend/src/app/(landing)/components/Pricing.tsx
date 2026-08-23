"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for individuals getting started with AI task management.",
    features: [
      "Up to 100 tasks per month",
      "Basic AI prioritization",
      "Standard natural language chat",
      "List and Board views",
      "Community support"
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/month",
    description: "For professionals who need advanced AI capabilities and unlimited organization.",
    features: [
      "Unlimited tasks & projects",
      "Advanced AI context awareness",
      "Custom AI system instructions",
      "Calendar integrations",
      "Priority email support",
      "Early access to new features"
    ],
    cta: "Upgrade to Pro",
    href: "/sign-up",
    highlight: true,
  }
];

export function Pricing() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free, upgrade when you need more power.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div 
              key={tier.name}
              className={`rounded-3xl p-8 border flex flex-col ${
                tier.highlight 
                  ? "border-foreground bg-background shadow-lg relative" 
                  : "border-border/60 bg-muted/10"
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-foreground text-background text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground text-sm h-10">{tier.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-foreground shrink-0" strokeWidth={2.5} />
                    <span className="text-sm text-foreground/80 leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={tier.href} className="w-full mt-auto">
                <Button 
                  className={`w-full py-6 font-semibold rounded-xl ${
                    tier.highlight 
                      ? "bg-foreground hover:bg-foreground/90 text-background" 
                      : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
