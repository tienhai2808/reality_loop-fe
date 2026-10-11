import { z } from "zod"

import {
  type AppAuthError,
  AuthRequestError,
  authErrorFromResponse,
  networkAuthError,
} from "@/features/auth/api/auth-errors"
import {
  type AuthSession,
  type AuthUser,
  type AuthenticationResponse,
  type BrowserAuthSession,
  authorizationUrlResponseSchema,
  authUserSchema,
  authenticationResponseSchema,
  browserAuthSessionSchema,
  sessionsPageSchema,
  type SessionsPage,
} from "@/features/auth/api/auth-schemas"
import {
  type OAuthProvider,
  oauthProviders,
} from "@/features/auth/model/oauth-providers"
import { env } from "@/lib/env"

const jsonHeaders = {
  "content-type": "application/json",
} as const

export async function requestOAuthAuthorizationUrl({
  provider,
  signal,
}: {
  provider: OAuthProvider
  signal?: AbortSignal
}): Promise<string> {
  const providerConfig = oauthProviders[provider]
  const response = await safeFetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}${providerConfig.authorizePath}`,
    {
      method: "GET",
      credentials: "include",
      signal,
    }
  )

  if (!response.ok) {
    throw new AuthRequestError(
      await authErrorFromResponse(
        response,
        `${providerConfig.displayName} sign-in could not be started.`
      )
    )
  }

  const data = await parseJsonResponse(response, authorizationUrlResponseSchema)
  return data.authorizationUrl
}

export async function exchangeOAuthCallback({
  provider,
  code,
  state,
  signal,
}: {
  provider: OAuthProvider
  code: string
  state: string
  signal?: AbortSignal
}): Promise<AuthenticationResponse> {
  const providerConfig = oauthProviders[provider]
  const response = await safeFetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}${providerConfig.callbackPath}`,
    {
      method: "POST",
      credentials: "include",
      headers: jsonHeaders,
      body: JSON.stringify({
        code,
        state,
        device: getDeviceMetadata(),
      }),
      signal,
    }
  )

  if (!response.ok) {
    throw new AuthRequestError(
      await authErrorFromResponse(
        response,
        `${providerConfig.displayName} sign-in could not be completed.`
      )
    )
  }

  return parseJsonResponse(response, authenticationResponseSchema)
}

export async function persistRefreshToken(
  refreshToken: string,
  signal?: AbortSignal
): Promise<void> {
  const response = await safeFetch("/api/auth/session", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ refreshToken }),
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(
      await authErrorFromResponse(response, "The browser session could not be established.")
    )
  }
}

export async function refreshBrowserSession(
  signal?: AbortSignal
): Promise<BrowserAuthSession> {
  const response = await safeFetch("/api/auth/refresh", {
    method: "POST",
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(
      await authErrorFromResponse(response, "Your session could not be restored.")
    )
  }

  return parseJsonResponse(response, browserAuthSessionSchema)
}

export async function clearBrowserSession(signal?: AbortSignal): Promise<void> {
  await safeFetch("/api/auth/clear", {
    method: "POST",
    signal,
  })
}

export async function logoutBrowserSession({
  accessToken,
  signal,
}: {
  accessToken: string | null
  signal?: AbortSignal
}): Promise<void> {
  const response = await safeFetch("/api/auth/logout", {
    method: "POST",
    headers: accessToken
      ? {
          authorization: `Bearer ${accessToken}`,
        }
      : undefined,
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(
      await authErrorFromResponse(response, "Sign out could not be completed.")
    )
  }
}

export async function getCurrentUser(
  accessToken: string,
  signal?: AbortSignal
): Promise<AuthUser> {
  const response = await safeFetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: bearerHeaders(accessToken),
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }

  return parseJsonResponse(response, authUserSchema)
}

export async function getSessions({
  accessToken,
  pageSize = 20,
  before,
  signal,
}: {
  accessToken: string
  pageSize?: number
  before?: string | null
  signal?: AbortSignal
}): Promise<SessionsPage> {
  const url = new URL(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/sessions`)
  url.searchParams.set("pageSize", String(pageSize))

  if (before) {
    url.searchParams.set("before", before)
  }

  const response = await safeFetch(url, {
    method: "GET",
    headers: bearerHeaders(accessToken),
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }

  return parseJsonResponse(response, sessionsPageSchema)
}

export async function logoutSelectedSessions({
  accessToken,
  sessionIds,
  signal,
}: {
  accessToken: string
  sessionIds: string[]
  signal?: AbortSignal
}): Promise<void> {
  const uniqueSessionIds = [...new Set(sessionIds)].slice(0, 100)

  const response = await safeFetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout/sessions`, {
    method: "POST",
    headers: {
      ...jsonHeaders,
      ...bearerHeaders(accessToken),
    },
    body: JSON.stringify({ sessionIds: uniqueSessionIds }),
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }
}

export async function logoutOtherSessions({
  accessToken,
  signal,
}: {
  accessToken: string
  signal?: AbortSignal
}): Promise<void> {
  const response = await safeFetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout/others`, {
    method: "POST",
    headers: bearerHeaders(accessToken),
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }
}

export async function logoutAllSessions({
  accessToken,
  signal,
}: {
  accessToken: string
  signal?: AbortSignal
}): Promise<void> {
  const response = await safeFetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout/all`, {
    method: "POST",
    headers: bearerHeaders(accessToken),
    signal,
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }
}

export function sessionFromAuthenticationResponse(
  response: AuthenticationResponse
): BrowserAuthSession {
  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    sessionId: response.sessionId,
    user: response.user,
  }
}

export function getSafeInternalPath(value: string | null | undefined): string {
  if (!value) {
    return "/"
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  try {
    const parsed = new URL(value, "http://localhost")
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return "/"
  }
}

export function redirectToAuthorizationUrl(authorizationUrl: string): void {
  window.location.assign(authorizationUrl)
}

export function getDisplayName(user: AuthUser): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return fullName || user.email || "Reality Loop user"
}

export function getUserInitials(user: AuthUser): string {
  const nameParts = [user.firstName, user.lastName].filter(Boolean)

  if (nameParts.length > 0) {
    return nameParts
      .map((part) => part?.[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  return user.email?.slice(0, 2).toUpperCase() ?? "RL"
}

export function isSessionExpired(expiresAt: string, marginMs = 30_000): boolean {
  const expires = Date.parse(expiresAt)
  return Number.isNaN(expires) || expires - Date.now() <= marginMs
}

function getDeviceMetadata(): { deviceType: string; deviceName: string } {
  if (typeof navigator === "undefined") {
    return {
      deviceType: "Desktop",
      deviceName: "Web",
    }
  }

  const userAgent = navigator.userAgent
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(userAgent)
  const browser = detectBrowser(userAgent)
  const platform = navigator.platform || "Web"

  return {
    deviceType: isMobile ? "Mobile" : "Desktop",
    deviceName: `${browser} on ${platform}`,
  }
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes("Edg/")) {
    return "Edge"
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox"
  }

  if (userAgent.includes("Chrome/")) {
    return "Chrome"
  }

  if (userAgent.includes("Safari/")) {
    return "Safari"
  }

  return "Web"
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new AuthRequestError(networkAuthError())
  }
}

async function parseJsonResponse<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<T> {
  const value: unknown = await response.json()
  const parsed = schema.safeParse(value)

  if (!parsed.success) {
    const validationError: AppAuthError = {
      kind: "server",
      message: "The authentication server returned an unexpected response.",
    }
    throw new AuthRequestError(validationError)
  }

  return parsed.data
}

function bearerHeaders(accessToken: string): HeadersInit {
  return {
    authorization: `Bearer ${accessToken}`,
  }
}

export type { AuthSession }

