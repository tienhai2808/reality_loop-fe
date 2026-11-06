import type { Metadata } from "next"
import { Suspense } from "react"

import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { OAuthCallbackClient } from "@/features/auth/components/oauth-callback-client"

export const metadata: Metadata = {
  title: "Đang đăng nhập",
  referrer: "no-referrer",
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={<AuthBootstrap label="Đang xác minh đăng nhập" />}>
      <OAuthCallbackClient provider="facebook" />
    </Suspense>
  )
}
