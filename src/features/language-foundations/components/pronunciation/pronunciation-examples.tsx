"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { listPronunciationExamples } from "../../api/pronunciation-api"
import { useCatalogPage } from "../../hooks/use-catalog"
import { CatalogFeedback, CatalogLoading } from "../catalog-feedback"
import { PronunciationAudioButton } from "../audio/pronunciation-audio-button"

export function PronunciationExamples({
  languageCode,
  ruleCode,
}: {
  languageCode: string
  ruleCode: string
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listPronunciationExamples(languageCode, ruleCode, after, signal),
    [languageCode, ruleCode]
  )
  const examples = useCatalogPage(
    `pronunciation-examples:${languageCode}:${ruleCode}:20`,
    loader
  )

  return (
    <section className="min-w-0 space-y-3" aria-label="Examples">
      <h4 className="text-sm font-medium">Examples</h4>
      {examples.status === "loading" ? (
        <CatalogLoading label="Loading examples..." />
      ) : null}
      {examples.error?.status === 404 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Examples aren&apos;t available for this rule.
        </p>
      ) : (
        <CatalogFeedback
          error={examples.error}
          onRetry={() =>
            void (examples.data ? examples.loadMore() : examples.reload())
          }
        />
      )}
      {examples.status === "ready" && !examples.data.items.length ? (
        <p className="text-sm leading-6 text-muted-foreground">
          No examples have been published for this rule yet.
        </p>
      ) : null}
      {examples.data?.items.length ? (
        <ul className="divide-y divide-border border-y border-border">
          {examples.data.items.map((example) => (
            <li
              key={example.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <p
                  lang={languageCode}
                  className="whitespace-pre-line break-words text-2xl leading-relaxed"
                >
                  {example.text}
                </p>
                <p className="whitespace-pre-line break-words text-base text-muted-foreground">
                  {example.transcription}
                </p>
                <p className="break-words text-xs text-muted-foreground">
                  {example.transcriptionSystem}
                </p>
              </div>
              <PronunciationAudioButton
                url={example.audioUrl}
                label={example.text}
                compact
              />
            </li>
          ))}
        </ul>
      ) : null}
      {examples.data?.nextCursor && !examples.error ? (
        <Button
          variant="outline"
          disabled={examples.loadingMore}
          aria-busy={examples.loadingMore}
          onClick={() => void examples.loadMore()}
        >
          {examples.loadingMore ? "Loading examples..." : "Load more examples"}
        </Button>
      ) : null}
    </section>
  )
}
