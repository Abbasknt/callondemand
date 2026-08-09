'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-4xl font-black text-red-600 mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-6 max-w-md">
          A critical error occurred while loading the application.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Return to Dashboard
          </Link>
        </div>
      </body>
    </html>
  )
}
