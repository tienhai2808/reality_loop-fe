import { NextResponse, type NextRequest } from "next/server"

import {
  authenticationResponseSchema,
  browserAuthSessionSchema,
  persistSessionBodySchema,
  type AuthenticationResponse,
  type BrowserAuthSession,
} from "@/features/auth/api/auth-schemas"
import { env } from "@/lib/env"

const refreshCookieName = "reality_loop_refresh"

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
} as const

export async function persistRefreshTokenHandler(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return problemResponse(403, "Forbidden", "The request origin is not allowed.")
  }

  const body = await readJson(request)
  const parsed = persistSessionBodySchema.safeParse(body)

  if (!parsed.success) {
    return problemResponse(400, "Invalid request", "A refresh token is required.")
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(refreshCookieName, parsed.data.refreshToken, refreshCookieOptions)
  return response
}

export async function refreshSessionHandler(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return problemResponse(403, "Forbidden", "The request origin is not allowed.")
  }

  const refreshToken = request.cookies.get(refreshCookieName)?.value

  if (!refreshToken) {
    return problemResponse(401, "Session unavailable", "No browser session is available.")
  }

  const backendResponse = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  })

  if (!backendResponse.ok) {
    const response = await backendProblemResponse(backendResponse)
    response.cookies.delete(refreshCookieName)
    return response
  }

  const authResponse = await parseBackendAuthenticationResponse(backendResponse)
  const browserSession = browserAuthSessionSchema.parse(authResponse)
  const response = NextResponse.json(browserSession)
  response.cookies.set(refreshCookieName, authResponse.refreshToken, refreshCookieOptions)
  return response
}

export async function logoutSessionHandler(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return problemResponse(403, "Forbidden", "The request origin is not allowed.")
  }

  const refreshToken = request.cookies.get(refreshCookieName)?.value
  const authorization = request.headers.get("authorization")

  if (authorization) {
    await bestEffortBackendRequest(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        authorization,
      },
    })
  }

  if (refreshToken) {
    await bestEffortBackendRequest(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/revoke`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
  }

  return clearRefreshCookieResponse()
}

export async function clearBrowserSessionHandler(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return problemResponse(403, "Forbidden", "The request origin is not allowed.")
  }

  return clearRefreshCookieResponse()
}

export function authenticationResponseToBrowserSession(
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

function clearRefreshCookieResponse() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(refreshCookieName, "", {
    ...refreshCookieOptions,
    maxAge: 0,
  })
  return response
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")

  if (!origin) {
    return true
  }

  return origin === (process.env.APP_ORIGIN ?? new URL(request.url).origin)
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function parseBackendAuthenticationResponse(
  response: Response
): Promise<AuthenticationResponse> {
  const value: unknown = await response.json()
  return authenticationResponseSchema.parse(value)
}

async function backendProblemResponse(response: Response) {
  const contentType = response.headers.get("content-type")

  if (contentType?.includes("application/json")) {
    const value: unknown = await response.json()
    return NextResponse.json(value, { status: response.status })
  }

  return problemResponse(response.status, "Authentication failed", "Your session is no longer valid.")
}

function problemResponse(status: number, title: string, detail: string) {
  return NextResponse.json(
    {
      title,
      detail,
      status,
    },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
      },
    }
  )
}

async function bestEffortBackendRequest(
  input: RequestInfo | URL,
  init: RequestInit
): Promise<void> {
  try {
    await fetch(input, {
      ...init,
      cache: "no-store",
    })
  } catch {
    // Logout is deterministic client-side; backend cleanup is best effort here.
  }
}

