"use client"

import { useCallback } from "react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { listItemReadings } from "../api/language-foundations-api"
import type {
  WritingSystemItemDto,
  WritingSystemItemReadingDto,
} from "../api/language-foundations-schemas"
import { type CatalogCache, useCatalogPage } from "../hooks/use-catalog"
import { CatalogFeedback, CatalogLoading } from "./catalog-feedback"
import { PronunciationAudioButton } from "./audio/pronunciation-audio-button"

export function CharacterDetailPanel({
  item,
  languageCode,
  systemCode,
  systemName,
  cache,
  previous,
  next,
  onNavigate,
}: {
  item: WritingSystemItemDto
  languageCode: string
  systemCode: string
  systemName: string
  cache: CatalogCache<WritingSystemItemReadingDto>
  previous: WritingSystemItemDto | null
  next: WritingSystemItemDto | null
  onNavigate: (item: WritingSystemItemDto) => void
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listItemReadings(languageCode, systemCode, item.code, after, signal),
    [languageCode, systemCode, item.code]
  )
  const readings = useCatalogPage(
    `readings:${languageCode}:${systemCode}:${item.id}:${item.version}:${item.updatedAt}`,
    loader,
    cache
  )

  return (
    <div
      className="space-y-5"
      onKeyDown={(event) => {
        if (
          event.target instanceof HTMLAudioElement ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return
        const destination =
          event.key === "ArrowLeft"
            ? previous
            : event.key === "ArrowRight"
              ? next
              : null
        if (destination) {
          event.preventDefault()
          onNavigate(destination)
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <DialogTitle
            lang={languageCode}
            className="break-all text-5xl leading-relaxed font-normal"
          >
            {item.symbol}
          </DialogTitle>
          <DialogDescription className="break-words text-sm text-muted-foreground">
            {systemName}
          </DialogDescription>
        </div>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close character details"
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </div>
      <section className="space-y-3" aria-label="Readings">
        <h2 className="text-sm font-medium">Readings</h2>
        {readings.status === "loading" ? (
          <CatalogLoading label="Loading readings..." />
        ) : null}
        {readings.error?.status === 404 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Reading information is not available for this character.
          </p>
        ) : (
          <CatalogFeedback
            error={readings.error}
            onRetry={() =>
              void (readings.data ? readings.loadMore() : readings.reload())
            }
          />
        )}
        {readings.status === "ready" && !readings.data.items.length ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Reading information is not available for this character yet.
          </p>
        ) : null}
        {readings.data?.items.length ? (
          <ul className="divide-y divide-border border-y border-border">
            {readings.data.items.map((reading) => (
              <li key={reading.id} className="space-y-2 py-3">
                <p className="break-words text-xl font-medium">
                  {reading.transcription}
                </p>
                <p className="break-words text-xs text-muted-foreground">
                  {reading.transcriptionSystem}
                </p>
                {reading.audioUrl ? (
                  <PronunciationAudioButton
                    key={`${item.id}:${reading.id}`}
                    url={reading.audioUrl}
                    label={reading.transcription}
                    scope={`character:${item.id}`}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {readings.data?.nextCursor && !readings.error ? (
          <Button
            variant="outline"
            disabled={readings.loadingMore}
            aria-busy={readings.loadingMore}
            onClick={() => void readings.loadMore()}
          >
            {readings.loadingMore
              ? "Loading readings..."
              : "Load more readings"}
          </Button>
        ) : null}
      </section>
      <div className="flex justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          disabled={!previous}
          onClick={() => previous && onNavigate(previous)}
        >
          <ArrowLeft aria-hidden="true" />
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!next}
          onClick={() => next && onNavigate(next)}
        >
          Next
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
