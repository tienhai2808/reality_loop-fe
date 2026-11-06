"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { PronunciationAudioButton } from "@/features/language-foundations/components/audio/pronunciation-audio-button"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import { partOfSpeechLabels } from "@/features/vocabulary/lib/vocabulary-labels"
import {
  vocabularyReviewRatingSchema,
  type VocabularyFlashcard as Flashcard,
  type VocabularyReviewRating,
} from "../api/vocabulary-learning-schemas"
import { ratingHints, ratingLabels } from "../lib/review-copy"

export function VocabularyFlashcard({
  card,
  languageCode,
  disabled,
  onRate,
  actions,
}: {
  card: Flashcard
  languageCode: string
  disabled: boolean
  onRate: (rating: VocabularyReviewRating) => void
  actions?: ReactNode
}) {
  const [revealed, setRevealed] = useState(false)
  const answerRef = useRef<HTMLDivElement | null>(null)
  const wordRef = useRef<HTMLHeadingElement | null>(null)
  useEffect(() => {
    wordRef.current?.focus()
  }, [])
  useEffect(() => {
    if (revealed) answerRef.current?.focus()
  }, [revealed])
  return (
    <section className="space-y-3" aria-label="Thẻ ôn từ vựng">
      <div className="space-y-3 border-y border-border py-4 text-center">
        <h2
          ref={wordRef}
          tabIndex={-1}
          lang={languageCode}
          className="font-ja break-words rounded-sm text-4xl font-medium leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-5xl"
        >
          {card.term}
        </h2>
        {card.reading !== null ? (
          <p
            lang={languageCode}
            className="font-ja break-words text-lg leading-relaxed text-muted-foreground"
          >
            {card.reading}
          </p>
        ) : null}
        <div className="flex justify-center">
          <PronunciationAudioButton
            url={card.audioUrl}
            label={card.reading ?? card.term}
            scope={`review:${card.progress.id}`}
          />
        </div>
        {!revealed ? (
          <Button
            disabled={disabled}
            className="min-h-11 sm:min-h-9"
            onClick={() => setRevealed(true)}
          >
            Xem nghĩa
          </Button>
        ) : null}
      </div>
      {revealed ? (
        <>
          <div
            ref={answerRef}
            tabIndex={-1}
            className="space-y-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            role="region"
            aria-label="Nghĩa của thẻ"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {partOfSpeechLabels[card.partOfSpeech]}
            </p>
            {card.meaning !== null ? (
              <p
                lang={card.translationLocale ?? undefined}
                className="whitespace-pre-line break-words text-base leading-7"
              >
                {card.meaning}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nghĩa này chưa có bản dịch.
              </p>
            )}
            {card.usageNote !== null ? (
              <p
                lang={card.translationLocale ?? undefined}
                className="whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
              >
                {card.usageNote}
              </p>
            ) : null}
            {card.isTranslationFallback && card.translationLocale ? (
              <p className="text-xs text-muted-foreground">
                Bản dịch: {languageLabel(card.translationLocale)}
              </p>
            ) : null}
          </div>
          <fieldset disabled={disabled} className="space-y-3">
            <legend className="mb-3 text-sm font-medium">
              Bạn nhớ nghĩa này ở mức nào?
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {vocabularyReviewRatingSchema.options.map((rating) => (
                <Button
                  key={rating}
                  variant="outline"
                  className="h-auto min-h-14 flex-col gap-1 py-2"
                  onClick={() => onRate(rating)}
                >
                  <span>{ratingLabels[rating]}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {ratingHints[rating]}
                  </span>
                </Button>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}
      {actions}
    </section>
  )
}
