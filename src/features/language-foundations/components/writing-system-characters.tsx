"use client"

import { useCallback, useState } from "react"
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

export function WritingSystemCharacters({
  languageCode,
  systemCode,
  systemName,
}: {
  languageCode: string
  systemCode: string
  systemName: string
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listWritingSystemItems(languageCode, systemCode, after, signal),
    [languageCode, systemCode]
  )
  const page = useCatalogPage(`items:${languageCode}:${systemCode}`, loader)
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
          <CharacterChart
            items={items}
            languageCode={languageCode}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
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
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
