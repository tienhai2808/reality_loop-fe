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
import { catalogPageQuery } from "@/features/language-foundations/api/language-foundations-api"
import { env } from "@/lib/env"
import {
  progressPageSchema,
  recordProgressRequestSchema,
  writingSystemItemProgressSchema,
  writingSystemProgressOverviewSchema,
  type RecordProgressRequest,
} from "./learning-progress-schemas"

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
  body?: RecordProgressRequest
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
              body: JSON.stringify(recordProgressRequestSchema.parse(body)),
            }
          : {}),
      }
    )
    if (!response.ok) {
      const problem = await readProblemDetails(response)
      const retry = parseRetryAfter(response.headers.get("retry-after"))
      const messages: Record<number, string> = {
        400: "Không tải hoặc lưu được tiến độ. Hãy mở lại bảng chữ rồi thử lại.",
        401: "Phiên đã hết hạn. Hãy đăng nhập lại.",
        403: "Bạn không có quyền xem tiến độ này.",
        404: "Không tìm thấy tiến độ của hồ sơ hoặc chữ này. Hãy mở lại Bảng chữ.",
        409: "Tiến độ của chữ đã thay đổi. Hãy xem trạng thái mới nhất.",
        413: "Yêu cầu quá lớn. Hãy mở lại chữ rồi thử lại.",
        429: "Bạn đã thao tác quá nhanh. Hãy đợi rồi thử lại.",
      }
      throw new FoundationsError(
        messages[response.status] ??
          "Chưa xác nhận được tiến độ. Hãy thử lại sau.",
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
        "Không đọc được tiến độ. Hãy tải lại."
      )
    return parsed.data
  } catch (error) {
    throw normalizeFoundationsError(error)
  }
}

const profilePath = (profileId: string) => `/${encodeURIComponent(profileId)}`
const systemPath = (profileId: string, systemCode: string) =>
  `${profilePath(profileId)}/writing-systems/${encodeURIComponent(systemCode)}`
const itemPath = (profileId: string, systemCode: string, itemId: string) =>
  `${systemPath(profileId, systemCode)}/items/${encodeURIComponent(itemId)}/progress`

export function getWritingProgressOverview(
  profileId: string,
  signal: AbortSignal
) {
  return request(
    `${profilePath(profileId)}/writing-system-progress`,
    writingSystemProgressOverviewSchema.refine(
      (value) => value.learningProfileId === profileId
    ),
    signal
  )
}

export function listWritingProgress(
  profileId: string,
  systemCode: string,
  after: string | null,
  signal: AbortSignal
) {
  return request(
    `${systemPath(profileId, systemCode)}/progress?${catalogPageQuery(100, after)}`,
    progressPageSchema.refine((page) =>
      page.items.every((item) => item.learningProfileId === profileId)
    ),
    signal
  )
}

export function getItemProgress(
  profileId: string,
  systemCode: string,
  itemId: string,
  signal: AbortSignal
) {
  return request(
    itemPath(profileId, systemCode, itemId),
    writingSystemItemProgressSchema.refine(
      (value) =>
        value.learningProfileId === profileId &&
        value.writingSystemItemId === itemId
    ),
    signal
  )
}

export function recordItemProgress(
  profileId: string,
  systemCode: string,
  itemId: string,
  body: RecordProgressRequest,
  signal: AbortSignal
) {
  return request(
    itemPath(profileId, systemCode, itemId),
    writingSystemItemProgressSchema.refine(
      (value) =>
        value.learningProfileId === profileId &&
        value.writingSystemItemId === itemId
    ),
    signal,
    body
  )
}
