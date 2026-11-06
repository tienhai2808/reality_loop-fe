"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { StartPracticePopover } from "@/features/writing-system-practice/components/start-practice-popover"
import { WritingHistoryPanel } from "@/features/learn/components/writing-history-panel"
import { HandwritingWorkspace } from "@/features/handwriting/components/handwriting-workspace"
import { handwritingWorkspaceHref } from "@/features/handwriting/lib/handwriting-labels"

export function WritingSystemViewer() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  const languageCode = search.get("language") ?? profile.targetLanguage
  const systemCode = search.get("system")
  const writing = search.get("mode") === "write"
  return (
    <LanguageWritingSystems
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.targetLanguage}:${languageCode}`}
      profileId={languageCode === profile.targetLanguage ? profile.id : null}
      languageCode={languageCode}
      locale={profile.explanationLanguage}
      systemCode={systemCode}
      browsingCatalog={search.has("language")}
      writing={writing}
    />
  )
}

function LanguageWritingSystems({
  profileId,
  languageCode,
  locale,
  systemCode,
  browsingCatalog,
  writing,
}: {
  profileId: string | null
  languageCode: string
  locale: string
  systemCode: string | null
  browsingCatalog: boolean
  writing: boolean
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
    >
      {profileId ? (
        <>
          {overview.status === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Đang tải tiến độ học…
            </p>
          ) : null}
          <CatalogFeedback
            error={overview.error}
            onRetry={() => void overview.reload()}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Đang xem thử. Tiến độ chỉ được ghi trong hồ sơ học tương ứng.
        </p>
      )}
      {systems.status === "loading" ? (
        <CatalogLoading label="Đang tải bảng chữ…" />
      ) : null}
      {systems.error?.status === 404 ? (
        <ContentUnavailable title="Chưa có bảng chữ">
          Ngôn ngữ này chưa có bảng chữ được xuất bản.
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
        <ContentUnavailable title="Chưa có bảng chữ">
          Ngôn ngữ này chưa có bảng chữ được xuất bản.
        </ContentUnavailable>
      ) : null}
      {systems.data?.items.length && !(writing && profileId) ? (
        <nav
          aria-label="Bảng chữ"
          className="flex flex-wrap items-center gap-2 border-b border-border pb-2"
        >
          {systems.data.items.map((system) => {
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
              {systems.loadingMore ? "Đang tải…" : "Xem thêm bảng chữ"}
            </Button>
          ) : null}
        </nav>
      ) : null}
      {selectedCode && writing && profileId ? (
        <HandwritingWorkspace systemCode={selectedCode} />
      ) : selectedCode ? (
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
  const search = useSearchParams()
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
      <ContentUnavailable title="Không tìm thấy bảng chữ">
        Bảng chữ này hiện không có. Hãy chọn bảng khác.
      </ContentUnavailable>
    )
  return (
    <section
      className="min-w-0 space-y-3"
      aria-label={system.data?.name ?? "Lưới chữ"}
    >
      {system.status === "loading" ? (
        <CatalogLoading label="Đang tải bảng chữ…" />
      ) : null}
      <CatalogFeedback
        error={system.error}
        onRetry={() => void system.reload()}
      />
      {system.data ? (
        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              lang={system.data.translationLocale ?? languageCode}
              className="text-lg font-semibold"
            >
              {system.data.name}
            </h3>
            {profileId ? (
              <div className="flex flex-wrap items-center gap-2">
                <StartPracticePopover
                  key={`${profileId}:${system.data.id}`}
                  profileId={profileId}
                  systemCode={system.data.code}
                  systemName={system.data.name}
                />
                <Link
                  href={handwritingWorkspaceHref(
                    system.data.code,
                    search.get("character")
                  )}
                  className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 sm:min-h-9 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Luyện viết
                </Link>
                <WritingHistoryPanel profileId={profileId} />
              </div>
            ) : null}
          </div>
          {summary ? (
            <WritingSystemProgressSummaryView summary={summary} />
          ) : null}
          {system.data.description ? (
            <details className="max-w-2xl text-sm text-muted-foreground">
              <summary className="w-fit cursor-pointer rounded-sm py-1">
                Về bảng chữ này
              </summary>
              <p
                lang={system.data.translationLocale ?? languageCode}
                className="py-1"
              >
                {system.data.description}
              </p>
            </details>
          ) : null}
        </header>
      ) : null}
      <WritingSystemCharacters
        languageCode={languageCode}
        systemCode={systemCode}
        systemName={system.data?.name ?? "Bảng chữ"}
        profileId={profileId}
        onProgressChanged={onProgressChanged}
      />
    </section>
  )
}
