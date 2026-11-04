import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"

const id = z.string().min(1)
const positive = z.number().int().positive()
const count = z.number().int().nonnegative()
const timestamp = z.iso.datetime({ offset: true })
export const inkPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})
export const inkDrawingSchema = z.array(z.array(inkPointSchema).min(1))
export const handwritingSourceSchema = z.object({
  url: z.string(),
  revision: z.string(),
  attribution: z.string(),
  license: z.string(),
  licenseUrl: z.string(),
})
export const handwritingTemplateReferenceSchema = z.object({
  id,
  writingSystemItemId: id,
  symbol: z.string(),
  revision: positive,
  source: handwritingSourceSchema,
})
export const handwritingTemplateSummarySchema = z.object({
  reference: handwritingTemplateReferenceSchema,
  itemCode: z.string(),
  sortOrder: z.number().int(),
  version: positive,
  updatedAt: timestamp,
})
export const handwritingPolicySchema = z.object({
  version: z.string(),
  samplesPerStroke: positive,
  shapeTolerance: z.number().nonnegative(),
  simplificationTolerance: z.number().nonnegative(),
  minimumDrawingExtent: z.number().nonnegative(),
  minimumRawStrokeLength: z.number().nonnegative(),
  minimumLengthRatio: z.number().nonnegative(),
  maximumLengthRatio: z.number().nonnegative(),
  maximumCharacters: positive,
  maximumStrokesPerCharacter: positive,
  maximumPointsPerStroke: positive,
  maximumTotalPoints: positive,
})
export const handwritingTemplatePageSchema = catalogPageSchema(
  handwritingTemplateSummarySchema
).extend({ policy: handwritingPolicySchema })
export const handwritingTemplateDetailSchema = z.object({
  template: handwritingTemplateSummarySchema,
  drawingFormatVersion: positive,
  strokes: inkDrawingSchema,
  strokeCount: count,
  policy: handwritingPolicySchema,
})
export const handwritingIssueSchema = z.enum([
  "MissingDrawing",
  "WrongStrokeCount",
  "DrawingTooSmall",
  "WrongStrokeOrder",
  "WrongDirection",
  "StrokeTooShort",
  "StrokeTooLong",
  "WrongShape",
])
export const handwritingStrokeFeedbackSchema = z.object({
  index: count,
  passed: z.boolean(),
  matchScore: z.number(),
  distance: z.number(),
  lengthRatio: z.number(),
  issues: z.array(handwritingIssueSchema),
})
export const handwritingFeedbackSchema = z.object({
  expectedStrokeCount: count,
  actualStrokeCount: count,
  issues: z.array(handwritingIssueSchema),
  strokes: z.array(handwritingStrokeFeedbackSchema),
  passed: z.boolean(),
  matchScore: z.number(),
})
export const handwritingAttemptSummarySchema = z.object({
  id,
  learningProfileId: id,
  writingSystemId: id,
  targetText: z.string(),
  algorithmVersion: z.string(),
  characterCount: positive,
  passed: z.boolean(),
  matchScore: z.number(),
  version: positive,
  createdAt: timestamp,
  updatedAt: timestamp,
})
export const handwritingAttemptCharacterSchema = z.object({
  id,
  position: count,
  template: handwritingTemplateReferenceSchema,
  drawingFormatVersion: positive,
  strokes: inkDrawingSchema,
  feedbackFormatVersion: positive,
  feedback: handwritingFeedbackSchema,
})
export const handwritingAttemptDetailSchema = z.object({
  attempt: handwritingAttemptSummarySchema,
  characters: z.array(handwritingAttemptCharacterSchema),
})
export const handwritingAttemptPageSchema = catalogPageSchema(
  handwritingAttemptSummarySchema
)
export const submitHandwritingRequestSchema = z.object({
  characters: z
    .array(z.object({ templateId: id, strokes: inkDrawingSchema }))
    .min(1),
})

export type InkPoint = z.infer<typeof inkPointSchema>
export type InkDrawing = z.infer<typeof inkDrawingSchema>
export type HandwritingSource = z.infer<typeof handwritingSourceSchema>
export type HandwritingTemplateReference = z.infer<
  typeof handwritingTemplateReferenceSchema
>
export type HandwritingTemplateSummary = z.infer<
  typeof handwritingTemplateSummarySchema
>
export type HandwritingPolicy = z.infer<typeof handwritingPolicySchema>
export type HandwritingTemplateDetail = z.infer<
  typeof handwritingTemplateDetailSchema
>
export type HandwritingTemplatePage = z.infer<
  typeof handwritingTemplatePageSchema
>
export type HandwritingIssue = z.infer<typeof handwritingIssueSchema>
export type HandwritingStrokeFeedback = z.infer<
  typeof handwritingStrokeFeedbackSchema
>
export type HandwritingFeedback = z.infer<typeof handwritingFeedbackSchema>
export type HandwritingAttemptSummary = z.infer<
  typeof handwritingAttemptSummarySchema
>
export type HandwritingAttemptCharacter = z.infer<
  typeof handwritingAttemptCharacterSchema
>
export type HandwritingAttemptDetail = z.infer<
  typeof handwritingAttemptDetailSchema
>
export type SubmitHandwritingRequest = z.infer<
  typeof submitHandwritingRequestSchema
>
