"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Sparkles, MessageSquare, ArrowRight, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";

export function InteractiveAgent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const prompts = [
    "✨ Hi! I'm your AI Task Assistant.",
    "🚀 Ask me: 'Create high priority task for 4 PM'",
    "⚡ I can auto-categorize and tag your tasks!",
    "💡 'Remind me to submit project on Friday'",
  ];

  // Rotate prompts automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [prompts.length]);

  // Track Mouse Movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize position from -1 to 1 relative to center of screen
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Track Scroll Movement
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate 3D transforms
  const rotateX = -mousePos.y * 15; // Pitch angle (-15deg to 15deg)
  const rotateY = mousePos.x * 20;  // Yaw angle (-20deg to 20deg)
  const eyeX = mousePos.x * 8;       // Eye tracking offset
  const eyeY = mousePos.y * 6;
  const parallaxY = scrollY * 0.15;  // Scroll offset effect

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center py-10 transition-transform duration-300 ease-out select-none"
      style={{
        transform: `translateY(${parallaxY}px)`,
      }}
    >
      {/* Outer Glow Halo */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-primary/30 via-chart-2/20 to-chart-4/30 blur-3xl animate-pulse pointer-events-none" />

      {/* Floating Thought Bubble */}
      <div
        className="mb-6 px-5 py-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 flex items-center gap-3 transition-all duration-500 max-w-xs text-sm font-medium text-foreground transform hover:scale-105 cursor-pointer"
        style={{
          transform: `translate3d(${mousePos.x * -10}px, ${mousePos.y * -8}px, 0)`,
        }}
      >
        <Sparkles className="w-4 h-4 text-primary shrink-0 animate-spin" style={{ animationDuration: "6s" }} />
        <span className="truncate transition-all duration-300">
          {prompts[currentPromptIndex]}
        </span>
      </div>

      {/* Main 3D Agent Avatar Container */}
      <div
        className="relative group cursor-pointer"
        style={{
          perspective: "1000px",
        }}
      >
        {/* 3D Tilt Wrapper */}
        <div
          className="relative w-36 h-36 md:w-44 md:h-44 rounded-3xl p-1 bg-gradient-to-tr from-primary via-chart-4 to-chart-2 shadow-2xl shadow-primary/40 transition-transform duration-150 ease-out flex items-center justify-center"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Inner Glass Body */}
          <div className="w-full h-full rounded-[22px] bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-4 relative overflow-hidden border border-white/10">
            {/* Ambient Inner Light Spill */}
            <div
              className="absolute w-24 h-24 rounded-full bg-primary/20 blur-xl transition-all duration-200"
              style={{
                transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
              }}
            />

            {/* Robot Head / Eyes */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Antenna */}
              <div className="w-2 h-4 bg-primary rounded-full mb-1 animate-bounce" style={{ animationDuration: "2s" }} />

              {/* Face Visor */}
              <div className="w-20 h-10 md:w-24 md:h-12 bg-black/80 rounded-2xl border border-primary/40 flex items-center justify-around px-3 shadow-inner">
                {/* Left Eye */}
                <div
                  className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary shadow-lg shadow-primary transition-transform duration-75 flex items-center justify-center"
                  style={{
                    transform: `translate(${eyeX}px, ${eyeY}px)`,
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>

                {/* Right Eye */}
                <div
                  className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-primary shadow-lg shadow-primary transition-transform duration-75 flex items-center justify-center"
                  style={{
                    transform: `translate(${eyeX}px, ${eyeY}px)`,
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
              </div>

              {/* Smile LED Line */}
              <div className="w-8 h-1 bg-chart-2/80 rounded-full mt-2 animate-pulse" />
            </div>

            {/* Glowing Active Status Badge */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-full border border-border text-[10px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-success animate-ping" />
              <span className="text-foreground">AI Active</span>
            </div>
          </div>
        </div>

        {/* Orbiting Feature Badges */}
        <div
          className="absolute -top-3 -right-6 px-3 py-1 bg-card/90 backdrop-blur-md rounded-full border border-border shadow-lg text-xs font-semibold text-foreground flex items-center gap-1 transition-transform duration-200"
          style={{
            transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 10}px, 30px)`,
          }}
        >
          <Zap className="w-3.5 h-3.5 text-chart-4" />
          <span>Real-time AI</span>
        </div>

        <div
          className="absolute -bottom-3 -left-6 px-3 py-1 bg-card/90 backdrop-blur-md rounded-full border border-border shadow-lg text-xs font-semibold text-foreground flex items-center gap-1 transition-transform duration-200"
          style={{
            transform: `translate3d(${mousePos.x * -12}px, ${mousePos.y * -10}px, 30px)`,
          }}
        >
          <CheckCircle className="w-3.5 h-3.5 text-success" />
          <span>Smart Tasks</span>
        </div>
      </div>

      {/* Floating CTA Link to Chat */}
      <Link href="/dashboard/chat" className="mt-6">
        <button className="px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-semibold text-xs transition flex items-center gap-2 shadow-md hover:shadow-primary/20 cursor-pointer">
          <MessageSquare className="w-4 h-4" />
          <span>Chat with AI Agent</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </Link>
    </div>
  );
}
