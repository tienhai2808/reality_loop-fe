"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { getVocabularyLearningCard } from "../api/vocabulary-learning-api"
import { useVocabularyLearning } from "../model/vocabulary-learning-context"
import { useVocabularyReview } from "../hooks/use-vocabulary-review"
import {
  ratingLabels,
  ReviewTime,
  savedVocabularyHref,
} from "../lib/review-copy"
import { VocabularyFlashcard } from "./vocabulary-flashcard"

export function VocabularyCardReview({
  profileId,
  progressId,
  languageCode,
  locale,
  onContinue,
  queueReady,
  onUnavailable,
}: {
  profileId: string
  progressId: string
  languageCode: string
  locale: string
  onContinue: () => void
  queueReady: boolean
  onUnavailable: () => void
}) {
  const search = useSearchParams()
  const { revision } = useVocabularyLearning()
  const loader = useCallback(
    (signal: AbortSignal) =>
      getVocabularyLearningCard(profileId, progressId, locale, signal),
    [profileId, progressId, locale]
  )
  const card = useCatalogResource(
    `review-card:${profileId}:${progressId}:${locale}:${revision}`,
    loader
  )
  const review = useVocabularyReview(profileId, progressId)
  const feedbackRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (review.state.status === "conflict") feedbackRef.current?.focus()
  }, [review.state.status])
  const currentCard = card.data
  const [cycle, setCycle] = useState(0)
  const receipt = review.state.status === "saved" ? review.state.receipt : null
  useEffect(() => {
    if (receipt && queueReady) onContinue()
  }, [receipt, queueReady, onContinue])
  const retryError = review.state.status === "retry" ? review.state.error : null
  const needsReload =
    retryError && [400, 404, 413, 415].includes(retryError.status ?? 0)
  return (
    <div className="space-y-3">
      {card.status === "loading" ? (
        <CatalogLoading label="Đang tải thẻ…" />
      ) : null}
      {card.error?.status === 404 ? (
        <ContentUnavailable title="Không tìm thấy thẻ">
          Nghĩa này có thể đã ngừng phát hành. Bạn có thể ôn thẻ khác hoặc xem
          lịch sử.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={card.error}
          onRetry={() => void card.reload()}
        />
      )}
      {review.state.status === "conflict" ? (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          className="space-y-3 rounded-sm border-y border-border py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p role="status" className="text-sm leading-6 text-muted-foreground">
            Thẻ đã thay đổi. Hãy xem bản mới nhất trước khi đánh giá lại.
          </p>
          <Button
            variant="outline"
            disabled={card.status !== "ready"}
            onClick={() => {
              review.confirmLatest()
              setCycle((value) => value + 1)
            }}
          >
            Xem thẻ mới nhất
          </Button>
        </div>
      ) : null}
      {review.state.status === "retry" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Chưa xác nhận: {ratingLabels[review.state.payload.rating]}.{" "}
            {needsReload
              ? "Tải lại thẻ trước khi đánh giá."
              : "Thử lại để xác nhận đúng đánh giá vừa gửi."}
          </p>
          <CatalogFeedback
            error={retryError}
            onRetry={needsReload ? review.reloadForNewAction : review.retry}
          />
        </div>
      ) : null}
      {review.state.status === "submitting" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Đang lưu đánh giá…
        </p>
      ) : null}
      {receipt ? (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          className="space-y-3 rounded-sm border-y border-border py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h2 className="text-lg font-semibold" role="status">
            Đã lưu đánh giá
          </h2>
          <p className="text-sm">
            Lượt ôn tiếp theo: <ReviewTime value={receipt.nextReviewAt} />
          </p>
          {card.data &&
          card.data.progress.version > receipt.progressVersionAfter ? (
            <p className="text-sm leading-6 text-muted-foreground">
              Thẻ vừa được ôn ở phiên khác. Lượt ôn tiếp theo:{" "}
              <ReviewTime value={card.data.progress.nextReviewAt} />
            </p>
          ) : null}
        </div>
      ) : currentCard && review.state.status !== "conflict" ? (
        <VocabularyFlashcard
          key={`${currentCard.progress.id}:${currentCard.progress.version}:${currentCard.requestedLocale}:${cycle}`}
          card={currentCard}
          languageCode={languageCode}
          disabled={review.state.status !== "idle" || card.status !== "ready"}
          onRate={(rating) => review.rate(rating, currentCard.progress.version)}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={savedVocabularyHref(new URLSearchParams(search), progressId)}
          className={buttonVariants({ variant: "outline" })}
        >
          Chi tiết và lịch sử ôn
        </Link>
        {card.error?.status === 404 ? (
          <Button variant="outline" onClick={onUnavailable}>
            Tải lại danh sách ôn
          </Button>
        ) : null}
      </div>
    </div>
  )
}
