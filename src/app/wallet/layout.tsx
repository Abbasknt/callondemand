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
      <main className="flex-1 p-4 md:p-8 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] md:pt-24 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
