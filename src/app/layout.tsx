import type React from "react"
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { CurriculumCacheProvider } from "@/lib/curriculum-cache"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { PWAInstallBanner } from "@/components/pwa-install-banner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Owsla",
  description: "Learn Anything at Lightspeed",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Owsla',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <CurriculumCacheProvider>
                {children}
                <ServiceWorkerRegister />
                <PWAInstallBanner />
              </CurriculumCacheProvider>
            </StackTheme>
          </StackProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
