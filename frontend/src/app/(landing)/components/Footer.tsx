"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card text-muted-foreground py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">TaskCortex</h3>
            <p className="text-sm">
              Modern task management for productive teams.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="hover:text-foreground transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-foreground transition">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://github.com/0xabdullah27/TaskCortex" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://github.com/0xabdullah27/TaskCortex/issues" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">
                  Report an Issue
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://github.com/0xabdullah27" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition">
                  Developer Profile
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border mb-8" />

        <div className="text-center text-sm">
          <p>
            &copy; {currentYear} TaskCortex. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
