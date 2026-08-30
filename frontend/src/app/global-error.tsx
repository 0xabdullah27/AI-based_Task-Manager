"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex items-center justify-center p-4 bg-gray-50 text-gray-900">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center space-y-6 shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Critical Error
            </h2>
            <p className="text-sm text-gray-500">
              {error.message || "A critical application error occurred."}
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
