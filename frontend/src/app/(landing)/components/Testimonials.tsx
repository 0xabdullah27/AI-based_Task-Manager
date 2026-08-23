"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "The AI agent is a game-changer. I just tell it what I need to do, and it figures out when and how I should do it. It's like having a personal assistant.",
    author: "Sarah Jenkins",
    role: "Product Manager",
    initials: "SJ",
  },
  {
    quote: "I've tried every task manager out there. TaskHub's minimalist design keeps me focused, and the AI prioritization actually works.",
    author: "David Chen",
    role: "Software Engineer",
    initials: "DC",
  },
  {
    quote: "Finally, a to-do list that doesn't make me feel overwhelmed. The automatic tagging saves me hours of manual organization every week.",
    author: "Elena Rodriguez",
    role: "Freelance Designer",
    initials: "ER",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Loved by Teams</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            See how professionals are taking back their time with TaskHub.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="p-8 rounded-2xl bg-muted/20 border border-border/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-foreground text-lg leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/40">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{testimonial.author}</h4>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
