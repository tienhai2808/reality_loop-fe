"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { useLearnWideLayout } from "@/features/learn/hooks/use-learn-wide-layout"
import { LearnDetailPane } from "@/features/learn/components/learn-detail-pane"
import { cn } from "@/lib/utils"
import { listPronunciationRules } from "../../api/pronunciation-api"
import { useCatalogPage } from "../../hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "../catalog-feedback"
import { FoundationsLanguageShell } from "../foundations-language-shell"
import { PronunciationRuleDetail } from "./pronunciation-rule-detail"

export function PronunciationView() {
  const { state } = useCurrentLearningProfile()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile) return null // The existing profile gate handles setup and restoration.
  const languageCode = search.get("language") ?? profile.targetLanguage
  return (
    <LanguagePronunciation
      key={`${profile.id}:${profile.targetLanguage}:${languageCode}`}
      languageCode={languageCode}
      locale={profile.explanationLanguage}
      ruleCode={search.get("rule")}
      browsingCatalog={search.has("language")}
    />
  )
}

function LanguagePronunciation({
  languageCode,
  locale,
  ruleCode,
  browsingCatalog,
}: {
  languageCode: string
  locale: string
  ruleCode: string | null
  browsingCatalog: boolean
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listPronunciationRules(languageCode, locale, after, signal),
    [languageCode, locale]
  )
  const rules = useCatalogPage(
    `pronunciation-rules:${languageCode}:${locale}`,
    loader
  )

  const wide = useLearnWideLayout()
  const selectedCode =
    ruleCode ?? (wide ? rules.data?.items[0]?.code : undefined)
  const selectedInList = rules.data?.items.some(
    (rule) => rule.code === selectedCode
  )
  const listHref = `/learn/pronunciation${browsingCatalog ? `?${new URLSearchParams({ language: languageCode })}` : ""}`

  const detail = selectedCode ? (
    <LearnDetailPane
      label="Cách phát âm"
      selection={ruleCode ?? ""}
      closeHref={ruleCode ? listHref : undefined}
      triggerId={`pronunciation-${selectedCode}`}
    >
      <PronunciationRuleDetail
        key={selectedCode}
        languageCode={languageCode}
        ruleCode={selectedCode}
        locale={locale}
      />
    </LearnDetailPane>
  ) : null

  return (
    <FoundationsLanguageShell
      languageCode={languageCode}
      locale={locale}
      browsingCatalog={browsingCatalog}
    >
      <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(14rem,0.55fr)_minmax(0,1fr)]">
        <section
          className="min-w-0 space-y-2"
          aria-labelledby="pronunciation-rules-heading"
        >
          <h3
            id="pronunciation-rules-heading"
            className="text-sm font-medium text-muted-foreground"
          >
            Quy tắc phát âm
          </h3>
          {rules.status === "loading" ? (
            <CatalogLoading label="Đang tải quy tắc phát âm…" />
          ) : null}
          {rules.error?.status === 404 ||
          (rules.status === "ready" && !rules.data.items.length) ? (
            <ContentUnavailable title="Chưa có nội dung phát âm">
              Ngôn ngữ này chưa có quy tắc phát âm được xuất bản.
            </ContentUnavailable>
          ) : (
            <CatalogFeedback
              error={rules.error}
              onRetry={() =>
                void (rules.data ? rules.loadMore() : rules.reload())
              }
            />
          )}
          {rules.data?.items.length ? (
            <nav aria-label="Quy tắc phát âm">
              <ul className="space-y-1">
                {rules.data.items.map((rule) => (
                  <li key={rule.id}>
                    <Link
                      id={`pronunciation-${rule.code}`}
                      href={`/learn/pronunciation?${new URLSearchParams({ ...(browsingCatalog ? { language: languageCode } : {}), rule: rule.code })}`}
                      scroll={false}
                      aria-current={
                        selectedCode === rule.code ? "page" : undefined
                      }
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-2 rounded-sm border px-2 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        selectedCode === rule.code
                          ? "border-border bg-surface font-medium text-foreground shadow-xs"
                          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className="min-w-0 space-y-0.5">
                        <span
                          lang={rule.translationLocale ?? languageCode}
                          className="block break-words text-sm font-medium"
                        >
                          {rule.name}
                        </span>
                        {rule.name !== rule.nativeName ? (
                          <span
                            lang={languageCode}
                            className="block break-words text-xs text-muted-foreground"
                          >
                            {rule.nativeName}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                    {!wide && selectedCode === rule.code ? detail : null}
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          {rules.data?.nextCursor && !rules.error ? (
            <Button
              variant="outline"
              disabled={rules.loadingMore}
              aria-busy={rules.loadingMore}
              onClick={() => void rules.loadMore()}
            >
              {rules.loadingMore ? "Đang tải quy tắc…" : "Xem thêm quy tắc"}
            </Button>
          ) : null}
        </section>
        {wide || (!selectedInList && rules.status !== "loading")
          ? detail
          : null}
      </div>
    </FoundationsLanguageShell>
  )
}
