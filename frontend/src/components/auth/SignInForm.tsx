"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { signIn, fetchAndStoreJwt } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const isPending = isLoading || isRedirecting;

  const onSubmit = async (data: SignInInput) => {
    try {
      setIsLoading(true);
      setError("");

      await signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: async () => {
            // Fetch and store JWT for API calls
            await fetchAndStoreJwt();
            toast.success("Signed in successfully");
            setIsRedirecting(true);
            setIsLoading(false);
            router.push("/dashboard");
          },
          onError: (ctx) => {
            setIsLoading(false);
            const errorMessage = ctx.error.message || "Failed to sign in";
            const statusCode = ctx.error.status;
            const errorCode = (ctx.error as { code?: string })?.code;
            const lowerMsg = errorMessage.toLowerCase();

            // Handle specific error cases
            if (
              lowerMsg.includes("invalid email or password") ||
              lowerMsg.includes("invalid password or email") ||
              lowerMsg.includes("invalid credentials") ||
              statusCode === 401
            ) {
              setError("Invalid email or password. Please try again.");
              toast.error("Authentication failed", {
                description: "Please check your email and password.",
              });
            } else if (
              lowerMsg.includes("credential account not found") ||
              lowerMsg.includes("account not found") ||
              lowerMsg.includes("user not found")
            ) {
              setError("No account found with this email. Please sign up first.");
              toast.error("Account not found", {
                description: "Would you like to create an account?",
                action: {
                  label: "Sign Up",
                  onClick: () => {
                    toast.dismiss();
                    router.push("/sign-up");
                  },
                },
                duration: 5000,
              });
            } else if (
              lowerMsg.includes("invalid password") ||
              lowerMsg.includes("incorrect password")
            ) {
              setError("Incorrect password. Please try again.");
              toast.error("Invalid password");
            } else if (
              lowerMsg.includes("invalid email") &&
              !lowerMsg.includes("password")
            ) {
              setError("Please enter a valid email address.");
              toast.error("Invalid email");
            } else {
              setError(errorMessage);
              toast.error("Sign in failed", {
                description: errorMessage,
              });
            }
          },
        }
      );
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        // label="Email"
        placeholder="abdullah2127x@gmail.com"
        type="email"
        {...register("email")}
        // error={errors.email?.message}
        disabled={isPending}
      />

      <Input
        // label="Password"
        placeholder="Your password"
        type={showPassword ? "text" : "password"}
        {...register("password")}
        // error={errors.password?.message}
        disabled={isPending}
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-password-signin"
          checked={showPassword}
          onCheckedChange={(checked) => setShowPassword(!!checked)}
          disabled={isPending}
        />
        <label
          htmlFor="show-password-signin"
          className="text-sm font-medium text-muted-foreground cursor-pointer select-none"
        >
          Show password
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
        {isRedirecting ? "Redirecting to dashboard..." : isLoading ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
