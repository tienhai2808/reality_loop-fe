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

  return "Đã xảy ra lỗi."
}

export function networkAuthError(): AppAuthError {
  return {
    kind: "network",
    message: "Không kết nối được máy chủ đăng nhập. Hãy kiểm tra kết nối rồi thử lại.",
  }
}

export async function authErrorFromResponse(
  response: Response,
  fallbackMessage = "Không hoàn tất được yêu cầu đăng nhập."
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
        message: "Phiên đã hết hạn. Hãy đăng nhập lại.",
      }
    case 403:
      return {
        kind: "forbidden",
        message: "Bạn không có quyền thực hiện thao tác này.",
      }
    case 404:
      return {
        kind: "not-found",
        message: "Không tìm thấy phiên đăng nhập.",
      }
    case 409:
      return {
        kind: "conflict",
        message:
          "Email này đã thuộc một tài khoản khác.",
      }
    case 429:
      return {
        kind: "rate-limit",
        message: retryAfter
          ? `Bạn đã thử quá nhiều lần. Thử lại sau ${retryAfter} seconds.`
          : "Bạn đã thử quá nhiều lần. Hãy đợi một lúc rồi thử lại.",
        retryAfter,
      }
    case 502:
      return {
        kind: "provider-unavailable",
        message:
          "Nhà cung cấp đăng nhập đang gián đoạn. Hãy thử lại sau.",
      }
    default:
      return {
        kind: "server",
        message:
          response.status >= 500
            ? "Máy chủ đăng nhập gặp lỗi. Hãy thử lại."
            : message,
        traceId: problem?.traceId,
      }
  }
}

export function parseRetryAfter(value: string | null): number | undefined {
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

export async function readProblemDetails(response: Response) {
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
      messages[0] ?? "Giá trị không hợp lệ.",
    ])
  )
}

