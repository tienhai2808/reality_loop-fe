"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

import { getSafeInternalPath } from "@/features/auth/api/auth-api"
import { getAuthErrorMessage } from "@/features/auth/api/auth-errors"
import { AuthBootstrap } from "@/features/auth/components/auth-bootstrap"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { exchangeOAuthCallbackOnce } from "@/features/auth/model/oauth-callback-exchange"
import {
  type OAuthProvider,
  oauthProviders,
} from "@/features/auth/model/oauth-providers"
import { Button } from "@/components/ui/button"

type CallbackState =
  | {
      status: "exchanging"
    }
  | {
      status: "redirecting"
    }
  | {
      status: "error"
      message: string
    }

type CapturedCallback =
  | {
      kind: "oauth"
      code: string
      state: string
      next: string
    }
  | {
      kind: "cancelled"
      message: string
    }
  | {
      kind: "error"
      message: string
    }

export function OAuthCallbackClient({
  provider,
}: {
  provider: OAuthProvider
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuthenticatedSession } = useAuth()
  const providerConfig = oauthProviders[provider]
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: "exchanging",
  })

  const [capturedCallback] = useState<CapturedCallback>(() =>
    captureCallback(searchParams.toString(), provider)
  )

  useLayoutEffect(() => {
    sessionStorage.removeItem("reality-loop-auth-next")
    window.history.replaceState({}, "", window.location.pathname)
  }, [])

  useEffect(() => {
    if (capturedCallback.kind !== "oauth") {
      return
    }

    let cancelled = false
    const oauthCallback = capturedCallback

    async function exchange() {
      try {
        const session = await exchangeOAuthCallbackOnce({
          provider,
          code: oauthCallback.code,
          state: oauthCallback.state,
        })

        if (cancelled) {
          return
        }

        setAuthenticatedSession(session)
        setCallbackState({
          status: "redirecting",
        })
        router.replace(oauthCallback.next)
      } catch (error) {
        if (cancelled) {
          return
        }

        setCallbackState({
          status: "error",
          message: getAuthErrorMessage(error),
        })
      }
    }

    void exchange()

    return () => {
      cancelled = true
    }
  }, [capturedCallback, provider, router, setAuthenticatedSession])

  if (capturedCallback.kind === "cancelled" || capturedCallback.kind === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
        <div className="space-y-6 text-center">
          <Image
            src="/logo.svg"
            alt="Reality Loop"
            width={32}
            height={32}
            className="mx-auto size-8 rounded-[6px]"
            priority
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {capturedCallback.kind === "cancelled"
                ? `${providerConfig.displayName} sign-in was cancelled`
                : "We could not sign you in"}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground" aria-live="polite">
              {capturedCallback.message}
            </p>
          </div>
          <Button onClick={() => router.replace("/sign-in")} className="w-full">
            {capturedCallback.kind === "cancelled" ? "Back to sign in" : "Try again"}
          </Button>
        </div>
      </div>
    )
  }

  if (callbackState.status === "exchanging") {
    return <AuthBootstrap label="Establishing your session" />
  }

  if (callbackState.status === "redirecting") {
    return <AuthBootstrap label="Opening Reality Loop" />
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="space-y-6 text-center">
        <Image
          src="/logo.svg"
          alt="Reality Loop"
          width={32}
          height={32}
          className="mx-auto size-8 rounded-[6px]"
          priority
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            We could not sign you in
          </h1>
          <p className="text-sm leading-6 text-muted-foreground" aria-live="polite">
            {callbackState.message}
          </p>
        </div>
        <Button onClick={() => router.replace("/sign-in")} className="w-full">
          Try again
        </Button>
      </div>
    </div>
  )
}

function captureCallback(
  search: string,
  provider: OAuthProvider
): CapturedCallback {
  const providerConfig = oauthProviders[provider]
  const params = new URLSearchParams(search)
  const code = params.get("code")
  const state = params.get("state")
  const oauthError = params.get("error")
  const storedNext =
    typeof window !== "undefined"
      ? sessionStorage.getItem("reality-loop-auth-next")
      : null
  const next = getSafeInternalPath(params.get("next") ?? storedNext)

  if (oauthError) {
    return {
      kind: "cancelled",
      message:
        oauthError === "access_denied"
          ? `${providerConfig.displayName} sign-in was cancelled.`
          : `${providerConfig.displayName} sign-in could not be completed.`,
    }
  }

  if (!code) {
    return {
      kind: "error",
      message: `The ${providerConfig.displayName} callback did not include an authorization code.`,
    }
  }

  if (!state) {
    return {
      kind: "error",
      message: `The ${providerConfig.displayName} callback did not include a state value.`,
    }
  }

  return {
    kind: "oauth",
    code,
    state,
    next,
  }
}
