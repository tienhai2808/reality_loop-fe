import { z } from "zod"
import { catalogPageSchema } from "@/features/language-foundations/api/language-foundations-schemas"

export const partOfSpeechSchema = z.enum([
  "Noun",
  "Verb",
  "Adjective",
  "Adverb",
  "Pronoun",
  "Determiner",
  "Adposition",
  "Conjunction",
  "Particle",
  "Interjection",
  "Numeral",
  "Auxiliary",
  "Other",
])

const metadata = {
  id: z.string().min(1),
  code: z.string().min(1),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
}

export const vocabularyEntrySchema = z.object({
  ...metadata,
  languageCode: z.string().min(1),
  term: z.string(),
  reading: z.string().nullable(),
  audioUrl: z.string().nullable(),
})
export const vocabularySenseSummarySchema = z.object({
  ...metadata,
  partOfSpeech: partOfSpeechSchema,
  meaning: z.string().nullable(),
  translationLocale: z.string().nullable(),
  isTranslationFallback: z.boolean(),
})
export const vocabularySenseSchema = vocabularySenseSummarySchema.extend({
  usageNote: z.string().nullable(),
})
export const vocabularyEntrySummarySchema = vocabularyEntrySchema.extend({
  primarySense: vocabularySenseSummarySchema.nullable(),
})
export const vocabularyPageSchema = catalogPageSchema(
  vocabularyEntrySummarySchema
)
export const vocabularySensePageSchema = catalogPageSchema(
  vocabularySenseSchema
)

export type PartOfSpeech = z.infer<typeof partOfSpeechSchema>
export type VocabularyEntryDto = z.infer<typeof vocabularyEntrySchema>
export type VocabularySenseSummaryDto = z.infer<
  typeof vocabularySenseSummarySchema
>
export type VocabularySenseDto = z.infer<typeof vocabularySenseSchema>
export type VocabularyEntrySummaryDto = z.infer<
  typeof vocabularyEntrySummarySchema
>
export type VocabularyPage = z.infer<typeof vocabularyPageSchema>
export type VocabularySensePage = z.infer<typeof vocabularySensePageSchema>
