"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function CTA() {
  const { data: session } = useSession();

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-muted/30 rounded-[100%] blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-muted mb-8 border border-border/50 shadow-sm">
          <Sparkles className="w-8 h-8 text-foreground" />
        </div>
        
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Ready to supercharge your productivity?
        </h2>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of professionals who have already reclaimed their time. Setup takes less than 30 seconds.
        </p>
        
        {session ? (
          <Link href="/dashboard">
            <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-10 py-7 text-lg font-semibold rounded-2xl shadow-sm">
              <span>Go to your Dashboard</span>
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
        ) : (
          <Link href="/sign-up">
            <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background px-10 py-7 text-lg font-semibold rounded-2xl shadow-sm">
              <span>Get Started for Free</span>
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
