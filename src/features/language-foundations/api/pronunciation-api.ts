import {
  catalogPageQuery,
  getFoundationContent,
} from "./language-foundations-api"
import { catalogPageSchema } from "./language-foundations-schemas"
import {
  pronunciationExampleSchema,
  pronunciationRuleSchema,
  pronunciationRuleSummarySchema,
} from "./pronunciation-schemas"

const rulesPath = (languageCode: string) =>
  `/${encodeURIComponent(languageCode)}/pronunciation-rules`
const rulePath = (languageCode: string, ruleCode: string) =>
  `${rulesPath(languageCode)}/${encodeURIComponent(ruleCode)}`

export function listPronunciationRules(
  languageCode: string,
  locale: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    rulesPath(languageCode),
    catalogPageQuery(20, after, locale),
    catalogPageSchema(pronunciationRuleSummarySchema),
    signal
  )
}

export function getPronunciationRule(
  languageCode: string,
  ruleCode: string,
  locale: string,
  signal: AbortSignal
) {
  return getFoundationContent(
    rulePath(languageCode, ruleCode),
    new URLSearchParams({ locale }),
    pronunciationRuleSchema,
    signal
  )
}

export function listPronunciationExamples(
  languageCode: string,
  ruleCode: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    `${rulePath(languageCode, ruleCode)}/examples`,
    catalogPageQuery(20, after),
    catalogPageSchema(pronunciationExampleSchema),
    signal
  )
}
