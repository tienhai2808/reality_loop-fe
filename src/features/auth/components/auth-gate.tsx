"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { getSafeInternalPath } from "@/features/auth/api/auth-api"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function AuthGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { state } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (state.status !== "unauthenticated") {
      return
    }

    const query = searchParams.toString()
    const next = getSafeInternalPath(`${pathname}${query ? `?${query}` : ""}`)
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`)
  }, [pathname, router, searchParams, state.status])

  if (state.status === "authenticated") {
    return children
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-semibold">We could not check your session</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {state.error.message}
        </p>
      </div>
    )
  }

  return <AuthBootstrap />
}

