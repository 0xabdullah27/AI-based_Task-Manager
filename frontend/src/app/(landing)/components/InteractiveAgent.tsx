"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, MessageSquare, ArrowRight, Loader2, Bot } from "lucide-react";
import Link from "next/link";

// Load Spline dynamically with ssr: false to prevent Next.js SSR Webpack bundling errors for WebGL/WASM assets
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-10 bg-background/50 backdrop-blur-xs rounded-3xl">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-medium">Loading 3D Interactive Robot...</p>
    </div>
  ),
});

export function InteractiveAgent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[460px] md:min-h-[560px] select-none">
      {/* Outer Ambient Glow Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-primary/30 via-chart-4/20 to-chart-2/30 blur-3xl animate-pulse pointer-events-none" />

      {/* Floating Prompt Bubble */}
      <div
        className="z-20 mb-2 px-5 py-2.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl flex items-center gap-3 text-sm font-semibold text-foreground animate-bounce"
        style={{ animationDuration: "4s" }}
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0 animate-spin" style={{ animationDuration: "6s" }} />
        <span>Move your cursor to interact with the 3D Robot 🤖</span>
      </div>

      {/* 3D Spline Interactive Canvas */}
      <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-10 bg-background/50 backdrop-blur-xs rounded-3xl">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading 3D Interactive Robot...</p>
          </div>
        )}

        {hasError ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-3xl border border-border space-y-4">
            <Bot className="w-16 h-16 text-primary" />
            <p className="text-sm font-medium text-foreground">3D Robot Canvas Active</p>
          </div>
        ) : (
          <Spline
            scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className="w-full h-full rounded-3xl"
          />
        )}
      </div>

      {/* CTA Link to Dashboard Chat */}
      <Link href="/dashboard/chat" className="z-20 mt-2">
        <button className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 cursor-pointer transform hover:scale-105 duration-200">
          <MessageSquare className="w-4 h-4" />
          <span>Chat with AI Agent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
