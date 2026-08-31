"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur", // Validate on blur to show errors earlier
  });

  const isPending = isLoading || isRedirecting;

  const onSubmit = async (data: SignUpInput) => {
    try {
      setIsLoading(true);
      setError("");

      await signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
        },
        {
          onSuccess: () => {
            toast.success("Account created successfully");
            setIsRedirecting(true);
            setIsLoading(false);
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            setIsLoading(false);
            const errorMessage = ctx.error.message || "Failed to create account";
            const statusCode = ctx.error.status;
            const errorCode = (ctx.error as { code?: string })?.code;

            // Handle specific error cases
            if (
              errorCode === "USER_ALREADY_EXISTS" ||
              statusCode === 422 ||
              errorMessage.toLowerCase().includes("already exists") ||
              errorMessage.toLowerCase().includes("user already exists")
            ) {
              setError("An account with this email already exists.");
              toast.error("Account already exists", {
                description: "Would you like to sign in instead?",
                action: {
                  label: "Sign In",
                  onClick: () => {
                    toast.dismiss();
                    router.push("/sign-in");
                  },
                },
                duration: 5000,
              });
            } else if (
              errorMessage.toLowerCase().includes("invalid email") &&
              !errorMessage.toLowerCase().includes("password")
            ) {
              setError("Please enter a valid email address.");
              toast.error("Invalid email");
            } else if (errorMessage.toLowerCase().includes("password")) {
              setError("Password must be at least 8 characters long.");
              toast.error("Invalid password");
            } else {
              setError(errorMessage);
              toast.error("Sign up failed", {
                description: errorMessage,
              });
            }
          },
        }
      );
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        // label="Name"
        placeholder="Your full name"
        type="text"
        {...register("name")}
        // error={errors.name?.message}
        disabled={isPending}
      />

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
        type={showPassword ? "text" : "password"}
        {...register("password")}
        // error={errors.password?.message}
        disabled={isPending}
        placeholder="Minimum 8 characters"
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-password-signup"
          checked={showPassword}
          onCheckedChange={(checked) => setShowPassword(!!checked)}
          disabled={isPending}
        />
        <label
          htmlFor="show-password-signup"
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

      <Button type="submit" className="w-full cursor-pointer bg-foreground text-background hover:bg-foreground/90 font-medium rounded transition-colors" disabled={isPending}>
        {isRedirecting ? "Redirecting..." : isLoading ? "Signing up..." : "Sign up"}
      </Button>
    </form>
  );
}
