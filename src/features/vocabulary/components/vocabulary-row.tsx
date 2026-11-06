import Link from "next/link"
import { PronunciationAudioButton } from "@/features/language-foundations/components/audio/pronunciation-audio-button"
import type {
  PartOfSpeech,
  VocabularyEntrySummaryDto,
} from "../api/vocabulary-schemas"
import { vocabularyListHref } from "../lib/vocabulary-labels"
import { VocabularyMeaning } from "./vocabulary-sense"

export function VocabularyRow({
  entry,
  partOfSpeech,
  selected,
}: {
  entry: VocabularyEntrySummaryDto
  partOfSpeech?: PartOfSpeech
  selected: boolean
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2">
      <Link
        id={`word-${entry.code}`}
        href={vocabularyListHref(partOfSpeech, entry.code)}
        scroll={false}
        aria-current={selected ? "page" : undefined}
        className="flex min-h-11 min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-sm px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted"
      >
        <div className="flex min-w-28 flex-wrap items-baseline gap-x-2">
          <h2
            lang={entry.languageCode}
            className="font-ja break-words text-xl font-medium leading-relaxed"
          >
            {entry.term}
          </h2>
          {entry.reading !== null ? (
            <p
              lang={entry.languageCode}
              className="font-ja break-words text-sm leading-6 text-muted-foreground"
            >
              {entry.reading}
            </p>
          ) : null}
        </div>
        {entry.primarySense ? (
          <div className="min-w-0 flex-1 basis-32 text-foreground">
            <VocabularyMeaning sense={entry.primarySense} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa có nghĩa tóm tắt.
          </p>
        )}
      </Link>
      {entry.audioUrl ? (
        <div className="shrink-0 pt-1">
          <PronunciationAudioButton
            url={entry.audioUrl}
            label={entry.reading ?? entry.term}
            scope={`vocabulary:${entry.languageCode}:${entry.id}`}
            compact
          />
        </div>
      ) : null}
    </div>
  )
}
