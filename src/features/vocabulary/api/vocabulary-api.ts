import {
  catalogPageQuery,
  getFoundationContent,
} from "@/features/language-foundations/api/language-foundations-api"
import {
  vocabularyEntrySchema,
  vocabularyPageSchema,
  vocabularySensePageSchema,
  type PartOfSpeech,
} from "./vocabulary-schemas"

const vocabularyPath = (languageCode: string) =>
  `/${encodeURIComponent(languageCode)}/vocabulary`
const entryPath = (languageCode: string, entryCode: string) =>
  `${vocabularyPath(languageCode)}/${encodeURIComponent(entryCode)}`

export function listVocabulary(
  languageCode: string,
  locale: string,
  partOfSpeech: PartOfSpeech | undefined,
  after: string | null,
  signal: AbortSignal
) {
  const query = catalogPageQuery(20, after, locale)
  if (partOfSpeech) query.set("partOfSpeech", partOfSpeech)
  return getFoundationContent(
    vocabularyPath(languageCode),
    query,
    vocabularyPageSchema,
    signal
  )
}

export function getVocabularyEntry(
  languageCode: string,
  entryCode: string,
  signal: AbortSignal
) {
  return getFoundationContent(
    entryPath(languageCode, entryCode),
    new URLSearchParams(),
    vocabularyEntrySchema,
    signal
  )
}

export function listVocabularySenses(
  languageCode: string,
  entryCode: string,
  locale: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    `${entryPath(languageCode, entryCode)}/senses`,
    catalogPageQuery(20, after, locale),
    vocabularySensePageSchema,
    signal
  )
}
