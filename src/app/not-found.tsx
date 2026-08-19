'use client';

import { Suspense } from "react";
import { NotFoundClient } from "@/components/not-found-client";

export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center p-4">Loading...</div>}>
      <NotFoundClient />
    </Suspense>
  );
}







