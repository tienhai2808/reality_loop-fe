import { Suspense } from "react"
import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { AuthGate } from "@/features/auth/components/auth-gate"

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AuthBootstrap />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  )
}
