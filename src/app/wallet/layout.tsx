import { MainNav } from "@/components/layout/main-nav"
import { Toaster } from "@/components/ui/toaster"

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 w-full min-w-0 p-3 sm:p-5 md:p-8 pt-[calc(4rem+env(safe-area-inset-top,0px))] sm:pt-20 md:pt-20 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <div className="w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
