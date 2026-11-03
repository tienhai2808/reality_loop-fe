"use client"

import { useCallback, useState } from "react"
import { Circle, CircleDot, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  const [selected, setSelected] = useState<WritingSystemItemDto | null>(null)
  const [readingsCache] = useState<CatalogCache<WritingSystemItemReadingDto>>(
    () => new Map()
  )
  const items = page.data?.items ?? []
  const selectedIndex = items.findIndex((item) => item.id === selected?.id)

  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => {
        if (!open) setSelected(null)
      }}
    >
      <div className="min-w-0 space-y-4">
        {page.status === "loading" ? (
          <CatalogLoading label="Loading characters..." />
        ) : null}
        {page.error?.status === 404 ? (
          <ContentUnavailable title="Characters aren't available yet">
            This writing system has no published characters to explore right
            now.
          </ContentUnavailable>
        ) : (
          <CatalogFeedback
            error={page.error}
            onRetry={() => void (page.data ? page.loadMore() : page.reload())}
          />
        )}
        {page.status === "ready" && !items.length ? (
          <ContentUnavailable title="Characters are on their way">
            No characters have been published for this writing system yet.
          </ContentUnavailable>
        ) : null}
        {items.length ? (
          <>
            {profileId ? (
              <>
                {progress.page.status === "loading" ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    Loading character progress...
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
                  aria-label="Character progress key"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
                    Not started
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CircleDot className="size-3.5 text-primary" aria-hidden="true" />
                    Learning
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CircleCheck className="size-3.5 text-success" aria-hidden="true" />
                    Learned through
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
            {page.loadingMore
              ? "Loading characters..."
              : "Load more characters"}
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
              ? "Loading progress..."
              : "Load more character progress"}
          </Button>
        ) : null}
      </div>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto p-5 sm:p-6">
        {selected ? (
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
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
