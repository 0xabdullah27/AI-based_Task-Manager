"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { Sparkles, MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

// Set this to true in the future if you want to re-enable the 3D Chatbot mascot!
const ENABLE_3D_BOT = false;

// Declare custom element for React 19 TypeScript
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "spline-viewer": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement> & { url?: string; class?: string },
          HTMLElement
        >;
      }
    }
  }
}

export function InteractiveAgent() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!ENABLE_3D_BOT) return;

    // Check if custom element is already defined in window
    if (typeof window !== "undefined" && customElements.get("spline-viewer")) {
      setScriptLoaded(true);
    }

    // Hide "Built with Spline" watermark logo inside shadowRoot
    const hideSplineLogo = () => {
      const viewer = document.querySelector("spline-viewer");
      if (viewer && viewer.shadowRoot) {
        const logo =
          viewer.shadowRoot.querySelector("#logo") ||
          viewer.shadowRoot.querySelector("a[href*='spline']");
        if (logo) {
          (logo as HTMLElement).style.display = "none";
        }
      }
    };

    const interval = setInterval(hideSplineLogo, 100);
    return () => clearInterval(interval);
  }, []);

  if (!ENABLE_3D_BOT) {
    return null;
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-[460px] md:min-h-[560px] select-none">
      {/* 
        ========================================================================
        3D CHATBOT BOT MASCOT & INTERACTIVE UI (DISABLED FOR NOW)
        To re-enable: Set ENABLE_3D_BOT = true at the top of this file.
        ========================================================================
      */}

      {/* Script to load Spline Web Component without Turbopack WASM bundling errors */}
      <Script
        src="https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js"
        type="module"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Outer Ambient Glow Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-primary/30 via-chart-4/20 to-chart-2/30 blur-3xl animate-pulse pointer-events-none" />

      {/* Floating Prompt Bubble */}
      {/* 
      <div
        className="z-20 mb-2 px-5 py-2.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl flex items-center gap-3 text-sm font-semibold text-foreground animate-bounce"
        style={{ animationDuration: "4s" }}
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0 animate-spin" style={{ animationDuration: "6s" }} />
        <span>Move your cursor to interact with the 3D Robot 🤖</span>
      </div> 
      */}

      {/* 3D Spline Interactive Canvas */}
      {/* 
      <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center rounded-3xl overflow-hidden">
        {!scriptLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground z-10 bg-background/50 backdrop-blur-xs rounded-3xl">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading 3D Interactive Robot...</p>
          </div>
        )}

        <spline-viewer
          url="https://prod.spline.design/fhRFWr5h6pUAtLxO/scene.splinecode"
          class="w-full h-full rounded-3xl"
        />
      </div> 
      */}

      {/* CTA Link to Dashboard Chat */}
      {/* 
      <Link href="/dashboard/chat" className="z-20 mt-2">
        <button className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 cursor-pointer transform hover:scale-105 duration-200">
          <MessageSquare className="w-4 h-4" />
          <span>Chat with AI Agent</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link> 
      */}
    </div>
  );
}
