import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { CheckSquare } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
        <div className="bg-foreground p-2 rounded-lg">
          <CheckSquare className="w-5 h-5 text-background" />
        </div>
        <span>TaskCortex</span>
      </Link>
      <div className="w-full max-w-[360px] space-y-8 p-6 sm:p-8 bg-background">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Sign up
          </h2>
        </div>

        <SignUpForm />

        <div className="text-center text-[13px] text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-foreground hover:underline font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
