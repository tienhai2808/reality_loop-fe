import { AuthRequestError, authErrorFromResponse } from "@/features/auth/api/auth-errors"
import { authenticatedFetch } from "@/features/auth/api/authenticated-fetch"
import { sessionsPageSchema, type SessionsPage } from "@/features/auth/api/auth-schemas"
import { env } from "@/lib/env"

const jsonHeaders = {
  "content-type": "application/json",
} as const

export async function listSessions({
  pageSize = 20,
  before,
}: {
  pageSize?: number
  before?: string | null
} = {}): Promise<SessionsPage> {
  const url = new URL(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/sessions`)
  url.searchParams.set("pageSize", String(pageSize))

  if (before) {
    url.searchParams.set("before", before)
  }

  const response = await authenticatedFetch(url, {
    method: "GET",
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }

  const value: unknown = await response.json()
  return sessionsPageSchema.parse(value)
}

export async function revokeSelectedSessions(sessionIds: string[]): Promise<void> {
  const uniqueSessionIds = [...new Set(sessionIds)].slice(0, 100)

  const response = await authenticatedFetch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout/sessions`,
    {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ sessionIds: uniqueSessionIds }),
    }
  )

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }
}

export async function revokeOtherSessions(): Promise<void> {
  const response = await authenticatedFetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout/others`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }
}

export async function revokeAllSessions(): Promise<void> {
  const response = await authenticatedFetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/logout/all`, {
    method: "POST",
  })

  if (!response.ok) {
    throw new AuthRequestError(await authErrorFromResponse(response))
  }
}

