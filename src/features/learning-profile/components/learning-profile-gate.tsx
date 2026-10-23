"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { getSafeInternalPath } from "@/features/auth/api/auth-api"
import { useCurrentLearningProfile } from "../hooks/use-current-learning-profile"
import { LearningFeedback } from "./learning-feedback"

export function learningReturnPath(path: string | null): string {
  const safe = getSafeInternalPath(path)
  const pathname = safe.split(/[?#]/)[0]
  return pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/sign-in" ||
    pathname.startsWith("/auth/")
    ? "/"
    : safe
}

export function LearningProfileGate({
  children,
}: {
  children: React.ReactNode
}) {
  const { state, refreshCurrent } = useCurrentLearningProfile()
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()
  const settings = pathname === "/settings/learning"
  useEffect(() => {
    if (!settings && state.status === "ready" && !state.current) {
      const query = search.toString()
      const next = learningReturnPath(`${pathname}${query ? `?${query}` : ""}`)
      router.replace(`/onboarding?next=${encodeURIComponent(next)}`)
    }
  }, [settings, state, pathname, search, router])
  if (settings || (state.status === "ready" && state.current)) return children
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {state.status === "error" ? (
        <>
          <h1 className="mb-3 text-lg font-semibold">
            We couldn&apos;t load your learning profile
          </h1>
          <LearningFeedback
            error={state.error}
            onRetry={() => {
              void refreshCurrent().catch(() => undefined)
            }}
          />
        </>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          Checking your learning profile...
        </p>
      )}
    </div>
  )
}
