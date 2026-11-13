import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"
import {
  writingPracticeSessionSchema,
  writingPracticeQuestionSchema,
  writingPracticeStatusSchema,
} from "@/features/writing-system-practice/api/practice-schemas"

const id = z.string().min(1)
const count = z.number().int().nonnegative()
export const grammarPracticeStatusSchema = writingPracticeStatusSchema
export type GrammarPracticeStatus = z.infer<typeof grammarPracticeStatusSchema>
export const grammarPracticeSessionSchema = writingPracticeSessionSchema
  .omit({ writingSystemId: true })
  .extend({
    languageId: id,
    grammarPointId: id.nullable(),
    explanationLanguage: z.string(),
    questionCount: z.number().int().positive(),
  })
export const grammarPracticeQuestionSchema = z
  .object(writingPracticeQuestionSchema.shape)
  .omit({ writingSystemItemId: true, symbol: true, transcriptionSystem: true })
  .extend({
    grammarExerciseId: id,
    grammarPointId: id,
    prompt: z.string().refine((value) => value.split("{blank}").length === 2),
    instruction: z.string(),
    translationLocale: z.string(),
    isTranslationFallback: z.boolean(),
    explanation: z.string().nullable(),
  })
  .superRefine((q, ctx) => {
    if (
      q.answeredAt === null &&
      (q.correctOptionIndex !== null ||
        q.selectedOptionIndex !== null ||
        q.isCorrect !== null ||
        q.explanation !== null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Unanswered question reveals feedback.",
      })
    if (
      q.answeredAt !== null &&
      (q.selectedOptionIndex === null ||
        q.correctOptionIndex === null ||
        q.isCorrect === null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Answer feedback is incomplete.",
      })
    if (
      [q.selectedOptionIndex, q.correctOptionIndex].some(
        (index) => index !== null && index >= q.options.length
      )
    )
      ctx.addIssue({ code: "custom", message: "Invalid answer index." })
  })
export const grammarPracticeDetailSchema = z
  .object({
    session: grammarPracticeSessionSchema,
    items: z.array(grammarPracticeQuestionSchema),
  })
  .refine(
    (detail) =>
      new Set(detail.items.map((q) => q.id)).size === detail.items.length &&
      new Set(detail.items.map((q) => q.position)).size === detail.items.length
  )
export const grammarPracticePageSchema = catalogPageSchema(
  grammarPracticeSessionSchema
)
export const grammarPracticeOptionsSchema = z.object({
  learningProfileId: id,
  languageId: id,
  languageCode: z.string(),
  explanationLanguage: z.string(),
  minQuestionCount: z.number().int().positive(),
  maxQuestionCount: z.number().int().positive(),
  defaultQuestionCount: z.number().int().positive(),
  availableQuestionCount: count,
  grammarPoints: z.array(
    z.object({
      id,
      code: z.string(),
      nativeName: z.string(),
      name: z.string(),
      translationLocale: z.string().nullable(),
      isTranslationFallback: z.boolean(),
      availableQuestionCount: count,
      sortOrder: z.number().int(),
    })
  ),
})
export type GrammarPracticeDetail = z.infer<typeof grammarPracticeDetailSchema>
export type GrammarPracticeQuestion = z.infer<
  typeof grammarPracticeQuestionSchema
>
export type GrammarPracticeSessionSummary = z.infer<
  typeof grammarPracticeSessionSchema
>
export type GrammarPracticeOptions = z.infer<
  typeof grammarPracticeOptionsSchema
>
