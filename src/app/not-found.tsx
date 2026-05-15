"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Zap className="h-12 w-12 text-primary fill-primary" />
        </div>
        <h1 className="text-9xl font-black text-primary/20 absolute -z-10 select-none">404</h1>
        <h2 className="text-4xl font-bold tracking-tight mb-2">Lost in the Flow?</h2>
        <p className="text-muted-foreground text-lg max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to a different stream.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" variant="default" className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Go to Landing Page
          </Link>
        </Button>
      </div>
    </div>
  )
}
