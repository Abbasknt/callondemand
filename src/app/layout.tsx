import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { FirestoreMonitor } from '@/components/firestore-monitor';
import { WalletBalanceGuard } from '@/components/wallet-balance-guard';
import { ErrorBoundary } from '@/components/error-boundary';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Root Layout

export const metadata: Metadata = {
  title: 'Call on Demand.com | Unified Life, Seamlessly Demanded',
  description: 'One platform for your wallet, food, laundry, logistics, and investments.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Call on Demand',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: 'https://picsum.photos/seed/cod-fav/32/32',
    apple: 'https://picsum.photos/seed/cod-apple/180/180',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563EB',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable)} suppressHydrationWarning>
      <body className="selection:bg-primary/20 bg-background overflow-x-hidden font-sans" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            <FirestoreMonitor />
            <WalletBalanceGuard />
            <ServiceWorkerRegistration />
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
