"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, Home, Wallet, Grid } from "lucide-react"

export function NotFoundClient() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Decorative ambient glow background element */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg flex flex-col items-center z-10 transition-all duration-500">
        {/* Giant background 404 text */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 select-none pointer-events-none">
          <span className="text-[12rem] sm:text-[16rem] font-black text-primary/[0.04] tracking-tighter">
            404
          </span>
        </div>

        {/* Floating icon */}
        <div className="h-24 w-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
          <Zap className="h-12 w-12 text-primary fill-primary/10" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-foreground">
          Page Not Found
        </h2>

        {/* Paragraph */}
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8 leading-relaxed">
          The route or stream you are looking for has been moved or doesn&apos;t exist. Select a destination below to continue.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full">
          <Button asChild size="lg" variant="default" className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/10 font-bold rounded-xl">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto gap-2 font-bold rounded-xl">
            <Link href="/wallet">
              <Wallet className="h-4 w-4" />
              Wallet Hub
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto gap-2 font-bold rounded-xl">
            <Link href="/services">
              <Grid className="h-4 w-4" />
              Services Directory
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

