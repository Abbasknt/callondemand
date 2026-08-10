'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error?: Error & { digest?: string }
  reset?: () => void
}) {
  useEffect(() => {
    if (error) {
      console.error(error)
      if (
        error.name === 'ChunkLoadError' ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('failed to fetch dynamically imported module')
      ) {
        if (typeof window !== 'undefined' && !sessionStorage.getItem('chunk_reload_error_page')) {
          sessionStorage.setItem('chunk_reload_error_page', 'true')
          window.location.reload()
        }
      }
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        An unexpected error occurred while rendering this page.
      </p>
      <div className="flex gap-4">
        {reset && (
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
