import { Suspense } from "react"

import { AppShell } from "@/components/shared/app-shell"
import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { AuthGate } from "@/features/auth/components/auth-gate"
import { LearningProfileGate } from "@/features/learning-profile/components/learning-profile-gate"

export default function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<AuthBootstrap />}>
      <AuthGate>
        <AppShell>
          <LearningProfileGate>{children}</LearningProfileGate>
        </AppShell>
      </AuthGate>
    </Suspense>
  )
}
