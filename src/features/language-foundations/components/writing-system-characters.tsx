"use client"

import { useCallback, useState } from "react"
import { Circle, CircleDot, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLearnWideLayout } from "@/features/learn/hooks/use-learn-wide-layout"
import { LearnDetailPane } from "@/features/learn/components/learn-detail-pane"
import { listWritingSystemItems } from "../api/language-foundations-api"
import type {
  WritingSystemItemDto,
  WritingSystemItemReadingDto,
} from "../api/language-foundations-schemas"
import { useCatalogPage, type CatalogCache } from "../hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "./catalog-feedback"
import { CharacterChart } from "./character-chart"
import { CharacterDetailPanel } from "./character-detail-panel"
import { useWritingProgress } from "@/features/learning-progress/hooks/use-writing-progress"
import { CharacterProgressActions } from "@/features/learning-progress/components/character-progress-actions"

export function WritingSystemCharacters({
  languageCode,
  systemCode,
  systemName,
  profileId,
  onProgressChanged,
}: {
  languageCode: string
  systemCode: string
  systemName: string
  profileId: string | null
  onProgressChanged: () => void
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listWritingSystemItems(languageCode, systemCode, after, signal),
    [languageCode, systemCode]
  )
  const page = useCatalogPage(`items:${languageCode}:${systemCode}`, loader)
  // Catalog and progress requests start independently in the same mount.
  const progress = useWritingProgress(profileId, systemCode, onProgressChanged)
  const pathname = usePathname()
  const router = useRouter()
  const search = useSearchParams()
  const selectedCode = search.get("character")
  function selectionHref(code?: string) {
    const query = new URLSearchParams(search)
    if (code) query.set("character", code)
    else query.delete("character")
    return `${pathname}${query.size ? `?${query}` : ""}`
  }
  function setSelected(item: WritingSystemItemDto) {
    router.push(selectionHref(item.code), { scroll: false })
  }
  const [readingsCache] = useState<CatalogCache<WritingSystemItemReadingDto>>(
    () => new Map()
  )
  const items = page.data?.items ?? []
  const selectedIndex = items.findIndex((item) => item.code === selectedCode)
  const selected = items[selectedIndex]
  const wide = useLearnWideLayout()
  const detail = selected ? (
    <LearnDetailPane
      label="Chi tiết chữ"
      selection={selected.code}
      closeHref={selectionHref()}
      triggerId={`character-${selected.id}`}
    >
      <CharacterDetailPanel
        item={selected}
        languageCode={languageCode}
        systemCode={systemCode}
        systemName={systemName}
        cache={readingsCache}
        previous={items[selectedIndex - 1] ?? null}
        next={items[selectedIndex + 1] ?? null}
        onNavigate={setSelected}
        progressControls={
          profileId ? (
            <CharacterProgressActions
              key={selected.id}
              itemId={selected.id}
              progress={progress.entries.get(selected.id)}
              operation={progress.operations.get(selected.id)}
              loadItem={progress.loadItem}
              onAction={progress.record}
            />
          ) : undefined
        }
      />
    </LearnDetailPane>
  ) : null

  return (
    <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
      <div className="min-w-0 space-y-3">
        {page.status === "loading" ? (
          <CatalogLoading label="Đang tải chữ…" />
        ) : null}
        {page.error?.status === 404 ? (
          <ContentUnavailable title="Chưa có chữ">
            Bảng chữ này chưa có chữ được xuất bản.
          </ContentUnavailable>
        ) : (
          <CatalogFeedback
            error={page.error}
            onRetry={() => void (page.data ? page.loadMore() : page.reload())}
          />
        )}
        {page.status === "ready" && !items.length ? (
          <ContentUnavailable title="Chưa có chữ">
            Bảng chữ này chưa có chữ được xuất bản.
          </ContentUnavailable>
        ) : null}
        {items.length ? (
          <>
            {profileId ? (
              <>
                {progress.page.status === "loading" ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    Đang tải tiến độ…
                  </p>
                ) : null}
                <CatalogFeedback
                  error={progress.page.error}
                  onRetry={() =>
                    void (progress.page.nextCursor
                      ? progress.loadMore()
                      : progress.reload())
                  }
                />
                <div
                  className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
                  aria-label="Chú giải tiến độ"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Circle
                      className="size-3.5 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                    Chưa học
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CircleDot
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                    Đang học
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CircleCheck
                      className="size-3.5 text-success"
                      aria-hidden="true"
                    />
                    Đã học
                  </span>
                </div>
              </>
            ) : null}
            <CharacterChart
              items={items}
              languageCode={languageCode}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              progress={profileId ? progress.entries : undefined}
              operations={profileId ? progress.operations : undefined}
              inlineDetail={wide ? undefined : detail}
            />
          </>
        ) : null}
        {page.data?.nextCursor && !page.error ? (
          <Button
            variant="outline"
            disabled={page.loadingMore}
            aria-busy={page.loadingMore}
            onClick={() => void page.loadMore()}
          >
            {page.loadingMore ? "Đang tải chữ…" : "Xem thêm chữ"}
          </Button>
        ) : null}
        {profileId && progress.page.nextCursor && !progress.page.error ? (
          <Button
            variant="outline"
            disabled={progress.page.loadingMore}
            aria-busy={progress.page.loadingMore}
            onClick={() => void progress.loadMore()}
          >
            {progress.page.loadingMore
              ? "Đang tải tiến độ…"
              : "Xem thêm tiến độ"}
          </Button>
        ) : null}
      </div>
      {wide
        ? (detail ?? (
            <p className="border-l border-border pl-5 text-sm text-muted-foreground">
              Chọn một chữ để xem cách đọc và nghe phát âm.
            </p>
          ))
        : null}
    </div>
  )
}
