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
    "Chưa xác nhận được yêu cầu. Hãy kiểm tra kết nối rồi thử lại."
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
    400: "Kiểm tra tùy chọn học rồi thử lại.",
    401: "Phiên đã hết hạn. Hãy đăng nhập lại.",
    403: "Bạn không có quyền quản lý các hồ sơ này.",
    404: "Hồ sơ này hiện không có. Hãy tải lại danh sách.",
    409: "Ngôn ngữ này đã có hồ sơ hoặc hồ sơ vừa thay đổi. Hãy tải danh sách mới nhất.",
    413: "Nội dung quá dài. Hãy rút gọn mục tiêu rồi thử lại.",
    429: "Bạn đã thao tác quá nhanh. Hãy đợi rồi thử lại.",
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
    if (field) fieldErrors[field] = errors[0] ?? "Kiểm tra lại giá trị này."
  }
  return new LearningProfileError(
    messages[response.status] ??
      "Không lưu được tùy chọn học. Hãy thử lại.",
    response.status,
    retryAt,
    fieldErrors,
    problem?.traceId
  )
}

export function isUnknownProfileCreation(error: LearningProfileError) {
  return error.status === null || error.status >= 500
}
