import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"

const id = z.string().min(1)
const timestamp = z.iso.datetime({ offset: true }).nullable()

export const writingProgressStatusSchema = z.enum([
  "NotStarted",
  "Learning",
  "Completed",
])
export const writingProgressActionSchema = z.enum([
  "Study",
  "Complete",
  "Restart",
])
export const writingSystemProgressSummarySchema = z.object({
  writingSystemId: id,
  systemCode: z.string().min(1),
  totalItems: z.number().int().nonnegative(),
  notStartedItems: z.number().int().nonnegative(),
  learningItems: z.number().int().nonnegative(),
  completedItems: z.number().int().nonnegative(),
  lastStudiedAt: timestamp,
  completionPercentage: z.number().min(0).max(100),
})
export const writingSystemProgressOverviewSchema = z.object({
  learningProfileId: id,
  targetLanguage: z.string().min(1),
  writingSystems: z.array(writingSystemProgressSummarySchema),
})
export const writingSystemItemProgressSchema = z.object({
  learningProfileId: id,
  writingSystemItemId: id,
  itemCode: z.string().min(1),
  sortOrder: z.number().int(),
  status: writingProgressStatusSchema,
  version: z.number().int().nonnegative(),
  lastStudiedAt: timestamp,
  completedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
})
export const progressPageSchema = catalogPageSchema(
  writingSystemItemProgressSchema
)
export const recordProgressRequestSchema = z.object({
  action: writingProgressActionSchema,
  version: z.number().int().nonnegative(),
})

export type WritingProgressStatus = z.infer<typeof writingProgressStatusSchema>
export type WritingProgressAction = z.infer<typeof writingProgressActionSchema>
export type WritingSystemProgressSummary = z.infer<
  typeof writingSystemProgressSummarySchema
>
export type WritingSystemProgressOverview = z.infer<
  typeof writingSystemProgressOverviewSchema
>
export type WritingSystemItemProgress = z.infer<
  typeof writingSystemItemProgressSchema
>
export type ProgressPage = z.infer<typeof progressPageSchema>
export type RecordProgressRequest = z.infer<typeof recordProgressRequestSchema>
