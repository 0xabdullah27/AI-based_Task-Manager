import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Create account
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Get started managing your tasks today
          </p>
        </div>

        <SignUpForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              Already have an account?
            </span>
          </div>
        </div>

        <Link href="/sign-in" className="block">
          <button className="w-full px-4 py-2 text-center border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            Sign in instead
          </button>
        </Link>
      </div>
    </div>
  );
}
