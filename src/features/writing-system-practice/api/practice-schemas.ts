import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"

const id = z.string().min(1)
const count = z.number().int().nonnegative()
const timestamp = z.iso.datetime({ offset: true })
export const writingPracticeStatusSchema = z.enum([
  "InProgress",
  "Completed",
  "Abandoned",
])
export const writingPracticeSessionSchema = z.object({
  id,
  learningProfileId: id,
  writingSystemId: id,
  questionCount: z.number().int().min(1).max(20),
  status: writingPracticeStatusSchema,
  answeredCount: count,
  correctCount: count,
  incorrectCount: count,
  unansweredCount: count,
  accuracyPercentage: z.number().min(0).max(100).nullable(),
  version: z.number().int().positive(),
  createdAt: timestamp,
  updatedAt: timestamp,
  endedAt: timestamp.nullable(),
})
export const writingPracticeQuestionSchema = z
  .object({
    id,
    writingSystemItemId: id,
    position: count,
    symbol: z.string(),
    transcriptionSystem: z.string(),
    options: z.array(z.string()).min(1),
    selectedOptionIndex: count.nullable(),
    correctOptionIndex: count.nullable(),
    isCorrect: z.boolean().nullable(),
    answeredAt: timestamp.nullable(),
  })
  .superRefine((question, context) => {
    const { selectedOptionIndex: selected, correctOptionIndex: correct } =
      question
    if (question.answeredAt === null) {
      if (selected !== null || correct !== null || question.isCorrect !== null)
        context.addIssue({
          code: "custom",
          message: "Unanswered question must not reveal grading.",
        })
    } else if (
      selected === null ||
      correct === null ||
      question.isCorrect === null
    ) {
      context.addIssue({
        code: "custom",
        message: "Saved answer feedback is incomplete.",
      })
    }
    if (
      (selected !== null && selected >= question.options.length) ||
      (correct !== null && correct >= question.options.length)
    )
      context.addIssue({
        code: "custom",
        message: "Answer index is outside the supplied options.",
      })
  })
export const writingPracticeDetailSchema = z
  .object({
    session: writingPracticeSessionSchema,
    items: z.array(writingPracticeQuestionSchema),
  })
  .refine(
    (detail) =>
      new Set(detail.items.map((item) => item.id)).size ===
        detail.items.length &&
      new Set(detail.items.map((item) => item.position)).size ===
        detail.items.length
  )
export const writingPracticePageSchema = catalogPageSchema(
  writingPracticeSessionSchema
)
export const startWritingPracticeRequestSchema = z.object({
  questionCount: z.number().int().min(1).max(20).optional(),
})
export const submitWritingPracticeAnswerRequestSchema = z.object({
  selectedOptionIndex: count,
  version: z.number().int().positive(),
})
export const abandonWritingPracticeRequestSchema = z.object({
  version: z.number().int().positive(),
})

export type WritingPracticeStatus = z.infer<typeof writingPracticeStatusSchema>
export type WritingPracticeSession = z.infer<
  typeof writingPracticeSessionSchema
>
export type WritingPracticeQuestion = z.infer<
  typeof writingPracticeQuestionSchema
>
export type WritingPracticeDetail = z.infer<typeof writingPracticeDetailSchema>
export type WritingPracticePage = z.infer<typeof writingPracticePageSchema>
export type StartWritingPracticeRequest = z.infer<
  typeof startWritingPracticeRequestSchema
>
export type SubmitWritingPracticeAnswerRequest = z.infer<
  typeof submitWritingPracticeAnswerRequestSchema
>
export type AbandonWritingPracticeRequest = z.infer<
  typeof abandonWritingPracticeRequestSchema
>
