import {
  catalogPageQuery,
  getFoundationContent,
} from "@/features/language-foundations/api/language-foundations-api"
import { grammarPageSchema, grammarPointDetailSchema } from "./grammar-schemas"

const grammarPath = (languageCode: string) =>
  `/${encodeURIComponent(languageCode)}/grammar-points`

export function listGrammarPoints(
  languageCode: string,
  locale: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    grammarPath(languageCode),
    catalogPageQuery(20, after, locale),
    grammarPageSchema,
    signal
  )
}

export function getGrammarPoint(
  languageCode: string,
  pointCode: string,
  locale: string,
  signal: AbortSignal
) {
  return getFoundationContent(
    `${grammarPath(languageCode)}/${encodeURIComponent(pointCode)}`,
    new URLSearchParams({ locale }),
    grammarPointDetailSchema,
    signal
  )
}
