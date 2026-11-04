import { languageLabel } from "@/features/learning-profile/lib/language-options"
import type {
  VocabularySenseDto,
  VocabularySenseSummaryDto,
} from "../api/vocabulary-schemas"
import { partOfSpeechLabels } from "../lib/vocabulary-labels"

export function VocabularyMeaning({
  sense,
}: {
  sense: VocabularySenseSummaryDto
}) {
  return (
    <div className="space-y-1">
      {sense.meaning !== null ? (
        <p
          lang={sense.translationLocale ?? undefined}
          className="whitespace-pre-line break-words text-sm leading-6"
        >
          {sense.meaning}
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          A translation isn&apos;t available yet.
        </p>
      )}
      {sense.isTranslationFallback && sense.translationLocale !== null ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {languageLabel(sense.translationLocale)} translation
        </p>
      ) : null}
    </div>
  )
}

export function VocabularySenseItem({ sense }: { sense: VocabularySenseDto }) {
  return (
    <li className="space-y-2.5 py-5 pl-2 marker:text-sm marker:font-medium marker:text-muted-foreground">
      <div>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
          {partOfSpeechLabels[sense.partOfSpeech]}
        </span>
      </div>
      <VocabularyMeaning sense={sense} />
      {sense.usageNote !== null ? (
        <div className="space-y-1 rounded-md border border-border/60 bg-surface-subtle p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Usage note
          </p>
          <p
            lang={sense.translationLocale ?? undefined}
            className="whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
          >
            {sense.usageNote}
          </p>
        </div>
      ) : null}
    </li>
  )
}
