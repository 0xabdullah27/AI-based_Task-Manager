# Theme System Documentation - Notion Design System

## Overview

This application adopts the authentic **Notion workspace design system** for both Light and Dark modes. 

It is implemented with **Tailwind CSS v4** using semantic design tokens mapped via `@theme inline` in `frontend/src/app/globals.css`.

All component styling is done **strictly using standard Tailwind utility classes** (`bg-primary`, `text-foreground`, `bg-card`, `border-border`, `bg-priority-high`, `text-priority-high-foreground`, `bg-warning`, `bg-success`, `bg-destructive`, `bg-sidebar`).

> [!IMPORTANT]
> **No inline `style={{ backgroundColor: "var(--...)" }}` or manual JS mouse/focus handlers should be used in React components.**
> All theme switching between Light Mode and Dark Mode is handled smoothly and globally by `next-themes` via the `<ThemeProvider>` and `<ThemeToggle />` components.

---

## Notion Theme Tokens & Mappings

All theme variables are defined in OKLCH color space in [globals.css](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/frontend/src/app/globals.css):

### Light Mode (Notion Classic Clean)
- **Canvas / Page (`--background`)**: `#ffffff` (Clean white workspace)
- **Cards & Popovers (`--card`, `--popover`)**: `#ffffff`
- **Sidebar & Subsurfaces (`--sidebar`, `--secondary`)**: `#f7f6f3` (`rgb(247, 246, 243)` - Notion iconic sidebar off-white)
- **Primary Text (`--foreground`)**: `#37352f` (`rgb(55, 53, 47)` - Notion signature charcoal)
- **Secondary / Helper Text (`--muted-foreground`)**: `#787774` (`rgb(120, 119, 116)`)
- **Hover Surface (`--muted`, `--accent`)**: `#f1f1ef` (`rgb(241, 241, 239)`)
- **Borders & Dividers (`--border`, `--input`)**: `rgba(55, 53, 47, 0.12)` (`#e9e9e7`)
- **Primary Interactive (`--primary`)**: `#2383e2` (Notion blue)
- **Pills / Status / Priorities**:
  - High Priority / Destructive: `#eb5757` (Notion Red)
  - Medium Priority / Warning: `#cb7b37` (Notion Orange)
  - Low Priority / Success: `#448361` (Notion Green)
  - Info: `#2383e2` (Notion Blue)

### Dark Mode (Notion Deep Slate-Charcoal)
- **Canvas / Page (`--background`)**: `#191919` (`rgb(25, 25, 25)` - Notion dark canvas)
- **Cards & Sidebar (`--card`, `--sidebar`, `--popover`)**: `#202020` (`rgb(32, 32, 32)` - Notion dark card/modal)
- **Primary Text (`--foreground`)**: `#d4d4d4` (`rgba(255, 255, 255, 0.81)`)
- **Secondary / Helper Text (`--muted-foreground`)**: `#9b9b9b` (`rgba(255, 255, 255, 0.44)`)
- **Hover Surface (`--muted`, `--accent`)**: `#2a2a2a` (`rgba(255, 255, 255, 0.055)`)
- **Borders & Dividers (`--border`, `--input`)**: `rgba(255, 255, 255, 0.094)` (`#2e2e2e`)
- **Primary Interactive (`--primary`)**: `#2383e2` (Notion dark interactive blue)
- **Pills / Status / Priorities**:
  - High Priority / Destructive: `#ff7369` (Notion Dark Red)
  - Medium Priority / Warning: `#ffdc49` (Notion Dark Yellow)
  - Low Priority / Success: `#4dab72` (Notion Dark Green)
  - Info: `#529cca` (Notion Dark Blue)

---

## Semantic Class Quick Reference

| Token Category | Tailwind Utility Classes | Notion Purpose |
| :--- | :--- | :--- |
| **Surfaces** | `bg-background`, `text-foreground` | Main page body background & base text |
| **Cards & Popovers** | `bg-card`, `text-card-foreground`, `bg-popover` | Container cards, popovers, dropdowns |
| **Sidebar** | `bg-sidebar`, `text-sidebar-foreground` | Notion sidebar navigation panel |
| **Primary Brand** | `bg-primary`, `text-primary-foreground` | Active nav items, primary buttons, highlights |
| **Secondary / Muted** | `bg-secondary`, `bg-muted`, `text-muted-foreground` | Subtle badges, tag chips, secondary buttons |
| **Borders & Inputs** | `border-border`, `border-input`, `ring-ring` | Form boundaries, focus indicators |
| **Success Status** | `bg-success`, `text-success`, `border-success` | Completed tasks, high progress, positive alerts |
| **Warning Status** | `bg-warning`, `text-warning`, `border-warning` | Due today tasks, medium urgency |
| **Destructive / Error** | `bg-destructive`, `text-destructive` | Overdue tasks, delete actions, form errors |
| **Info Status** | `bg-info`, `text-info`, `border-info` | Upcoming tasks, notifications |
| **Priority High** | `bg-priority-high`, `text-priority-high-foreground` | High priority badges & accent indicators |
| **Priority Medium** | `bg-priority-medium`, `text-priority-medium-foreground` | Medium priority badges & accent indicators |
| **Priority Low** | `bg-priority-low`, `text-priority-low-foreground` | Low priority badges & accent indicators |

---

## Component Usage Guidelines

### 1. Form Inputs and Labels
```tsx
// Labels
<label htmlFor="title" className="block text-sm font-medium text-foreground">
  Title
</label>

// Inputs
<input
  type="text"
  className="mt-1 block w-full rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-primary transition"
  placeholder="Enter title"
/>

// Error Messages
<p className="mt-1 text-sm text-destructive">
  Title is required
</p>
```

### 2. Badges & Priority Tags
```tsx
// Using PriorityBadge component
<PriorityBadge priority="high" size="sm" />

// Direct Tailwind classes
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-priority-high text-priority-high-foreground">
  High
</span>
```

### 3. Cards & Containers
```tsx
<div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm">
  <h3 className="font-semibold text-foreground">Card Title</h3>
  <p className="text-sm text-muted-foreground">Card description</p>
</div>
```

### 4. Interactive Navigation & Buttons
```tsx
<button
  onClick={() => router.push("/dashboard/todos")}
  className={cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
    isActive
      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )}
>
  <CheckSquare className="w-5 h-5" />
  <span>Todos</span>
</button>
```

---

## Theme Switching

Theme switching is powered by `next-themes`:
- **Provider**: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` in `RootLayout`
- **UI Toggle**: `<ThemeToggle />` component located in the Sidebar and Mobile Dashboard navigation bar.
- Changes between Light and Dark mode seamlessly update the `.dark` class on `<html>`, instantly swapping all Notion semantic tokens.
