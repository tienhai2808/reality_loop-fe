"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import {
  getWritingSystem,
  listWritingSystems,
} from "../api/language-foundations-api"
import { useCatalogPage, useCatalogResource } from "../hooks/use-catalog"
import { cn } from "@/lib/utils"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "./catalog-feedback"
import { WritingSystemCharacters } from "./writing-system-characters"
import { FoundationsLanguageShell } from "./foundations-language-shell"

export function WritingSystemViewer() {
  const { state } = useCurrentLearningProfile()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile) return null
  const languageCode = search.get("language") ?? profile.targetLanguage
  const systemCode = search.get("system")
  return (
    <LanguageWritingSystems
      key={`${profile.id}:${profile.targetLanguage}:${languageCode}`}
      languageCode={languageCode}
      locale={profile.explanationLanguage}
      systemCode={systemCode}
      browsingCatalog={search.has("language")}
    />
  )
}

function LanguageWritingSystems({
  languageCode,
  locale,
  systemCode,
  browsingCatalog,
}: {
  languageCode: string
  locale: string
  systemCode: string | null
  browsingCatalog: boolean
}) {
  const [defaultSystem, setDefaultSystem] = useState<string | null>(null)
  const systemLoader = useCallback(
    async (after: string | null, signal: AbortSignal) => {
      const page = await listWritingSystems(languageCode, locale, after, signal)
      if (!signal.aborted)
        setDefaultSystem((current) => current ?? page.items[0]?.code ?? null)
      return page
    },
    [languageCode, locale]
  )
  const systems = useCatalogPage(
    `systems:${languageCode}:${locale}`,
    systemLoader
  )
  const selectedCode = systemCode ?? defaultSystem

  return (
    <FoundationsLanguageShell
      languageCode={languageCode}
      locale={locale}
      browsingCatalog={browsingCatalog}
      section="writing-systems"
    >
      <h2 className="text-lg font-semibold">Writing systems</h2>
      {systems.status === "loading" ? (
        <CatalogLoading label="Loading writing systems..." />
      ) : null}
      {systems.error?.status === 404 ? (
        <ContentUnavailable title="No writing systems available">
          This language currently has no published writing systems.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={systems.error}
          onRetry={() =>
            void (systems.data ? systems.loadMore() : systems.reload())
          }
        />
      )}
      {systems.status === "ready" &&
      !systems.data.items.length &&
      !systemCode ? (
        <ContentUnavailable title="No writing systems yet">
          This language currently has no published writing systems. Check back
          later.
        </ContentUnavailable>
      ) : null}
      {systems.data?.items.length ? (
        <nav
          aria-label="Writing systems"
          className="flex flex-wrap gap-2 border-b border-border pb-4"
        >
          {systems.data.items.map((system) => (
            <Link
              key={system.id}
              href={`/learn/writing-systems?${new URLSearchParams({ ...(browsingCatalog ? { language: languageCode } : {}), system: system.code })}`}
              scroll={false}
              aria-current={selectedCode === system.code ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center rounded-sm border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                selectedCode === system.code
                  ? "border-border bg-surface text-foreground"
                  : "text-muted-foreground"
              )}
              lang={system.translationLocale ?? languageCode}
            >
              {system.name}
            </Link>
          ))}
          {systems.data.nextCursor && !systems.error ? (
            <Button
              variant="ghost"
              disabled={systems.loadingMore}
              aria-busy={systems.loadingMore}
              onClick={() => void systems.loadMore()}
            >
              {systems.loadingMore ? "Loading..." : "More writing systems"}
            </Button>
          ) : null}
        </nav>
      ) : null}
      {selectedCode ? (
        <SelectedWritingSystem
          key={selectedCode}
          languageCode={languageCode}
          systemCode={selectedCode}
          locale={locale}
        />
      ) : null}
    </FoundationsLanguageShell>
  )
}

function SelectedWritingSystem({
  languageCode,
  systemCode,
  locale,
}: {
  languageCode: string
  systemCode: string
  locale: string
}) {
  const loader = useCallback(
    (signal: AbortSignal) =>
      getWritingSystem(languageCode, systemCode, locale, signal),
    [languageCode, systemCode, locale]
  )
  const system = useCatalogResource(
    `system:${languageCode}:${systemCode}:${locale}`,
    loader
  )
  if (system.error?.status === 404)
    return (
      <ContentUnavailable title="Writing system unavailable">
        This writing system hasn&apos;t been published or is no longer
        available. Choose another writing system or return to Language
        Foundations.
      </ContentUnavailable>
    )
  return (
    <section
      className="min-w-0 space-y-5"
      aria-label={system.data?.name ?? "Character chart"}
    >
      {system.status === "loading" ? (
        <CatalogLoading label="Loading writing system..." />
      ) : null}
      <CatalogFeedback
        error={system.error}
        onRetry={() => void system.reload()}
      />
      {system.data ? (
        <header className="space-y-1">
          <h3
            lang={system.data.translationLocale ?? languageCode}
            className="text-lg font-semibold"
          >
            {system.data.name}
          </h3>
          <p lang={languageCode} className="text-sm text-muted-foreground">
            {system.data.nativeName}
          </p>
          {system.data.description ? (
            <p
              lang={system.data.translationLocale ?? languageCode}
              className="max-w-2xl whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
            >
              {system.data.description}
            </p>
          ) : null}
        </header>
      ) : null}
      <WritingSystemCharacters
        languageCode={languageCode}
        systemCode={systemCode}
        systemName={system.data?.name ?? "Writing system"}
      />
    </section>
  )
}
