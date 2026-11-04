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
  handwritingAttemptDetailSchema,
  handwritingAttemptPageSchema,
  handwritingTemplateDetailSchema,
  handwritingTemplatePageSchema,
  submitHandwritingRequestSchema,
  type SubmitHandwritingRequest,
} from "./handwriting-schemas"

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  body?: SubmitHandwritingRequest
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
              body: JSON.stringify(submitHandwritingRequestSchema.parse(body)),
            }
          : {}),
      }
    )
    if (!response.ok) {
      const problem = await readProblemDetails(response)
      const retry = parseRetryAfter(response.headers.get("retry-after"))
      const messages: Record<number, string> = {
        400: "This drawing or content request couldn't be accepted. Check the selected templates and drawing limits, or refresh the page of results.",
        401: "Your session expired. Please sign in again.",
        403: "Handwriting practice isn't accessible right now.",
        404: "This handwriting template, profile, or attempt isn't available.",
        409: "The available templates changed. Review and confirm each character's template before submitting again.",
        413: "This drawing is too large to submit. Undo strokes or clear and redraw with fewer points.",
        415: "The drawing couldn't be submitted in the expected format. Reopen handwriting practice and try again.",
        429: "Too many handwriting requests. Please wait before trying again.",
      }
      throw new FoundationsError(
        messages[response.status] ??
          "We couldn't confirm the handwriting request. Check your connection and try again.",
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
        "The handwriting response couldn't be confirmed. Please check saved attempts."
      )
    return parsed.data
  } catch (error) {
    throw normalizeFoundationsError(error)
  }
}
const profilePath = (profileId: string) => `/${encodeURIComponent(profileId)}`
const systemPath = (profileId: string, systemCode: string) =>
  `${profilePath(profileId)}/writing-systems/${encodeURIComponent(systemCode)}`

export function listHandwritingTemplates(
  profileId: string,
  systemCode: string,
  after: string | null,
  signal: AbortSignal
) {
  return request(
    `${systemPath(profileId, systemCode)}/handwriting-templates?${catalogPageQuery(20, after)}`,
    handwritingTemplatePageSchema,
    signal
  )
}
export function getHandwritingTemplate(
  profileId: string,
  systemCode: string,
  templateId: string,
  signal: AbortSignal
) {
  return request(
    `${systemPath(profileId, systemCode)}/handwriting-templates/${encodeURIComponent(templateId)}`,
    handwritingTemplateDetailSchema,
    signal
  )
}
export function submitHandwriting(
  profileId: string,
  systemCode: string,
  body: SubmitHandwritingRequest,
  signal: AbortSignal
) {
  return request(
    `${systemPath(profileId, systemCode)}/handwriting-attempts`,
    handwritingAttemptDetailSchema.refine(
      (value) => value.attempt.learningProfileId === profileId
    ),
    signal,
    body
  )
}
export function listHandwritingAttempts(
  profileId: string,
  filters: { systemCode?: string; passed?: boolean },
  before: string | null,
  signal: AbortSignal
) {
  const query = new URLSearchParams({ pageSize: "20" })
  if (before) query.set("before", before)
  if (filters.systemCode) query.set("systemCode", filters.systemCode)
  if (filters.passed !== undefined) query.set("passed", String(filters.passed))
  return request(
    `${profilePath(profileId)}/handwriting-attempts?${query}`,
    handwritingAttemptPageSchema.refine((value) =>
      value.items.every((item) => item.learningProfileId === profileId)
    ),
    signal
  )
}
export function getHandwritingAttempt(
  profileId: string,
  attemptId: string,
  signal: AbortSignal
) {
  return request(
    `${profilePath(profileId)}/handwriting-attempts/${encodeURIComponent(attemptId)}`,
    handwritingAttemptDetailSchema.refine(
      (value) =>
        value.attempt.learningProfileId === profileId &&
        value.attempt.id === attemptId
    ),
    signal
  )
}
