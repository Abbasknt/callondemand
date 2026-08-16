'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('App Route Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-2">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
        {error?.message || 'An unexpected error occurred while loading this section.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition-all text-sm cursor-pointer"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload();
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-sm cursor-pointer"
        >
          Reload Page
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-border bg-background text-foreground font-semibold rounded-xl hover:bg-accent transition-all text-sm"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


