import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Welcome back
          </h2>
          <p className="text-muted-foreground">
            Sign in to access your tasks
          </p>
        </div>

        <SignInForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              Don&apos;t have an account?
            </span>
          </div>
        </div>

        <Link href="/sign-up" className="block">
          <button className="w-full px-4 py-2 text-center border border-input text-foreground rounded-lg hover:bg-muted transition">
            Create a new account
          </button>
        </Link>
      </div>
    </div>
  );
}
