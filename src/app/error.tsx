'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log non-critical errors safely
    if (error && !error.message?.includes('PageNotFoundError')) {
      console.warn('App level error captured:', error.message);
    }
  }, [error]);

  return (
    <div id="error-boundary-view" className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-card border rounded-2xl shadow-sm">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error?.message && !error.message.includes('digest')
              ? error.message
              : 'An unexpected issue occurred while rendering this page.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button id="error-reset-button" onClick={() => reset()} variant="default" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try again
          </Button>
          <Button id="error-home-button" asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" /> Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
