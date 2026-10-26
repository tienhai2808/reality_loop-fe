"use client"

import { useCallback } from "react"
import { getPronunciationRule } from "../../api/pronunciation-api"
import { useCatalogResource } from "../../hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "../catalog-feedback"
import { PronunciationExamples } from "./pronunciation-examples"

export function PronunciationRuleDetail({
  languageCode,
  ruleCode,
  locale,
}: {
  languageCode: string
  ruleCode: string
  locale: string
}) {
  const loader = useCallback(
    (signal: AbortSignal) =>
      getPronunciationRule(languageCode, ruleCode, locale, signal),
    [languageCode, ruleCode, locale]
  )
  const rule = useCatalogResource(
    `pronunciation-rule:${languageCode}:${ruleCode}:${locale}`,
    loader
  )

  if (rule.error?.status === 404)
    return (
      <ContentUnavailable title="Rule unavailable">
        This pronunciation rule hasn&apos;t been published or is no longer
        available. Choose another rule to continue.
      </ContentUnavailable>
    )
  return (
    <article
      className="min-w-0 max-w-2xl space-y-6 border-t border-border pt-6 lg:border-t-0 lg:pt-0"
      aria-label={rule.data?.name ?? "Pronunciation rule"}
    >
      {rule.status === "loading" ? (
        <CatalogLoading label="Loading rule explanation..." />
      ) : null}
      <CatalogFeedback error={rule.error} onRetry={() => void rule.reload()} />
      {rule.data ? (
        <>
          <header className="space-y-2">
            <h3
              lang={rule.data.translationLocale ?? languageCode}
              className="break-words text-xl font-semibold"
            >
              {rule.data.name}
            </h3>
            {rule.data.name !== rule.data.nativeName ? (
              <p
                lang={languageCode}
                className="break-words text-base text-muted-foreground"
              >
                {rule.data.nativeName}
              </p>
            ) : null}
          </header>
          <section className="space-y-2" aria-label="Explanation">
            <h4 className="text-sm font-medium">Explanation</h4>
            {rule.data.explanation === null ? (
              <p className="text-sm leading-6 text-muted-foreground">
                An explanation is not available for this rule yet.
              </p>
            ) : (
              <p
                lang={rule.data.translationLocale ?? languageCode}
                className="whitespace-pre-line break-words text-[0.9375rem] leading-7"
              >
                {rule.data.explanation}
              </p>
            )}
          </section>
          {rule.data.usageNote !== null ? (
            <section
              className="space-y-1.5 rounded-r-md border-l-2 border-primary/60 bg-surface-subtle p-3.5"
              aria-label="Important to remember"
            >
              <h4 className="text-xs font-semibold text-foreground">
                Important to remember
              </h4>
              <p
                lang={rule.data.translationLocale ?? languageCode}
                className="whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
              >
                {rule.data.usageNote}
              </p>
            </section>
          ) : null}
        </>
      ) : null}
      {/* Examples start alongside detail; locale changes refresh only the explanation. */}
      <PronunciationExamples languageCode={languageCode} ruleCode={ruleCode} />
    </article>
  )
}
