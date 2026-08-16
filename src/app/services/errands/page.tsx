'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ClipboardList } from 'lucide-react';

export default function ErrandsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/logistics?tab=errand');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <ClipboardList className="h-6 w-6 animate-pulse" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading Personal Errand Runner...
      </p>
    </div>
  );
}
