# AI-Based Task Manager (Frontend)

This directory contains the frontend code for the AI-Based Task Manager application. It is built using modern web development standards to provide a highly responsive, beautiful, and interactive user experience.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API

## ✨ Key Features

- **Responsive Dashboard:** A kanban-style task dashboard that automatically adapts its layout from mobile screens up to ultra-wide desktop monitors.
- **Glassmorphism Chat UI:** An integrated AI chat overlay with premium glassmorphism effects, allowing users to talk to the AI without leaving their context.
- **BYOK AI Settings Dashboard:** A dedicated settings page allowing users to securely manage their custom AI API Keys, Providers, and Base URLs.
- **Dynamic Theming:** Seamless toggling between light and dark modes.
- **Smart Filtering:** Client-side task filtering, searching, and sorting with smooth animations.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env.local` and ensure your `NEXT_PUBLIC_API_URL` is pointing to the local FastAPI backend.
   ```bash
   cp .env.example .env.local
   ```

### Development Server
Run the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Directory Structure
- `/src/app`: Next.js App Router definitions (pages, layouts).
- `/src/components`: Reusable UI components (buttons, dialogs, forms).
- `/src/lib`: Utility functions and shared API clients.
- `/src/providers`: Global state providers for Auth, Theme, and Tasks.
