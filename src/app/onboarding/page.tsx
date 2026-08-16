'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function OnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding/survey');
  }, [router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
        Redirecting to onboarding setup...
      </p>
    </div>
  );
}
