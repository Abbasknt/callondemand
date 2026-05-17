import { MainNav } from "@/components/layout/main-nav"
import { Toaster } from "@/components/ui/toaster"
import { AIConcierge } from "@/components/ai-concierge"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-24 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <AIConcierge />
      <Toaster />
    </div>
  )
}
