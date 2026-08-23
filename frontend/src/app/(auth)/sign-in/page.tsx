import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";
import { CheckSquare } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
        <div className="bg-foreground p-2 rounded-lg">
          <CheckSquare className="w-5 h-5 text-background" />
        </div>
        <span>TaskHub</span>
      </Link>
      <div className="w-full max-w-[360px] space-y-8 p-6 sm:p-8 bg-background">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Log in
          </h2>
        </div>

        <SignInForm />

        <div className="text-center text-[13px] text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-foreground hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
