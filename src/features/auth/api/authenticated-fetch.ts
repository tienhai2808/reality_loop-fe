import {
  type AppAuthError,
  AuthRequestError,
} from "@/features/auth/api/auth-errors"
import { clearBrowserSession } from "@/features/auth/api/auth-api"
import {
  clearStoredAuthSession,
  getStoredAccessToken,
} from "@/features/auth/model/auth-session-store"
import { refreshSessionSingleFlight } from "@/features/auth/model/refresh-coordinator"

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  return authenticatedFetchAttempt(input, init, false)
}

export async function getAuthenticatedAccessToken(): Promise<string> {
  const currentAccessToken = getStoredAccessToken()

  if (currentAccessToken) {
    return currentAccessToken
  }

  const session = await refreshSessionSingleFlight()
  return session.accessToken
}

async function authenticatedFetchAttempt(
  input: RequestInfo | URL,
  init: RequestInit,
  retried: boolean
): Promise<Response> {
  const accessToken = await getAuthenticatedAccessToken()
  const response = await fetch(input, withBearer(init, accessToken))

  if (response.status !== 401 || retried) {
    return response
  }

  try {
    const refreshedSession = await refreshSessionSingleFlight()
    return fetch(input, withBearer(init, refreshedSession.accessToken))
  } catch {
    clearStoredAuthSession()
    await clearBrowserSession()
    throw new AuthRequestError(sessionExpiredError)
  }
}

function withBearer(init: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(init.headers)
  headers.set("authorization", `Bearer ${accessToken}`)

  return {
    ...init,
    headers,
  }
}

const sessionExpiredError: AppAuthError = {
  kind: "unauthorized",
  message: "Your session expired. Please sign in again.",
}

