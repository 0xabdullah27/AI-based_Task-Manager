"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJwtToken, useSession } from "@/lib/auth-client";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      if (session) {
        const token = getJwtToken();
        console.log("bearer token is", token)
        router.push("/dashboard");
      } else {
        console.log("no session (Not logged In)")
        router.push("/sign-in");
      }
    }
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Todo App</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}