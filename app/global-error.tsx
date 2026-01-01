"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 text-zinc-50">
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-8xl font-bold text-zinc-700">Error</p>
            <div className="space-y-1">
              <h1 className="text-xl font-medium">Something went wrong</h1>
              <p className="text-sm text-zinc-400">
                A critical error occurred. Please try again.
              </p>
            </div>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
