import { z } from "zod"

import {
  isAuthRequestError,
  parseRetryAfter,
  readProblemDetails,
} from "@/features/auth/api/auth-errors"
import { problemDetailsSchema } from "@/features/auth/api/auth-schemas"
import type { AiFailureCode } from "./ai-schemas"

export const aiFailureMessages: Record<AiFailureCode, string> = {
  InvalidApiKey: "Khóa API không hợp lệ, đã hết hạn hoặc bị thu hồi.",
  QuotaExceeded: "Tài khoản nhà cung cấp đã hết hạn mức.",
  RateLimited: "Nhà cung cấp đang giới hạn lượt yêu cầu.",
  ProviderUnavailable: "Nhà cung cấp đang tạm gián đoạn.",
  ModelUnavailable: "Mô hình đã chọn hiện không khả dụng.",
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
  let message = "Không hoàn tất được yêu cầu. Hãy thử lại."
  switch (response.status) {
    case 400:
      message = "Kiểm tra thông tin kết nối rồi thử lại."
      break
    case 401:
      message = "Phiên đã hết hạn. Hãy đăng nhập lại."
      break
    case 403:
      message = "Bạn không có quyền quản lý kết nối AI."
      break
    case 404:
      message = "Kết nối AI này hiện không có. Hãy tải lại danh sách."
      break
    case 409:
      message =
        code === "CreationInProgress"
          ? "Kết nối đang được lưu. Hãy đợi rồi thử lại."
          : "Kết nối đã thay đổi ở phiên khác. Hãy xem bản mới nhất."
      break
    case 422:
      message =
        failureMessage(code) ??
        "Kiểm tra khóa API, quyền dùng mô hình và hạn mức."
      break
    case 429:
      message = "Bạn đã gửi quá nhiều yêu cầu. Hãy đợi rồi thử lại."
      break
    case 502:
    case 504:
      message =
        failureMessage(code) ??
        "Nhà cung cấp gián đoạn hoặc phản hồi quá chậm. Hãy thử lại sau."
      break
  }
  // Only known, local guidance is displayed: provider payloads may echo secrets.
  const fieldErrors: Record<string, string> = {}
  for (const field of Object.keys(problem?.errors ?? {})) {
    const normalized = field.replace(/^\$\./, "").toLowerCase()
    if (normalized === "apikey")
      fieldErrors.apiKey = "Kiểm tra khóa API và quyền của nhà cung cấp."
    if (normalized === "modelid")
      fieldErrors.modelId = "Chọn mô hình có sẵn."
    if (normalized === "displayname")
      fieldErrors.displayName = "Tên tối đa 150 ký tự."
    if (normalized === "provider")
      fieldErrors.provider = "Chọn nhà cung cấp có sẵn."
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
    "Không xác nhận được phản hồi. Hãy kiểm tra kết nối rồi thử lại."
  )
}

export function isUncertainCreation(error: AiRequestError): boolean {
  return (
    error.status === null ||
    error.status >= 500 ||
    error.code === "CreationInProgress"
  )
}
