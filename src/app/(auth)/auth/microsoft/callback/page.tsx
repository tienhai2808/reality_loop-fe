import type { Metadata } from "next"
import { Suspense } from "react"

import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { OAuthCallbackClient } from "@/features/auth/components/oauth-callback-client"

export const metadata: Metadata = {
  title: "Signing in",
  referrer: "no-referrer",
}

export default function MicrosoftCallbackPage() {
  return (
    <Suspense fallback={<AuthBootstrap label="Validating callback" />}>
      <OAuthCallbackClient provider="microsoft" />
    </Suspense>
  )
}
