import {
  exchangeOAuthCallback,
  persistRefreshToken,
  sessionFromAuthenticationResponse,
} from "@/features/auth/api/auth-api"
import type { BrowserAuthSession } from "@/features/auth/api/auth-schemas"
import { setStoredAuthSession } from "@/features/auth/model/auth-session-store"
import type { OAuthProvider } from "@/features/auth/model/oauth-providers"

const callbackExchangePromises = new Map<string, Promise<BrowserAuthSession>>()

export function exchangeOAuthCallbackOnce({
  provider,
  code,
  state,
}: {
  provider: OAuthProvider
  code: string
  state: string
}): Promise<BrowserAuthSession> {
  const key = `${provider}:${state}:${code}`
  const pending = callbackExchangePromises.get(key)

  if (pending) {
    return pending
  }

  const exchangePromise = exchangeAndPersistSession({ provider, code, state })
  callbackExchangePromises.set(key, exchangePromise)
  return exchangePromise
}

async function exchangeAndPersistSession({
  provider,
  code,
  state,
}: {
  provider: OAuthProvider
  code: string
  state: string
}): Promise<BrowserAuthSession> {
  const response = await exchangeOAuthCallback({ provider, code, state })
  await persistRefreshToken(response.refreshToken)
  const session = sessionFromAuthenticationResponse(response)
  setStoredAuthSession(session)
  return session
}
