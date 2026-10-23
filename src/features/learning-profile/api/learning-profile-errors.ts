import {
  isAuthRequestError,
  parseRetryAfter,
  readProblemDetails,
} from "@/features/auth/api/auth-errors"

export class LearningProfileError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly retryAt?: number,
    readonly fieldErrors?: Record<string, string>,
    readonly traceId?: string
  ) {
    super(message)
    this.name = "LearningProfileError"
  }
}

export function normalizeLearningProfileError(
  error: unknown
): LearningProfileError {
  if (error instanceof LearningProfileError) return error
  if (isAuthRequestError(error))
    return new LearningProfileError(error.authError.message, 401)
  return new LearningProfileError(
    "We couldn't confirm the request. Check your connection and try again."
  )
}

export async function learningProfileErrorFromResponse(response: Response) {
  const problem = await readProblemDetails(response)
  const seconds = parseRetryAfter(response.headers.get("retry-after"))
  const retryAt =
    seconds === undefined
      ? response.status === 429
        ? Date.now() + 5000
        : undefined
      : Date.now() + seconds * 1000
  const messages: Record<number, string> = {
    400: "Check your learning preferences and try again.",
    401: "Your session expired. Please sign in again.",
    403: "You don't have permission to manage these learning profiles.",
    404: "This learning profile is no longer available. Refresh your profiles.",
    409: "A profile for this language already exists, or the profile changed elsewhere. Review the latest profiles before trying again.",
    413: "The submitted content is too large. Shorten your goal note and try again.",
    429: "Too many requests. Please wait before trying again.",
  }
  const fieldErrors: Record<string, string> = {}
  const fields = [
    "targetLanguage",
    "nativeLanguage",
    "explanationLanguage",
    "proficiencyLevel",
    "primaryGoal",
    "goalNote",
  ] as const
  for (const [key, errors] of Object.entries(problem?.errors ?? {})) {
    const field = fields.find(
      (field) => field.toLowerCase() === key.replace(/^\$\./, "").toLowerCase()
    )
    if (field) fieldErrors[field] = errors[0] ?? "Check this value."
  }
  return new LearningProfileError(
    messages[response.status] ??
      "We couldn't save your learning preferences. Please try again.",
    response.status,
    retryAt,
    fieldErrors,
    problem?.traceId
  )
}

export function isUnknownProfileCreation(error: LearningProfileError) {
  return error.status === null || error.status >= 500
}
