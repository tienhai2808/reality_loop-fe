import { problemDetailsSchema } from "@/features/auth/api/auth-schemas"

export type AppAuthError =
  | {
      kind: "validation"
      message: string
      fieldErrors?: Record<string, string>
    }
  | {
      kind: "unauthorized"
      message: string
    }
  | {
      kind: "forbidden"
      message: string
    }
  | {
      kind: "not-found"
      message: string
    }
  | {
      kind: "conflict"
      message: string
    }
  | {
      kind: "rate-limit"
      message: string
      retryAfter?: number
    }
  | {
      kind: "provider-unavailable"
      message: string
    }
  | {
      kind: "network"
      message: string
    }
  | {
      kind: "server"
      message: string
      traceId?: string
    }

export class AuthRequestError extends Error {
  readonly authError: AppAuthError

  constructor(authError: AppAuthError) {
    super(authError.message)
    this.name = "AuthRequestError"
    this.authError = authError
  }
}

export function isAuthRequestError(error: unknown): error is AuthRequestError {
  return error instanceof AuthRequestError
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAuthRequestError(error)) {
    return error.authError.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong."
}

export function networkAuthError(): AppAuthError {
  return {
    kind: "network",
    message: "We could not reach the authentication server. Check your connection and try again.",
  }
}

export async function authErrorFromResponse(
  response: Response,
  fallbackMessage = "The authentication request could not be completed."
): Promise<AppAuthError> {
  const retryAfter = parseRetryAfter(response.headers.get("retry-after"))
  const problem = await readProblemDetails(response)
  const message = problem?.detail ?? problem?.title ?? fallbackMessage

  switch (response.status) {
    case 400:
    case 422:
      return {
        kind: "validation",
        message,
        fieldErrors: flattenFieldErrors(problem?.errors),
      }
    case 401:
      return {
        kind: "unauthorized",
        message: "Your session is no longer valid. Please sign in again.",
      }
    case 403:
      return {
        kind: "forbidden",
        message: "You do not have access to perform this action.",
      }
    case 404:
      return {
        kind: "not-found",
        message: "The requested session could not be found.",
      }
    case 409:
      return {
        kind: "conflict",
        message:
          "This email is already associated with another account. Account linking is not available yet.",
      }
    case 429:
      return {
        kind: "rate-limit",
        message: retryAfter
          ? `Too many attempts. Try again in ${retryAfter} seconds.`
          : "Too many attempts. Please wait a moment and try again.",
        retryAfter,
      }
    case 502:
      return {
        kind: "provider-unavailable",
        message:
          "The sign-in provider is temporarily unavailable. Please try again in a moment.",
      }
    default:
      return {
        kind: "server",
        message:
          response.status >= 500
            ? "The authentication server had a problem. Please try again."
            : message,
        traceId: problem?.traceId,
      }
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds
  }

  const retryAt = Date.parse(value)
  if (Number.isNaN(retryAt)) {
    return undefined
  }

  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
}

async function readProblemDetails(response: Response) {
  const contentType = response.headers.get("content-type")

  if (!contentType?.includes("application/problem+json") && !contentType?.includes("application/json")) {
    return null
  }

  try {
    const value: unknown = await response.json()
    const parsed = problemDetailsSchema.safeParse(value)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function flattenFieldErrors(
  errors: Record<string, string[]> | undefined
): Record<string, string> | undefined {
  if (!errors) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      messages[0] ?? "Invalid value.",
    ])
  )
}

