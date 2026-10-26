"use client"

import Link from "next/link"
import { useCallback } from "react"
import { ArrowRight, BookOpen, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import { listLanguages } from "../api/language-foundations-api"
import { useCatalogPage } from "../hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "./catalog-feedback"

export function LanguageCatalog() {
  const { state } = useCurrentLearningProfile()
  const profile = state.current?.profile
  if (!profile) return null // The existing LearningProfileGate handles setup and restoration.
  return (
    <LanguageCatalogContent
      key={profile.id}
      locale={profile.explanationLanguage}
      targetLanguage={profile.targetLanguage}
    />
  )
}

function LanguageCatalogContent({
  locale,
  targetLanguage,
}: {
  locale: string
  targetLanguage: string
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listLanguages(locale, after, signal),
    [locale]
  )
  const catalog = useCatalogPage(`languages:${locale}`, loader)
  return (
    <div className="space-y-8">
      <div className="divide-y divide-border border-y border-border">
        <Link
          href="/learn/writing-systems"
          className="flex flex-wrap items-center justify-between gap-4 py-5 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 items-center gap-3">
            <BookOpen
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>
              <span className="block text-sm font-semibold">
                Writing systems
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {languageLabel(targetLanguage)} · Your current language
              </span>
            </span>
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/learn/pronunciation"
          className="flex flex-wrap items-center justify-between gap-4 py-5 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Volume2
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>
              <span className="block text-sm font-semibold">Pronunciation</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {languageLabel(targetLanguage)} · Reading rules and examples
              </span>
            </span>
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <section className="space-y-4" aria-labelledby="language-catalog-heading">
        <h2 id="language-catalog-heading" className="text-base font-semibold">
          Explore languages
        </h2>
        {catalog.status === "loading" ? (
          <CatalogLoading label="Loading languages..." />
        ) : null}
        <CatalogFeedback
          error={catalog.error}
          onRetry={() =>
            void (catalog.data ? catalog.loadMore() : catalog.reload())
          }
        />
        {catalog.status === "ready" && !catalog.data.items.length ? (
          <ContentUnavailable title="Languages are on their way">
            No languages are currently available in Language Foundations. Please
            check back later.
          </ContentUnavailable>
        ) : null}
        {catalog.data?.items.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {catalog.data.items.map((language) => (
              <li key={language.id}>
                <Link
                  href={`/learn/writing-systems?${new URLSearchParams({ language: language.code })}`}
                  className="flex items-center justify-between gap-4 py-5 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 space-y-1">
                    <h3
                      className="break-words text-base font-medium"
                      lang={language.translationLocale ?? language.code}
                    >
                      {language.name}
                    </h3>
                    <p
                      className="text-sm text-muted-foreground"
                      lang={language.code}
                    >
                      {language.nativeName}
                    </p>
                    {language.description ? (
                      <p
                        lang={language.translationLocale ?? language.code}
                        className="max-w-xl whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
                      >
                        {language.description}
                      </p>
                    ) : null}
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {catalog.data?.nextCursor && !catalog.error ? (
          <Button
            variant="outline"
            disabled={catalog.loadingMore}
            aria-busy={catalog.loadingMore}
            onClick={() => void catalog.loadMore()}
          >
            {catalog.loadingMore
              ? "Loading languages..."
              : "Load more languages"}
          </Button>
        ) : null}
      </section>
    </div>
  )
}
