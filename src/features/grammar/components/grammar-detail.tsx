"use client"

import { useCallback, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { getGrammarPoint } from "../api/grammar-api"
import { GrammarHeading } from "./grammar-content"

export function GrammarDetailContent({
  languageCode,
  locale,
  pointCode,
}: {
  languageCode: string
  locale: string
  pointCode: string
}) {
  const loader = useCallback(
    (signal: AbortSignal) =>
      getGrammarPoint(languageCode, pointCode, locale, signal),
    [languageCode, pointCode, locale]
  )
  const resource = useCatalogResource(
    `grammar-point:${languageCode}:${locale}:${pointCode}`,
    loader
  )
  if (resource.status === "loading")
    return <CatalogLoading label="Đang tải mẫu câu…" />
  if (resource.error?.status === 404)
    return (
      <ContentUnavailable title="Không tìm thấy mẫu câu">
        Mẫu câu này hiện không có. Hãy chọn một mẫu khác.
      </ContentUnavailable>
    )
  if (resource.error)
    return (
      <CatalogFeedback
        error={resource.error}
        onRetry={() => void resource.reload()}
      />
    )
  const point = resource.data
  if (!point) return null
  return (
    <article className="space-y-6">
      <GrammarHeading point={point} />
      <section aria-labelledby="grammar-pattern" className="space-y-2.5">
        <h2
          id="grammar-pattern"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Mẫu câu
        </h2>
        <div className="rounded-lg border border-border bg-surface-subtle p-5 sm:p-6">
          <p
            lang={point.languageCode}
            className={cn(
              "whitespace-pre-line break-words text-2xl font-medium leading-relaxed text-foreground sm:text-3xl",
              point.languageCode === "ja" && "font-ja"
            )}
          >
            {point.pattern}
          </p>
        </div>
      </section>
      <section aria-labelledby="grammar-explanation" className="space-y-3">
        <h2
          id="grammar-explanation"
          className="text-lg font-semibold tracking-tight"
        >
          Khi nào dùng
        </h2>
        {point.explanation === null ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Chưa có bản giải thích cho mẫu câu này.
          </p>
        ) : (
          <p
            lang={point.translationLocale ?? point.languageCode}
            className={cn(
              "whitespace-pre-line break-words text-base leading-8 text-foreground",
              (point.translationLocale ?? point.languageCode) === "ja" &&
                "font-ja"
            )}
          >
            {point.explanation}
          </p>
        )}
      </section>
      {point.usageNote !== null ? (
        <GrammarUsageNote
          note={point.usageNote}
          locale={point.translationLocale}
          languageCode={point.languageCode}
        />
      ) : null}
    </article>
  )
}

function GrammarUsageNote({
  note,
  locale,
  languageCode,
}: {
  note: string
  locale: string | null
  languageCode: string
}) {
  const [open, setOpen] = useState(false)
  const contentLang = locale ?? languageCode

  return (
    <section
      aria-labelledby="grammar-usage-heading"
      className="rounded-lg border border-border/60 bg-surface-subtle transition-colors"
    >
      <button
        type="button"
        id="grammar-usage-heading"
        aria-expanded={open}
        aria-controls="grammar-usage-content"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold tracking-tight text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring sm:px-5 sm:py-4"
      >
        <span>Lưu ý khi dùng</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-foreground"
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          id="grammar-usage-content"
          role="region"
          aria-labelledby="grammar-usage-heading"
          className="border-t border-border/40 px-4 pb-4 pt-3 sm:px-5 sm:pb-5"
        >
          <p
            lang={contentLang}
            className={cn(
              "whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground",
              contentLang === "ja" && "font-ja"
            )}
          >
            {note}
          </p>
        </div>
      ) : null}
    </section>
  )
}
