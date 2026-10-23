import { Suspense } from "react"

import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { AuthGate } from "@/features/auth/components/auth-gate"
import { LearningProfileGate } from "@/features/learning-profile/components/learning-profile-gate"

export default function FocusLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<AuthBootstrap />}>
      <AuthGate>
        <LearningProfileGate>{children}</LearningProfileGate>
      </AuthGate>
    </Suspense>
  )
}

