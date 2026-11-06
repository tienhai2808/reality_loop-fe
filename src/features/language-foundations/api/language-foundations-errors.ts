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
    "Không tải được nội dung. Hãy kiểm tra kết nối rồi thử lại."
  )
}

export async function foundationsErrorFromResponse(response: Response) {
  const problem = await readProblemDetails(response)
  const retry = parseRetryAfter(response.headers.get("retry-after"))
  const messages: Record<number, string> = {
    400: "Đường dẫn này không hợp lệ. Hãy mở lại từ khu Học.",
    401: "Phiên đã hết hạn. Hãy đăng nhập lại.",
    403: "Hiện không thể mở nội dung này. Hãy thử lại sau.",
    404: "Nội dung này hiện chưa có hoặc đã ngừng phát hành.",
    429: "Bạn đã thao tác quá nhanh. Hãy đợi rồi tải thêm nội dung.",
  }
  return new FoundationsError(
    messages[response.status] ??
      "Không tải được nội dung. Hãy thử lại.",
    response.status,
    retry === undefined
      ? response.status === 429
        ? Date.now() + 5000
        : undefined
      : Date.now() + retry * 1000,
    problem?.traceId
  )
}
