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
import { env } from "@/lib/env"
import {
  writingPracticeDetailSchema,
  writingPracticePageSchema,
  startWritingPracticeRequestSchema,
  submitWritingPracticeAnswerRequestSchema,
  abandonWritingPracticeRequestSchema,
  type StartWritingPracticeRequest,
  type SubmitWritingPracticeAnswerRequest,
  type AbandonWritingPracticeRequest,
  type WritingPracticeStatus,
} from "./practice-schemas"

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  body?: object
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
              body: JSON.stringify(body),
            }
          : {}),
      }
    )
    if (!response.ok) {
      const problem = await readProblemDetails(response)
      const retry = parseRetryAfter(response.headers.get("retry-after"))
      const messages: Record<number, string> = {
        400:
          problem?.detail ??
          "Kiểm tra bảng chữ đã chọn hoặc giảm số câu rồi thử lại.",
        401: "Phiên đã hết hạn. Hãy đăng nhập lại.",
        403: "Hiện không thể mở bài luyện. Hãy thử lại sau.",
        404: "Không tìm thấy bài luyện hoặc bảng chữ.",
        409: "Bài luyện đã thay đổi. Hãy xem bản đã lưu mới nhất.",
        413: "Yêu cầu quá lớn. Hãy mở lại bài luyện rồi thử lại.",
        429: "Bạn đã thao tác quá nhanh. Hãy đợi rồi thử lại.",
      }
      throw new FoundationsError(
        messages[response.status] ??
          "Chưa xác nhận được thao tác. Hãy kiểm tra kết nối rồi tải lại bài đã lưu.",
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
        "Chưa xác nhận được bài đã lưu. Hãy tải lại."
      )
    return parsed.data
  } catch (error) {
    throw normalizeFoundationsError(error)
  }
}
const profilePath = (profileId: string) => `/${encodeURIComponent(profileId)}`
const sessionPath = (profileId: string, sessionId: string) =>
  `${profilePath(profileId)}/practice-sessions/${encodeURIComponent(sessionId)}`
const detailSchema = (profileId: string, sessionId?: string) =>
  writingPracticeDetailSchema.refine(
    (detail) =>
      detail.session.learningProfileId === profileId &&
      (!sessionId || detail.session.id === sessionId)
  )

export function startWritingPractice(
  profileId: string,
  systemCode: string,
  body: StartWritingPracticeRequest,
  signal: AbortSignal
) {
  return request(
    `${profilePath(profileId)}/writing-systems/${encodeURIComponent(systemCode)}/practice-sessions`,
    detailSchema(profileId),
    signal,
    startWritingPracticeRequestSchema.parse(body)
  )
}
export function listWritingPractice(
  profileId: string,
  filters: { status?: WritingPracticeStatus; systemCode?: string },
  before: string | null,
  signal: AbortSignal
) {
  const query = new URLSearchParams({ pageSize: "20" })
  if (before) query.set("before", before)
  if (filters.status) query.set("status", filters.status)
  if (filters.systemCode) query.set("systemCode", filters.systemCode)
  return request(
    `${profilePath(profileId)}/practice-sessions?${query}`,
    writingPracticePageSchema.refine((page) =>
      page.items.every((item) => item.learningProfileId === profileId)
    ),
    signal
  )
}
export function getWritingPractice(
  profileId: string,
  sessionId: string,
  signal: AbortSignal
) {
  return request(
    sessionPath(profileId, sessionId),
    detailSchema(profileId, sessionId),
    signal
  )
}
export function submitWritingPracticeAnswer(
  profileId: string,
  sessionId: string,
  sessionItemId: string,
  body: SubmitWritingPracticeAnswerRequest,
  signal: AbortSignal
) {
  return request(
    `${sessionPath(profileId, sessionId)}/items/${encodeURIComponent(sessionItemId)}/answer`,
    detailSchema(profileId, sessionId),
    signal,
    submitWritingPracticeAnswerRequestSchema.parse(body)
  )
}
export function abandonWritingPractice(
  profileId: string,
  sessionId: string,
  body: AbandonWritingPracticeRequest,
  signal: AbortSignal
) {
  return request(
    `${sessionPath(profileId, sessionId)}/abandon`,
    detailSchema(profileId, sessionId),
    signal,
    abandonWritingPracticeRequestSchema.parse(body)
  )
}
