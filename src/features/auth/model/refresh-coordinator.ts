import {
  isSessionExpired,
  refreshBrowserSession,
} from "@/features/auth/api/auth-api"
import type { BrowserAuthSession } from "@/features/auth/api/auth-schemas"
import {
  getStoredAuthSession,
  setStoredAuthSession,
} from "@/features/auth/model/auth-session-store"

let refreshPromise: Promise<BrowserAuthSession> | null = null

export async function refreshSessionSingleFlight(): Promise<BrowserAuthSession> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = withRefreshLock(async () => {
    const session = await refreshBrowserSession()
    setStoredAuthSession(session)
    return session
  }).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function ensureFreshSession(): Promise<BrowserAuthSession | null> {
  const session = getStoredAuthSession()

  if (session && !isSessionExpired(session.accessTokenExpiresAt)) {
    return session
  }

  return refreshSessionSingleFlight()
}

async function withRefreshLock<T>(callback: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return callback()
  }

  return navigator.locks.request("reality-loop-auth-refresh", callback)
}

