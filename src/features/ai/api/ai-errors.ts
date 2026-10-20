import { z } from "zod"

import {
  isAuthRequestError,
  parseRetryAfter,
  readProblemDetails,
} from "@/features/auth/api/auth-errors"
import { problemDetailsSchema } from "@/features/auth/api/auth-schemas"
import type { AiFailureCode } from "./ai-schemas"

export const aiFailureMessages: Record<AiFailureCode, string> = {
  InvalidApiKey: "The API key is invalid, expired, or revoked.",
  QuotaExceeded: "This provider account currently has no available quota.",
  RateLimited: "The provider is currently rate limiting this connection.",
  ProviderUnavailable: "The provider is temporarily unavailable.",
  ModelUnavailable: "The selected model is unavailable.",
}

const aiProblemSchema = problemDetailsSchema.extend({
  code: z.string().optional(),
  retryAfterAt: z.string().nullable().optional(),
})

export class AiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly code?: string,
    readonly retryAt?: number,
    readonly fieldErrors?: Record<string, string>
  ) {
    super(message)
    this.name = "AiRequestError"
  }
}

export async function aiErrorFromResponse(
  response: Response
): Promise<AiRequestError> {
  const parsed = aiProblemSchema.safeParse(await readProblemDetails(response))
  const problem = parsed.success ? parsed.data : null
  const seconds = parseRetryAfter(response.headers.get("retry-after"))
  const providerRetry = problem?.retryAfterAt
    ? Date.parse(problem.retryAfterAt)
    : NaN
  const retryAt =
    Math.max(
      seconds === undefined ? 0 : Date.now() + seconds * 1000,
      Number.isFinite(providerRetry) ? providerRetry : 0
    ) || undefined
  const code = problem?.code
  let message = "We couldn't complete this request. Please try again."
  switch (response.status) {
    case 400:
      message = "Check the connection details and try again."
      break
    case 401:
      message = "Your session expired. Please sign in again."
      break
    case 403:
      message = "You don't have permission to manage AI connections."
      break
    case 404:
      message = "This AI connection is no longer available. Refresh the list."
      break
    case 409:
      message =
        code === "CreationInProgress"
          ? "This connection is still being saved. Wait a moment, then retry."
          : "This AI connection changed in another session. Review the latest version before trying again."
      break
    case 422:
      message =
        failureMessage(code) ??
        "Check your API key, model access, and provider account quota."
      break
    case 429:
      message = "Too many setup requests. Please wait before trying again."
      break
    case 502:
    case 504:
      message =
        failureMessage(code) ??
        "The provider is unavailable or took too long to respond. Please try again later."
      break
  }
  // Only known, local guidance is displayed: provider payloads may echo secrets.
  const fieldErrors: Record<string, string> = {}
  for (const field of Object.keys(problem?.errors ?? {})) {
    const normalized = field.replace(/^\$\./, "").toLowerCase()
    if (normalized === "apikey")
      fieldErrors.apiKey = "Check the API key and provider permissions."
    if (normalized === "modelid")
      fieldErrors.modelId = "Choose an available model."
    if (normalized === "displayname")
      fieldErrors.displayName = "Use a name of 150 characters or fewer."
    if (normalized === "provider")
      fieldErrors.provider = "Choose an available provider."
  }
  return new AiRequestError(
    message,
    response.status,
    code,
    retryAt ??
      (code === "CreationInProgress"
        ? Date.now() + 2000
        : response.status === 429
          ? Date.now() + 5000
          : undefined),
    fieldErrors
  )
}

function failureMessage(code: string | undefined): string | undefined {
  return Object.entries(aiFailureMessages).find(([key]) => key === code)?.[1]
}

export function normalizeAiError(error: unknown): AiRequestError {
  if (error instanceof AiRequestError) return error
  if (isAuthRequestError(error))
    return new AiRequestError(error.authError.message, 401)
  return new AiRequestError(
    "We couldn't reach the server or confirm the response. Check your connection and try again."
  )
}

export function isUncertainCreation(error: AiRequestError): boolean {
  return (
    error.status === null ||
    error.status >= 500 ||
    error.code === "CreationInProgress"
  )
}
