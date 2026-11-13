import { requestPracticeContent } from "@/features/writing-system-practice/api/practice-api"
import {
  abandonWritingPracticeRequestSchema,
  submitWritingPracticeAnswerRequestSchema,
} from "@/features/writing-system-practice/api/practice-schemas"
import {
  grammarPracticeDetailSchema,
  grammarPracticeOptionsSchema,
  grammarPracticePageSchema,
} from "./grammar-practice-schemas"

const base = (profileId: string) =>
  `/${encodeURIComponent(profileId)}/grammar-practice`
const sessionPath = (profileId: string, sessionId: string) =>
  `${base(profileId)}/sessions/${encodeURIComponent(sessionId)}`
const detailSchema = (profileId: string, sessionId?: string) =>
  grammarPracticeDetailSchema.refine(
    (d) =>
      d.session.learningProfileId === profileId &&
      (sessionId === undefined || d.session.id === sessionId)
  )
export function getGrammarPracticeOptions(
  profileId: string,
  signal: AbortSignal
) {
  return requestPracticeContent(
    `${base(profileId)}/options`,
    grammarPracticeOptionsSchema.refine(
      (o) => o.learningProfileId === profileId
    ),
    signal
  )
}
export function startGrammarPractice(
  profileId: string,
  body: { grammarPointCode?: string; questionCount: number },
  signal: AbortSignal
) {
  return requestPracticeContent(
    `${base(profileId)}/sessions`,
    detailSchema(profileId),
    signal,
    body
  )
}
export function listGrammarPractice(
  profileId: string,
  filters: { status?: string; grammarPointCode?: string },
  before: string | null,
  signal: AbortSignal
) {
  const query = new URLSearchParams({ pageSize: "20" })
  if (before) query.set("before", before)
  if (filters.status) query.set("status", filters.status)
  if (filters.grammarPointCode)
    query.set("grammarPointCode", filters.grammarPointCode)
  return requestPracticeContent(
    `${base(profileId)}/sessions?${query}`,
    grammarPracticePageSchema.refine((p) =>
      p.items.every((s) => s.learningProfileId === profileId)
    ),
    signal
  )
}
export function getGrammarPractice(
  profileId: string,
  sessionId: string,
  signal: AbortSignal
) {
  return requestPracticeContent(
    sessionPath(profileId, sessionId),
    detailSchema(profileId, sessionId),
    signal
  )
}
export function answerGrammarPractice(
  profileId: string,
  sessionId: string,
  questionId: string,
  body: { selectedOptionIndex: number; version: number },
  signal: AbortSignal
) {
  return requestPracticeContent(
    `${sessionPath(profileId, sessionId)}/items/${encodeURIComponent(questionId)}/answer`,
    detailSchema(profileId, sessionId),
    signal,
    submitWritingPracticeAnswerRequestSchema.parse(body)
  )
}
export function abandonGrammarPractice(
  profileId: string,
  sessionId: string,
  body: { version: number },
  signal: AbortSignal
) {
  return requestPracticeContent(
    `${sessionPath(profileId, sessionId)}/abandon`,
    detailSchema(profileId, sessionId),
    signal,
    abandonWritingPracticeRequestSchema.parse(body)
  )
}
