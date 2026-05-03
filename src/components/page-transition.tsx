'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * subtle, non-disruptive animations for transitions between screens
 * as per PRD style guidelines.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn("animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out", className)}>
      {children}
    </div>
  );
}
