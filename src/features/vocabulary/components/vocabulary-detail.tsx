"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  useCatalogPage,
  useCatalogResource,
} from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { PronunciationAudioButton } from "@/features/language-foundations/components/audio/pronunciation-audio-button"
import { getVocabularyEntry, listVocabularySenses } from "../api/vocabulary-api"
import { VocabularySenseItem } from "./vocabulary-sense"
import { AddVocabularySenseButton } from "@/features/vocabulary-learning/components/add-vocabulary-sense-button"

export function VocabularyDetailContent({
  profileId,
  languageCode,
  locale,
  entryCode,
}: {
  profileId: string
  languageCode: string
  locale: string
  entryCode: string
}) {
  // Both resources start on the same mount. Localized senses do not gate metadata.
  const entryLoader = useCallback(
    (signal: AbortSignal) =>
      getVocabularyEntry(languageCode, entryCode, signal),
    [languageCode, entryCode]
  )
  const senseLoader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listVocabularySenses(languageCode, entryCode, locale, after, signal),
    [languageCode, entryCode, locale]
  )
  const entry = useCatalogResource(
    `vocabulary-entry:${languageCode}:${entryCode}`,
    entryLoader
  )
  const senses = useCatalogPage(
    `vocabulary-senses:${languageCode}:${entryCode}:${locale}:20`,
    senseLoader
  )

  if (entry.error?.status === 404)
    return (
      <ContentUnavailable title="Không tìm thấy từ">
        Từ này hiện không có trong ngôn ngữ đang học. Hãy chọn một từ khác.
      </ContentUnavailable>
    )

  return (
    <div className="space-y-4">
      {entry.status === "loading" ? (
        <CatalogLoading label="Đang tải từ…" />
      ) : null}
      <CatalogFeedback
        error={entry.error}
        onRetry={() => void entry.reload()}
      />
      <header className="space-y-1">
        <h2
          lang={entry.data?.languageCode}
          className="font-ja break-words text-3xl font-medium leading-relaxed"
        >
          {entry.data?.term ?? "Chi tiết từ"}
        </h2>
        {entry.data?.reading !== null && entry.data?.reading !== undefined ? (
          <p
            lang={entry.data.languageCode}
            className="font-ja break-words text-lg leading-relaxed text-muted-foreground"
          >
            {entry.data.reading}
          </p>
        ) : null}
        {entry.data ? (
          <PronunciationAudioButton
            url={entry.data.audioUrl}
            label={entry.data.reading ?? entry.data.term}
            scope={`vocabulary-detail:${languageCode}:${entryCode}`}
          />
        ) : null}
      </header>
      <section
        className="space-y-2"
        aria-labelledby="vocabulary-meanings-heading"
      >
        <h2 id="vocabulary-meanings-heading" className="text-lg font-semibold">
          Các nghĩa
        </h2>
        {senses.status === "loading" ? (
          <CatalogLoading label="Đang tải nghĩa…" />
        ) : null}
        {senses.error?.status === 404 ? (
          <ContentUnavailable title="Chưa có nghĩa">
            Từ này chưa có nghĩa được xuất bản.
          </ContentUnavailable>
        ) : (
          <CatalogFeedback
            error={senses.error}
            onRetry={() =>
              void (senses.data?.nextCursor && senses.error?.status !== 400
                ? senses.loadMore()
                : senses.reload())
            }
          />
        )}
        {senses.status === "ready" && !senses.data.items.length ? (
          <ContentUnavailable title="Chưa có nghĩa">
            Từ này chưa có nghĩa được xuất bản.
          </ContentUnavailable>
        ) : null}
        {senses.data?.items.length && senses.error?.status !== 404 ? (
          <ol className="list-decimal divide-y divide-border border-y border-border pl-5">
            {senses.data.items.map((sense) => (
              <VocabularySenseItem
                key={sense.id}
                sense={sense}
                actions={
                  <AddVocabularySenseButton
                    profileId={profileId}
                    senseId={sense.id}
                  />
                }
              />
            ))}
          </ol>
        ) : null}
        {senses.data?.nextCursor && !senses.error ? (
          <Button
            variant="outline"
            disabled={senses.loadingMore}
            aria-busy={senses.loadingMore}
            onClick={() => void senses.loadMore()}
          >
            {senses.loadingMore ? "Đang tải nghĩa…" : "Xem thêm nghĩa"}
          </Button>
        ) : null}
      </section>
    </div>
  )
}
