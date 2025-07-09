import type React from "react"
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { CurriculumCacheProvider } from "@/lib/curriculum-cache"
import "./globals.css"

export const metadata: Metadata = {
  title: "Curriculum Dashboard",
  description: "Academic curriculum management system",
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
              </CurriculumCacheProvider>
            </StackTheme>
          </StackProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
