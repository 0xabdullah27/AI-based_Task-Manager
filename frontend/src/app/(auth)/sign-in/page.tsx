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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-[13px]">
            <span className="px-2 bg-background text-muted-foreground">
              Don&apos;t have an account?
            </span>
          </div>
        </div>

        <Link href="/sign-up" className="block">
          <button className="w-full px-4 py-2 text-center border border-border/50 bg-secondary text-secondary-foreground text-[14px] font-medium rounded hover:bg-secondary/80 transition cursor-pointer">
            Sign up
          </button>
        </Link>
      </div>
    </div>
  );
}
