import Link from "next/link"
import { PronunciationAudioButton } from "@/features/language-foundations/components/audio/pronunciation-audio-button"
import type {
  PartOfSpeech,
  VocabularyEntrySummaryDto,
} from "../api/vocabulary-schemas"
import { partOfSpeechLabels } from "../lib/vocabulary-labels"
import { VocabularyMeaning } from "./vocabulary-sense"

export function VocabularyRow({
  entry,
  partOfSpeech,
}: {
  entry: VocabularyEntrySummaryDto
  partOfSpeech?: PartOfSpeech
}) {
  const query = partOfSpeech ? `?${new URLSearchParams({ partOfSpeech })}` : ""
  return (
    <li className="flex min-w-0 items-start justify-between gap-4 py-5">
      <Link
        href={`/learn/vocabulary/${encodeURIComponent(entry.code)}${query}`}
        className="min-w-0 flex-1 space-y-2.5 rounded-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="space-y-1">
          <h2
            lang={entry.languageCode}
            className="font-ja break-words text-2xl font-medium leading-relaxed"
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
          <div className="space-y-1.5 text-foreground">
            <div>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                {partOfSpeechLabels[entry.primarySense.partOfSpeech]}
              </span>
            </div>
            <VocabularyMeaning sense={entry.primarySense} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Meaning preview isn&apos;t available yet.
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
    </li>
  )
}
