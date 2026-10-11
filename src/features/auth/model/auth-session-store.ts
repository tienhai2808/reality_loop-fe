import type { BrowserAuthSession } from "@/features/auth/api/auth-schemas"

let currentSession: BrowserAuthSession | null = null

export function setStoredAuthSession(session: BrowserAuthSession): void {
  currentSession = session
}

export function getStoredAuthSession(): BrowserAuthSession | null {
  return currentSession
}

export function getStoredAccessToken(): string | null {
  return currentSession?.accessToken ?? null
}

export function clearStoredAuthSession(): void {
  currentSession = null
}

