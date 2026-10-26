import {
  isAuthRequestError,
  parseRetryAfter,
  readProblemDetails,
} from "@/features/auth/api/auth-errors"

export class FoundationsError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly retryAt?: number,
    readonly traceId?: string
  ) {
    super(message)
    this.name = "FoundationsError"
  }
}

export function normalizeFoundationsError(error: unknown): FoundationsError {
  if (error instanceof FoundationsError) return error
  if (isAuthRequestError(error))
    return new FoundationsError(error.authError.message, 401)
  return new FoundationsError(
    "We couldn't load this content. Check your connection and try again."
  )
}

export async function foundationsErrorFromResponse(response: Response) {
  const problem = await readProblemDetails(response)
  const retry = parseRetryAfter(response.headers.get("retry-after"))
  const messages: Record<number, string> = {
    400: "This content link or page is invalid. Open it again from Language Foundations.",
    401: "Your session expired. Please sign in again.",
    403: "This content isn't accessible right now. Please try again later.",
    404: "This content hasn't been published or is no longer available.",
    429: "Too many requests. Please wait before loading more content.",
  }
  return new FoundationsError(
    messages[response.status] ??
      "We couldn't load this content. Please try again.",
    response.status,
    retry === undefined
      ? response.status === 429
        ? Date.now() + 5000
        : undefined
      : Date.now() + retry * 1000,
    problem?.traceId
  )
}
