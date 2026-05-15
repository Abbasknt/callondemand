'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Unified under /services/utility.
 * Redirecting for interface consistency.
 */
export default function DataRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/services/utility');
  }, [router]);

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-black uppercase tracking-widest text-[10px] animate-pulse text-muted-foreground">Redirecting to Utility Hub...</p>
      </div>
    </div>
  );
}
