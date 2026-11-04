"use client"

import Link from "next/link"
import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import { useCatalogPage } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { listVocabulary } from "../api/vocabulary-api"
import {
  partOfSpeechSchema,
  type PartOfSpeech,
} from "../api/vocabulary-schemas"
import {
  partOfSpeechLabels,
  vocabularyListHref,
} from "../lib/vocabulary-labels"
import { VocabularyRow } from "./vocabulary-row"

export function VocabularyList() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  const rawFilter = search.get("partOfSpeech")
  const parsed = partOfSpeechSchema.safeParse(rawFilter)
  return (
    <div className="min-w-0 max-w-3xl space-y-6">
      <Link
        href="/learn"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Language Foundations
      </Link>
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {languageLabel(profile.targetLanguage)}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Vocabulary</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Explore words, their readings, and the meanings they carry.
        </p>
      </header>
      {rawFilter && !parsed.success ? (
        <ContentUnavailable title="This filter isn't available">
          <Link
            href={vocabularyListHref()}
            className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Show all words
          </Link>
        </ContentUnavailable>
      ) : (
        <VocabularyListContent
          key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.targetLanguage}`}
          languageCode={profile.targetLanguage}
          locale={profile.explanationLanguage}
          partOfSpeech={parsed.success ? parsed.data : undefined}
        />
      )}
    </div>
  )
}

const PART_OF_SPEECH_OPTIONS = [
  { value: "all", label: "All parts of speech" },
  ...partOfSpeechSchema.options.map((value) => ({
    value,
    label: partOfSpeechLabels[value],
  })),
] as const

function VocabularyListContent({
  languageCode,
  locale,
  partOfSpeech,
}: {
  languageCode: string
  locale: string
  partOfSpeech?: PartOfSpeech
}) {
  const router = useRouter()
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listVocabulary(languageCode, locale, partOfSpeech, after, signal),
    [languageCode, locale, partOfSpeech]
  )
  const page = useCatalogPage(
    `vocabulary:${languageCode}:${locale}:${partOfSpeech ?? "all"}:20`,
    loader
  )
  return (
    <div className="space-y-5">
      <div className="max-w-xs space-y-2">
        <label
          htmlFor="vocabulary-part-of-speech"
          className="text-sm font-medium"
        >
          Part of speech
        </label>
        <Select
          items={PART_OF_SPEECH_OPTIONS}
          value={partOfSpeech ?? "all"}
          onValueChange={(val) => {
            const parsed = partOfSpeechSchema.safeParse(val)
            router.push(
              vocabularyListHref(parsed.success ? parsed.data : undefined),
              { scroll: false }
            )
          }}
        >
          <SelectTrigger id="vocabulary-part-of-speech">
            <SelectValue placeholder="All parts of speech" />
          </SelectTrigger>
          <SelectContent>
            {PART_OF_SPEECH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {page.status === "loading" ? (
        <CatalogLoading label="Loading vocabulary..." />
      ) : null}
      {page.error?.status === 404 ? (
        <ContentUnavailable title="Vocabulary is coming for this language">
          Vocabulary content isn&apos;t available for this language yet. Check
          back later.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={page.error}
          onRetry={() =>
            void (page.data?.nextCursor && page.error?.status !== 400
              ? page.loadMore()
              : page.reload())
          }
        />
      )}
      {page.status === "ready" && !page.data.items.length ? (
        partOfSpeech ? (
          <ContentUnavailable title="No words found for this part of speech">
            <Link
              href={vocabularyListHref()}
              className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Show all words
            </Link>
          </ContentUnavailable>
        ) : (
          <ContentUnavailable title="No vocabulary available yet">
            Vocabulary content isn&apos;t available for this language yet. Check
            back later.
          </ContentUnavailable>
        )
      ) : null}
      {page.data?.items.length && page.error?.status !== 404 ? (
        <ul className="divide-y divide-border border-y border-border">
          {page.data.items.map((entry) => (
            <VocabularyRow
              key={entry.id}
              entry={entry}
              partOfSpeech={partOfSpeech}
            />
          ))}
        </ul>
      ) : null}
      {page.data?.nextCursor && !page.error ? (
        <Button
          variant="outline"
          disabled={page.loadingMore}
          aria-busy={page.loadingMore}
          onClick={() => void page.loadMore()}
        >
          {page.loadingMore ? "Loading words..." : "Load more words"}
        </Button>
      ) : null}
    </div>
  )
}
