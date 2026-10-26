"use client"

import Link from "next/link"
import { useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import { getLanguage } from "../api/language-foundations-api"
import { useCatalogResource } from "../hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "./catalog-feedback"

export function FoundationsLanguageShell({
  languageCode,
  locale,
  browsingCatalog,
  section,
  children,
}: {
  languageCode: string
  locale: string
  browsingCatalog: boolean
  section: "writing-systems" | "pronunciation"
  children: React.ReactNode
}) {
  const loader = useCallback(
    (signal: AbortSignal) => getLanguage(languageCode, locale, signal),
    [languageCode, locale]
  )
  const language = useCatalogResource(
    `language:${languageCode}:${locale}`,
    loader
  )
  const query = browsingCatalog
    ? `?${new URLSearchParams({ language: languageCode })}`
    : ""

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/learn"
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Language Foundations
      </Link>
      <header className="space-y-2">
        {language.status === "loading" ? (
          <CatalogLoading label="Loading language..." />
        ) : null}
        {language.error?.status !== 404 ? (
          <CatalogFeedback
            error={language.error}
            onRetry={() => void language.reload()}
          />
        ) : null}
        <h1
          lang={language.data?.translationLocale ?? languageCode}
          className="break-words text-2xl font-semibold"
        >
          {language.data?.name ?? languageLabel(languageCode)}
        </h1>
        {language.data ? (
          <>
            <p lang={languageCode} className="text-sm text-muted-foreground">
              {language.data.nativeName}
            </p>
            {language.data.description ? (
              <p
                lang={language.data.translationLocale ?? languageCode}
                className="max-w-2xl whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
              >
                {language.data.description}
              </p>
            ) : null}
          </>
        ) : null}
      </header>
      <nav
        aria-label="Language Foundations sections"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        <SectionLink
          href={`/learn/writing-systems${query}`}
          active={section === "writing-systems"}
        >
          Writing Systems
        </SectionLink>
        <SectionLink
          href={`/learn/pronunciation${query}`}
          active={section === "pronunciation"}
        >
          Pronunciation
        </SectionLink>
      </nav>
      {language.error?.status === 404 ? (
        <ContentUnavailable title="Foundations are coming for this language">
          Foundational content isn&apos;t published for{" "}
          {languageLabel(languageCode)} yet. You can explore other languages
          from Language Foundations.
        </ContentUnavailable>
      ) : (
        children
      )}
    </div>
  )
}

function SectionLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center rounded-sm border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-border bg-surface text-foreground"
          : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  )
}
