import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Create account
          </h2>
          <p className="text-muted-foreground">
            Get started managing your tasks today
          </p>
        </div>

        <SignUpForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              Already have an account?
            </span>
          </div>
        </div>

        <Link href="/sign-in" className="block">
          <button className="w-full px-4 py-2 text-center border border-input text-foreground rounded-lg hover:bg-muted transition">
            Sign in instead
          </button>
        </Link>
      </div>
    </div>
  );
}
