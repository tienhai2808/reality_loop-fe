import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"

export const grammarPointSummarySchema = z.object({
  id: z.string().min(1),
  languageCode: z.string().min(1),
  code: z.string().min(1),
  nativeName: z.string(),
  pattern: z.string(),
  name: z.string(),
  translationLocale: z.string().nullable(),
  isTranslationFallback: z.boolean(),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
})

export const grammarPointDetailSchema = grammarPointSummarySchema.extend({
  explanation: z.string().nullable(),
  usageNote: z.string().nullable(),
})
export const grammarPageSchema = catalogPageSchema(grammarPointSummarySchema)

export type GrammarPointSummary = z.infer<typeof grammarPointSummarySchema>
export type GrammarPointDetail = z.infer<typeof grammarPointDetailSchema>
