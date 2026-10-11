import type { Metadata } from "next"

import { AuthProvider } from "@/features/auth/model/auth-context"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { googleSansFlex, notoSansJP } from "@/styles/fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Reality Loop",
    template: "%s · Reality Loop",
  },
  description: "Practice the language you need for real life.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${googleSansFlex.variable} ${notoSansJP.variable} h-full`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
