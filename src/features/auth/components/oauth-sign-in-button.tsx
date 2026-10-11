"use client"

import { useId, useState } from "react"
import Image from "next/image"

import {
  redirectToAuthorizationUrl,
  requestOAuthAuthorizationUrl,
} from "@/features/auth/api/auth-api"
import { getAuthErrorMessage } from "@/features/auth/api/auth-errors"
import {
  type OAuthProvider,
  oauthProviders,
} from "@/features/auth/model/oauth-providers"
import { Button } from "@/components/ui/button"

type SignInStatus = "idle" | "requesting" | "redirecting" | "error"

export function OAuthSignInButton({
  provider,
  nextPath = "/",
}: {
  provider: OAuthProvider
  nextPath?: string
}) {
  const [status, setStatus] = useState<SignInStatus>("idle")
  const [error, setError] = useState("")
  const errorId = useId()
  const providerConfig = oauthProviders[provider]

  async function handleSignIn() {
    if (status === "requesting" || status === "redirecting") {
      return
    }

    setStatus("requesting")
    setError("")

    try {
      const authorizationUrl = await requestOAuthAuthorizationUrl({ provider })
      sessionStorage.setItem("reality-loop-auth-next", nextPath)
      setStatus("redirecting")
      redirectToAuthorizationUrl(authorizationUrl)
    } catch (caughtError) {
      setStatus("error")
      setError(getAuthErrorMessage(caughtError))
    }
  }

  const pending = status === "requesting" || status === "redirecting"

  return (
    <div className="space-y-3">
      <Button
        type="button"
        className="h-11 w-full gap-2.5"
        variant="outline"
        onClick={handleSignIn}
        disabled={pending}
        aria-describedby={error ? errorId : undefined}
      >
        {providerConfig.iconSrc ? (
          <Image
            src={providerConfig.iconSrc}
            alt=""
            width={18}
            height={18}
            className="size-[18px] shrink-0"
            aria-hidden="true"
          />
        ) : null}
        <span>{pending ? "Connecting..." : `Continue with ${providerConfig.displayName}`}</span>
      </Button>
      {error ? (
        <p
          id={errorId}
          className="text-sm leading-6 text-destructive"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
