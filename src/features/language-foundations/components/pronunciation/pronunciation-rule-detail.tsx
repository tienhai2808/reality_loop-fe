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
      <ContentUnavailable title="Không tìm thấy quy tắc">
        Quy tắc này hiện không có. Hãy chọn mục khác.
      </ContentUnavailable>
    )
  return (
    <article
      className="min-w-0 max-w-2xl space-y-3"
      aria-label={rule.data?.name ?? "Quy tắc phát âm"}
    >
      {rule.status === "loading" ? (
        <CatalogLoading label="Đang tải giải thích…" />
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
          <PronunciationExamples
            languageCode={languageCode}
            ruleCode={ruleCode}
          />
          <section className="space-y-2" aria-label="Giải thích">
            <h4 className="text-sm font-medium">Giải thích</h4>
            {rule.data.explanation === null ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Quy tắc này chưa có giải thích.
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
              aria-label="Lưu ý"
            >
              <h4 className="text-xs font-semibold text-foreground">Lưu ý</h4>
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
    </article>
  )
}
