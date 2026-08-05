"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getJwtToken } from "@/lib/auth-client";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      const token = getJwtToken();
      console.log(`AuthLayout: User is authenticated. JWT Token: ${token}`);
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  // Still checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            Authenticating....
          </h1>
        </div>
      </div>
    );
  }

  // Authenticated → redirect to dashboard
  if (session) {
    return null;
  }

  // Not authenticated → stay on the current auth page
  return <>{children}</>;
}
