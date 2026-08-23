/**
 * Theme Color Verification Tests
 * Feature: Pure Tailwind CSS theming and semantic variables
 */

import fs from 'fs';
import path from 'path';

const globalsCss = fs.readFileSync(
  path.resolve(__dirname, '../../src/app/globals.css'),
  'utf8'
);

function parseCssVariables(cssContent: string) {
  const rootMatch = cssContent.match(/:root\s*\{([\s\S]*?)\n\}/);
  const darkMatch = cssContent.match(/\.dark\s*\{([\s\S]*?)\n\}/);

  const extractVars = (block: string | undefined) => {
    const vars: Record<string, string> = {};
    if (!block) return vars;
    const lines = block.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
      if (match) {
        vars[match[1].trim()] = match[2].trim();
      }
    }
    return vars;
  };

  return {
    root: extractVars(rootMatch?.[1]),
    dark: extractVars(darkMatch?.[1]),
  };
}

const parsedThemeVars = parseCssVariables(globalsCss);

export function getCSSVariableValue(variableName: string): string {
  const isDark = document.documentElement.classList.contains('dark');
  const source = isDark ? parsedThemeVars.dark : parsedThemeVars.root;
  return source[variableName] || '';
}

export function parseOklchColor(oklchString: string): {
  l: number;
  c: number;
  h: number;
} | null {
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return null;

  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  };
}

export function calculateLuminance(oklchString: string): number {
  const parsed = parseOklchColor(oklchString);
  if (!parsed) return 0.5;
  return parsed.l;
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAGAA(contrastRatio: number): boolean {
  return contrastRatio >= 4.0;
}

describe("Theme Variables - Definition", () => {
  const expectedVariables = {
    priority: [
      "--priority-high",
      "--priority-high-foreground",
      "--priority-medium",
      "--priority-medium-foreground",
      "--priority-low",
      "--priority-low-foreground",
    ],
    status: [
      "--destructive",
      "--success",
      "--warning",
      "--info",
    ],
    core: [
      "--background",
      "--foreground",
      "--primary",
      "--secondary",
      "--border",
      "--card",
    ],
  };

  beforeEach(() => {
    document.documentElement.classList.remove("dark");
  });

  test("Light mode: All priority variables are defined", () => {
    expectedVariables.priority.forEach((varName) => {
      const value = getCSSVariableValue(varName);
      expect(value).toBeTruthy();
      expect(value).toMatch(/oklch\(/);
    });
  });

  test("Light mode: All status variables are defined", () => {
    expectedVariables.status.forEach((varName) => {
      const value = getCSSVariableValue(varName);
      expect(value).toBeTruthy();
      expect(value).toMatch(/oklch\(/);
    });
  });

  test("Dark mode: All priority variables are defined", () => {
    document.documentElement.classList.add("dark");

    expectedVariables.priority.forEach((varName) => {
      const value = getCSSVariableValue(varName);
      expect(value).toBeTruthy();
      expect(value).toMatch(/oklch\(/);
    });

    document.documentElement.classList.remove("dark");
  });

  test("Dark mode: All status variables are defined", () => {
    document.documentElement.classList.add("dark");

    expectedVariables.status.forEach((varName) => {
      const value = getCSSVariableValue(varName);
      expect(value).toBeTruthy();
      expect(value).toMatch(/oklch\(/);
    });

    document.documentElement.classList.remove("dark");
  });
});

describe("Theme Variables - Theme Switching", () => {
  test("CSS variables update when switching to dark mode", () => {
    document.documentElement.classList.remove("dark");
    const lightForeground = getCSSVariableValue("--foreground");

    document.documentElement.classList.add("dark");
    const darkForeground = getCSSVariableValue("--foreground");

    expect(lightForeground).not.toBe(darkForeground);
    document.documentElement.classList.remove("dark");
  });

  test("Primary colors adapt to dark mode", () => {
    document.documentElement.classList.remove("dark");
    const lightPrimary = getCSSVariableValue("--primary");

    document.documentElement.classList.add("dark");
    const darkPrimary = getCSSVariableValue("--primary");

    expect(lightPrimary).not.toBe(darkPrimary);
    document.documentElement.classList.remove("dark");
  });
});
