import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"
import { partOfSpeechSchema } from "@/features/vocabulary/api/vocabulary-schemas"

const id = z.string().min(1)
const count = z.number().int().nonnegative()
const version = z.number().int().positive()
const timestamp = z.iso.datetime({ offset: true })
export const vocabularyLearningStatusSchema = z.enum([
  "New",
  "Learning",
  "Reviewing",
])
export const vocabularyReviewRatingSchema = z.enum([
  "Again",
  "Hard",
  "Good",
  "Easy",
])
export const vocabularyLearningProgressSchema = z.object({
  id,
  learningProfileId: id,
  vocabularySenseId: id,
  status: vocabularyLearningStatusSchema,
  nextReviewAt: timestamp,
  lastReviewedAt: timestamp.nullable(),
  intervalMinutes: count,
  reviewCount: count,
  againCount: count,
  consecutiveRecallCount: count,
  schedulerVersion: z.string().nullable(),
  version,
  createdAt: timestamp,
  updatedAt: timestamp,
})
export const vocabularyFlashcardSchema = z.object({
  progress: vocabularyLearningProgressSchema,
  vocabularyEntryId: id,
  entryCode: z.string(),
  term: z.string(),
  reading: z.string().nullable(),
  audioUrl: z.string().nullable(),
  senseCode: z.string(),
  partOfSpeech: partOfSpeechSchema,
  meaning: z.string().nullable(),
  usageNote: z.string().nullable(),
  requestedLocale: z.string(),
  translationLocale: z.string().nullable(),
  isTranslationFallback: z.boolean(),
})
export const vocabularyLearningSummarySchema = z.object({
  learningProfileId: id,
  total: count,
  new: count,
  learning: count,
  reviewing: count,
  due: count,
  nextFutureReviewAt: timestamp.nullable(),
  asOf: timestamp,
})
export const vocabularyReviewSchema = z.object({
  id,
  progressId: id,
  requestId: z.uuid(),
  reviewNumber: version,
  rating: vocabularyReviewRatingSchema,
  previousStatus: vocabularyLearningStatusSchema,
  status: z.enum(["Learning", "Reviewing"]),
  previousDueAt: timestamp,
  nextReviewAt: timestamp,
  previousIntervalMinutes: count,
  intervalMinutes: count,
  againCount: count,
  consecutiveRecallCount: count,
  progressVersionBefore: version,
  progressVersionAfter: version,
  schedulerVersion: z.string(),
  reviewedAt: timestamp,
})
export const vocabularyLearningPageSchema = catalogPageSchema(
  vocabularyFlashcardSchema
).extend({ asOf: timestamp })
export const vocabularyReviewPageSchema = catalogPageSchema(
  vocabularyReviewSchema
)
export const recordVocabularyReviewSchema = z.object({
  requestId: z.uuid(),
  version,
  rating: vocabularyReviewRatingSchema,
})

export type VocabularyLearningStatus = z.infer<
  typeof vocabularyLearningStatusSchema
>
export type VocabularyReviewRating = z.infer<
  typeof vocabularyReviewRatingSchema
>
export type VocabularyLearningProgress = z.infer<
  typeof vocabularyLearningProgressSchema
>
export type VocabularyFlashcard = z.infer<typeof vocabularyFlashcardSchema>
export type VocabularyLearningSummary = z.infer<
  typeof vocabularyLearningSummarySchema
>
export type VocabularyReview = z.infer<typeof vocabularyReviewSchema>
export type RecordVocabularyReview = z.infer<
  typeof recordVocabularyReviewSchema
>
