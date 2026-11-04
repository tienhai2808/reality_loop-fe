"use client"

import Link from "next/link"
import { useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
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
import { partOfSpeechSchema } from "../api/vocabulary-schemas"
import { vocabularyListHref } from "../lib/vocabulary-labels"
import { VocabularySenseItem } from "./vocabulary-sense"

export function VocabularyDetail({ entryCode }: { entryCode: string }) {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const filter = partOfSpeechSchema.safeParse(search.get("partOfSpeech"))
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <div className="min-w-0 max-w-3xl space-y-6">
      <nav
        aria-label="Vocabulary navigation"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <Link
          href={vocabularyListHref(filter.success ? filter.data : undefined)}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Vocabulary
        </Link>
        <Link
          href="/learn"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Language Foundations
        </Link>
      </nav>
      <p className="text-sm text-muted-foreground">
        {languageLabel(profile.targetLanguage)}
      </p>
      <VocabularyDetailContent
        key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.targetLanguage}:${entryCode}`}
        languageCode={profile.targetLanguage}
        locale={profile.explanationLanguage}
        entryCode={entryCode}
      />
    </div>
  )
}

function VocabularyDetailContent({
  languageCode,
  locale,
  entryCode,
}: {
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
      <ContentUnavailable title="Word unavailable">
        This word hasn&apos;t been published or is no longer available for your
        learning language. Return to Vocabulary to explore other words.
      </ContentUnavailable>
    )

  return (
    <div className="space-y-8">
      {entry.status === "loading" ? (
        <CatalogLoading label="Loading word..." />
      ) : null}
      <CatalogFeedback
        error={entry.error}
        onRetry={() => void entry.reload()}
      />
      <header className="space-y-3">
        <h1
          lang={entry.data?.languageCode}
          className="font-ja break-words text-4xl font-medium leading-relaxed sm:text-5xl"
        >
          {entry.data?.term ?? "Word details"}
        </h1>
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
        className="space-y-4"
        aria-labelledby="vocabulary-meanings-heading"
      >
        <h2 id="vocabulary-meanings-heading" className="text-lg font-semibold">
          Meanings
        </h2>
        {senses.status === "loading" ? (
          <CatalogLoading label="Loading meanings..." />
        ) : null}
        {senses.error?.status === 404 ? (
          <ContentUnavailable title="Meanings aren't available">
            No published meanings are available for this word right now.
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
          <ContentUnavailable title="Meanings are coming">
            Meanings aren&apos;t available for this word yet.
          </ContentUnavailable>
        ) : null}
        {senses.data?.items.length && senses.error?.status !== 404 ? (
          <ol className="list-decimal divide-y divide-border border-y border-border pl-5">
            {senses.data.items.map((sense) => (
              <VocabularySenseItem key={sense.id} sense={sense} />
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
            {senses.loadingMore ? "Loading meanings..." : "Load more meanings"}
          </Button>
        ) : null}
      </section>
    </div>
  )
}
