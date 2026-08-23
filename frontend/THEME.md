# Theme System Documentation

## Overview

This application uses **Tailwind CSS v4** with a semantic design token system mapped via `@theme inline` in `frontend/src/app/globals.css`. 

All component styling is done **strictly using standard Tailwind utility classes** (such as `bg-primary`, `text-foreground`, `bg-card`, `border-border`, `bg-priority-high`, `text-priority-high-foreground`, `bg-warning`, `bg-success`, `bg-destructive`).

> [!IMPORTANT]
> **No inline `style={{ backgroundColor: "var(--...)" }}` or manual JS mouse/focus handlers should be used in React components.**
> All theme switching between Light Mode and Dark Mode is handled smoothly and globally by `next-themes` via the `<ThemeProvider>` and `<ThemeToggle />` components.

---

## Design Token Definitions

All theme variables are defined in OKLCH color space in [globals.css](file:///d:/AbdullahQureshi/workspace/AI-based_Task-Manager/frontend/src/app/globals.css):
- **Tailwind `@theme inline` mappings**: Lines 6-55
- **Light Theme Palette**: `:root` selector
- **Dark Theme Palette**: `.dark` selector

### Core Semantic Classes

| Token Category | Tailwind Utility Classes | Purpose |
| :--- | :--- | :--- |
| **Surfaces** | `bg-background`, `text-foreground` | Main page body background & base text |
| **Cards & Popovers** | `bg-card`, `text-card-foreground`, `bg-popover` | Container cards, popovers, dropdowns |
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
- Changes between Light and Dark mode seamlessly update the `.dark` class on `<html>`, instantly swapping all OKLCH semantic tokens.
