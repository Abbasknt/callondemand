import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { FirestoreMonitor } from '@/components/firestore-monitor';
import { WalletBalanceGuard } from '@/components/wallet-balance-guard';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

// Root Layout

export const metadata: Metadata = {
  metadataBase: new URL('https://callondemandbiz.com'),
  title: 'Call on Demand.com | Unified Life, Seamlessly Demanded',
  description: 'One platform for your wallet, food, laundry, logistics, and investments.',
  alternates: {
    canonical: 'https://callondemandbiz.com',
  },
  openGraph: {
    title: 'Call on Demand Nigeria | Unified Lifestyle Ecosystem',
    description: 'One unified platform for your wallet, food, laundry, logistics, and investments across Nigeria.',
    url: 'https://callondemandbiz.com',
    siteName: 'Call on Demand',
    locale: 'en_NG',
    type: 'website',
  },
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
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
      { url: 'https://picsum.photos/seed/cod-apple/180/180', sizes: '180x180', type: 'image/png' }
    ],
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
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('cod-theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && supportDarkMode) || (saved === 'system' && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="selection:bg-primary/20 bg-background text-foreground overflow-x-hidden font-sans transition-colors duration-200" suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="system" storageKey="cod-theme">
            <FirebaseClientProvider>
              <FirestoreMonitor />
              <WalletBalanceGuard />
              <ServiceWorkerRegistration />
              {children}
              <Toaster />
            </FirebaseClientProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
