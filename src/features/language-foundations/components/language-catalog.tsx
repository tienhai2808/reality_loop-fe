"use client"

import Link from "next/link"
import { useCallback } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
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
    />
  )
}

function LanguageCatalogContent({ locale }: { locale: string }) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listLanguages(locale, after, signal),
    [locale]
  )
  const catalog = useCatalogPage(`languages:${locale}`, loader)
  return (
    <div className="space-y-8">
      <section className="space-y-4" aria-labelledby="language-catalog-heading">
        <h2 id="language-catalog-heading" className="text-base font-semibold">
          Khám phá ngôn ngữ
        </h2>
        {catalog.status === "loading" ? (
          <CatalogLoading label="Đang tải ngôn ngữ…" />
        ) : null}
        <CatalogFeedback
          error={catalog.error}
          onRetry={() =>
            void (catalog.data ? catalog.loadMore() : catalog.reload())
          }
        />
        {catalog.status === "ready" && !catalog.data.items.length ? (
          <ContentUnavailable title="Chưa có ngôn ngữ">
            Hiện chưa có ngôn ngữ được xuất bản.
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
            {catalog.loadingMore ? "Đang tải ngôn ngữ…" : "Xem thêm ngôn ngữ"}
          </Button>
        ) : null}
      </section>
    </div>
  )
}
