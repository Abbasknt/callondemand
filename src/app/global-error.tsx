'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Application Error</h2>
            <p className="text-sm text-neutral-400">
              {error?.message || 'A global application error occurred.'}
            </p>
          </div>
          <button
            id="global-error-reset-button"
            onClick={() => reset()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
