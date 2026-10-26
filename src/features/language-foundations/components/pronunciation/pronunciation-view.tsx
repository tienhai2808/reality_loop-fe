"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
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

  return (
    <FoundationsLanguageShell
      languageCode={languageCode}
      locale={locale}
      browsingCatalog={browsingCatalog}
      section="pronunciation"
    >
      <h2 className="text-lg font-semibold">Pronunciation</h2>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <section
          className="min-w-0 space-y-3"
          aria-labelledby="pronunciation-rules-heading"
        >
          <h3
            id="pronunciation-rules-heading"
            className="text-sm font-medium text-muted-foreground"
          >
            Reading rules
          </h3>
          {rules.status === "loading" ? (
            <CatalogLoading label="Loading pronunciation rules..." />
          ) : null}
          {rules.error?.status === 404 ||
          (rules.status === "ready" && !rules.data.items.length) ? (
            <ContentUnavailable title="Pronunciation is on its way">
              Pronunciation lessons aren&apos;t available for this language yet.
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
            <nav aria-label="Pronunciation rules">
              <ul className="space-y-1">
                {rules.data.items.map((rule) => (
                  <li key={rule.id}>
                    <Link
                      href={`/learn/pronunciation?${new URLSearchParams({ ...(browsingCatalog ? { language: languageCode } : {}), rule: rule.code })}`}
                      scroll={false}
                      aria-current={ruleCode === rule.code ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center justify-between gap-2 rounded-sm border border-transparent px-3 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                        ruleCode === rule.code && "border-border bg-surface"
                      )}
                    >
                      <span className="min-w-0 space-y-1">
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
                      {ruleCode === rule.code ? (
                        <Check
                          className="size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                    </Link>
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
              {rules.loadingMore ? "Loading rules..." : "Load more rules"}
            </Button>
          ) : null}
        </section>
        {ruleCode ? (
          <PronunciationRuleDetail
            key={ruleCode}
            languageCode={languageCode}
            ruleCode={ruleCode}
            locale={locale}
          />
        ) : (
          <div className="border-t border-border py-6 text-sm leading-6 text-muted-foreground lg:border-t-0 lg:border-l lg:px-6">
            {rules.data?.items.length
              ? "Choose a reading rule to explore its explanation and examples."
              : "Published reading rules and examples will appear here."}
          </div>
        )}
      </div>
    </FoundationsLanguageShell>
  )
}
