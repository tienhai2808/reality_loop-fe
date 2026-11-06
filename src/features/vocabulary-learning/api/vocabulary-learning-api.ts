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
  recordVocabularyReviewSchema,
  vocabularyFlashcardSchema,
  vocabularyLearningPageSchema,
  vocabularyLearningProgressSchema,
  vocabularyLearningSummarySchema,
  vocabularyReviewPageSchema,
  vocabularyReviewSchema,
  type RecordVocabularyReview,
  type VocabularyLearningStatus,
} from "./vocabulary-learning-schemas"

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  method = "GET",
  body?: RecordVocabularyReview
): Promise<T> {
  try {
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/learning-profiles${path}`,
      {
        method,
        cache: "no-store",
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recordVocabularyReviewSchema.parse(body)),
            }
          : {}),
      }
    )
    if (!response.ok) {
      const problem = await readProblemDetails(response)
      const retry = parseRetryAfter(response.headers.get("retry-after"))
      const messages: Record<number, string> = {
        400: "Hãy tải lại thẻ hoặc danh sách trước khi thử lại.",
        401: "Phiên đã hết hạn. Hãy đăng nhập lại.",
        403: "Hiện không thể mở ôn từ vựng.",
        404: "Không tìm thấy hồ sơ hoặc thẻ. Nội dung có thể đã ngừng phát hành.",
        409: "Thẻ đã thay đổi. Hãy xem bản mới nhất trước khi đánh giá.",
        413: "Yêu cầu quá lớn. Hãy tải lại thẻ rồi thử lại.",
        415: "Định dạng đánh giá không hợp lệ. Hãy tải lại thẻ rồi thử lại.",
        429: "Bạn đã đánh giá quá nhanh. Hãy đợi rồi thử lại.",
      }
      throw new FoundationsError(
        messages[response.status] ??
          "Chưa xác nhận được yêu cầu. Hãy kiểm tra kết nối rồi thử lại.",
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
      throw new FoundationsError("Chưa xác nhận được đánh giá. Hãy thử lại.")
    return parsed.data
  } catch (error) {
    throw normalizeFoundationsError(error)
  }
}
const profilePath = (profileId: string) => `/${encodeURIComponent(profileId)}`
const learningPath = (profileId: string) =>
  `${profilePath(profileId)}/vocabulary-learning`
const cardPath = (profileId: string, progressId: string) =>
  `${learningPath(profileId)}/${encodeURIComponent(progressId)}`

export function addVocabularySense(
  profileId: string,
  senseId: string,
  signal: AbortSignal
) {
  return request(
    `${profilePath(profileId)}/vocabulary-senses/${encodeURIComponent(senseId)}/learning-progress`,
    vocabularyLearningProgressSchema.refine(
      (value) =>
        value.learningProfileId === profileId &&
        value.vocabularySenseId === senseId
    ),
    signal,
    "PUT"
  )
}
export function getVocabularyLearningSummary(
  profileId: string,
  signal: AbortSignal
) {
  return request(
    `${learningPath(profileId)}/summary`,
    vocabularyLearningSummarySchema.refine(
      (value) => value.learningProfileId === profileId
    ),
    signal
  )
}
export function listVocabularyLearning(
  profileId: string,
  locale: string,
  dueOnly: boolean,
  status: VocabularyLearningStatus | undefined,
  after: string | null,
  signal: AbortSignal
) {
  const query = new URLSearchParams({
    locale,
    dueOnly: String(dueOnly),
    pageSize: "20",
  })
  if (status) query.set("status", status)
  if (after) query.set("after", after)
  return request(
    `${learningPath(profileId)}?${query}`,
    vocabularyLearningPageSchema.refine((value) =>
      value.items.every((card) => card.progress.learningProfileId === profileId)
    ),
    signal
  )
}
export function getVocabularyLearningCard(
  profileId: string,
  progressId: string,
  locale: string,
  signal: AbortSignal
) {
  return request(
    `${cardPath(profileId, progressId)}?${new URLSearchParams({ locale })}`,
    vocabularyFlashcardSchema.refine(
      (value) =>
        value.progress.learningProfileId === profileId &&
        value.progress.id === progressId
    ),
    signal
  )
}
export function recordVocabularyReview(
  profileId: string,
  progressId: string,
  body: RecordVocabularyReview,
  signal: AbortSignal
) {
  return request(
    `${cardPath(profileId, progressId)}/reviews`,
    vocabularyReviewSchema.refine(
      (value) =>
        value.progressId === progressId &&
        value.requestId === body.requestId &&
        value.rating === body.rating &&
        value.progressVersionBefore === body.version
    ),
    signal,
    "POST",
    body
  )
}
export function listVocabularyReviews(
  profileId: string,
  progressId: string,
  before: string | null,
  signal: AbortSignal
) {
  const query = new URLSearchParams({ pageSize: "20" })
  if (before) query.set("before", before)
  return request(
    `${cardPath(profileId, progressId)}/reviews?${query}`,
    vocabularyReviewPageSchema.refine((value) =>
      value.items.every((review) => review.progressId === progressId)
    ),
    signal
  )
}
