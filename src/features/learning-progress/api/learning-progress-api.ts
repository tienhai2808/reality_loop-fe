import { z } from "zod"
import { authenticatedFetch } from "@/features/auth/api/authenticated-fetch"
import {
  parseRetryAfter,
  readProblemDetails,
} from "@/features/auth/api/auth-errors"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import { catalogPageQuery } from "@/features/language-foundations/api/language-foundations-api"
import { env } from "@/lib/env"
import {
  progressPageSchema,
  recordProgressRequestSchema,
  writingSystemItemProgressSchema,
  writingSystemProgressOverviewSchema,
  type RecordProgressRequest,
} from "./learning-progress-schemas"

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  body?: RecordProgressRequest
): Promise<T> {
  try {
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/learning-profiles${path}`,
      {
        method: body ? "POST" : "GET",
        cache: "no-store",
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recordProgressRequestSchema.parse(body)),
            }
          : {}),
      }
    )
    if (!response.ok) {
      const problem = await readProblemDetails(response)
      const retry = parseRetryAfter(response.headers.get("retry-after"))
      const messages: Record<number, string> = {
        400: "Progress couldn't be loaded or saved. Reopen this writing system to refresh it and try again.",
        401: "Your session expired. Please sign in again.",
        403: "You don't have permission to access this learning progress.",
        404: "Progress isn't available for this profile or character. Reopen Writing Systems to refresh the content.",
        409: "This character's progress changed elsewhere. Please review its latest state.",
        413: "This request is too large. Please reopen the character and try again.",
        429: "Too many learning actions. Please wait before trying again.",
      }
      throw new FoundationsError(
        messages[response.status] ??
          "We couldn't confirm your learning progress. Please try again later.",
        response.status,
        retry !== undefined
          ? Date.now() + retry * 1000
          : response.status === 429
            ? Date.now() + 5000
            : undefined,
        problem?.traceId
      )
    }
    const value: unknown = await response.json()
    const parsed = schema.safeParse(value)
    if (!parsed.success)
      throw new FoundationsError(
        "The progress response couldn't be read. Please refresh it."
      )
    return parsed.data
  } catch (error) {
    throw normalizeFoundationsError(error)
  }
}

const profilePath = (profileId: string) => `/${encodeURIComponent(profileId)}`
const systemPath = (profileId: string, systemCode: string) =>
  `${profilePath(profileId)}/writing-systems/${encodeURIComponent(systemCode)}`
const itemPath = (profileId: string, systemCode: string, itemId: string) =>
  `${systemPath(profileId, systemCode)}/items/${encodeURIComponent(itemId)}/progress`

export function getWritingProgressOverview(
  profileId: string,
  signal: AbortSignal
) {
  return request(
    `${profilePath(profileId)}/writing-system-progress`,
    writingSystemProgressOverviewSchema.refine(
      (value) => value.learningProfileId === profileId
    ),
    signal
  )
}

export function listWritingProgress(
  profileId: string,
  systemCode: string,
  after: string | null,
  signal: AbortSignal
) {
  return request(
    `${systemPath(profileId, systemCode)}/progress?${catalogPageQuery(100, after)}`,
    progressPageSchema.refine((page) =>
      page.items.every((item) => item.learningProfileId === profileId)
    ),
    signal
  )
}

export function getItemProgress(
  profileId: string,
  systemCode: string,
  itemId: string,
  signal: AbortSignal
) {
  return request(
    itemPath(profileId, systemCode, itemId),
    writingSystemItemProgressSchema.refine(
      (value) =>
        value.learningProfileId === profileId &&
        value.writingSystemItemId === itemId
    ),
    signal
  )
}

export function recordItemProgress(
  profileId: string,
  systemCode: string,
  itemId: string,
  body: RecordProgressRequest,
  signal: AbortSignal
) {
  return request(
    itemPath(profileId, systemCode, itemId),
    writingSystemItemProgressSchema.refine(
      (value) =>
        value.learningProfileId === profileId &&
        value.writingSystemItemId === itemId
    ),
    signal,
    body
  )
}
