import { z } from "zod"
import type { CatalogPage } from "./language-foundations-schemas"

export const pronunciationRuleSummarySchema = z.object({
  id: z.string().min(1),
  languageCode: z.string(),
  code: z.string().min(1),
  nativeName: z.string(),
  name: z.string(),
  translationLocale: z.string().nullable(),
  isTranslationFallback: z.boolean(),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
})

export const pronunciationRuleSchema = pronunciationRuleSummarySchema.extend({
  explanation: z.string().nullable(),
  usageNote: z.string().nullable(),
})

export const pronunciationExampleSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  text: z.string(),
  transcription: z.string(),
  transcriptionSystem: z.string(),
  audioUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
})

export type PronunciationRuleSummaryDto = z.infer<
  typeof pronunciationRuleSummarySchema
>
export type PronunciationRuleDto = z.infer<typeof pronunciationRuleSchema>
export type PronunciationExampleDto = z.infer<typeof pronunciationExampleSchema>
export type PronunciationRulePage = CatalogPage<PronunciationRuleSummaryDto>
export type PronunciationExamplePage = CatalogPage<PronunciationExampleDto>
