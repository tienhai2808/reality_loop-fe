"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useProgressOverview } from "@/features/learning-progress/hooks/use-progress-overview"
import { WritingSystemProgressSummaryView } from "@/features/learning-progress/components/writing-system-progress-summary"
import type { WritingSystemProgressSummary } from "@/features/learning-progress/api/learning-progress-schemas"
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
import { StartPracticeDialog } from "@/features/writing-system-practice/components/start-practice-dialog"
import { practiceHistoryHref } from "@/features/writing-system-practice/model/practice-handoff"
import { handwritingWorkspaceHref } from "@/features/handwriting/lib/handwriting-labels"

export function WritingSystemViewer() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  const languageCode = search.get("language") ?? profile.targetLanguage
  const systemCode = search.get("system")
  return (
    <LanguageWritingSystems
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.targetLanguage}:${languageCode}`}
      profileId={languageCode === profile.targetLanguage ? profile.id : null}
      languageCode={languageCode}
      locale={profile.explanationLanguage}
      systemCode={systemCode}
      browsingCatalog={search.has("language")}
    />
  )
}

function LanguageWritingSystems({
  profileId,
  languageCode,
  locale,
  systemCode,
  browsingCatalog,
}: {
  profileId: string | null
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
  const overview = useProgressOverview(profileId)

  return (
    <FoundationsLanguageShell
      languageCode={languageCode}
      locale={locale}
      browsingCatalog={browsingCatalog}
      section="writing-systems"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Writing systems</h2>
        <Link
          href={practiceHistoryHref()}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <History className="size-3.5" aria-hidden="true" />
          Practice history
        </Link>
      </div>
      {profileId ? (
        <>
          {overview.status === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading learning progress...
            </p>
          ) : null}
          <CatalogFeedback
            error={overview.error}
            onRetry={() => void overview.reload()}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Explore this language freely. Progress is available for the target
          language of your current learning profile.
        </p>
      )}
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
          {systems.data.items.map((system) => {
            const summary = overview.data?.writingSystems.find(
              (entry) =>
                entry.writingSystemId === system.id ||
                entry.systemCode === system.code
            )
            return (
              <Link
                key={system.id}
                href={`/learn/writing-systems?${new URLSearchParams({ ...(browsingCatalog ? { language: languageCode } : {}), system: system.code })}`}
                scroll={false}
                aria-current={selectedCode === system.code ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-sm border border-transparent px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  selectedCode === system.code
                    ? "border-border bg-surface text-foreground shadow-xs"
                    : "text-muted-foreground"
                )}
                lang={system.translationLocale ?? languageCode}
              >
                <span>{system.name}</span>
                {summary ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-normal tabular-nums",
                      selectedCode === system.code
                        ? "bg-muted text-foreground"
                        : "bg-surface-subtle text-muted-foreground"
                    )}
                  >
                    {summary.completionPercentage}%
                  </span>
                ) : null}
              </Link>
            )
          })}
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
          profileId={profileId}
          summary={overview.data?.writingSystems.find(
            (entry) => entry.systemCode === selectedCode
          )}
          onProgressChanged={overview.refresh}
        />
      ) : null}
    </FoundationsLanguageShell>
  )
}

function SelectedWritingSystem({
  profileId,
  summary,
  onProgressChanged,
  languageCode,
  systemCode,
  locale,
}: {
  profileId: string | null
  summary: WritingSystemProgressSummary | undefined
  onProgressChanged: () => void
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3
              lang={system.data.translationLocale ?? languageCode}
              className="text-lg font-semibold"
            >
              {system.data.name}
            </h3>
            {profileId ? (
              <div className="flex flex-wrap items-center gap-2">
                <StartPracticeDialog
                  key={`${profileId}:${system.data.id}`}
                  profileId={profileId}
                  systemCode={system.data.code}
                  systemName={system.data.name}
                />
                <Link
                  href={handwritingWorkspaceHref(system.data.code)}
                  className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Handwriting
                </Link>
              </div>
            ) : null}
          </div>
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
          {summary ? (
            <div className="max-w-sm pt-3">
              <WritingSystemProgressSummaryView summary={summary} />
            </div>
          ) : null}
        </header>
      ) : null}
      <WritingSystemCharacters
        languageCode={languageCode}
        systemCode={systemCode}
        systemName={system.data?.name ?? "Writing system"}
        profileId={profileId}
        onProgressChanged={onProgressChanged}
      />
    </section>
  )
}
