"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { getVocabularyLearningSummary } from "../api/vocabulary-learning-api"
import { useVocabularyLearning } from "../model/vocabulary-learning-context"
import { useVocabularyLearningQueue } from "../hooks/use-vocabulary-learning-queue"
import { ratingLabels, ReviewTime } from "../lib/review-copy"
import { VocabularyCardReview } from "./vocabulary-card-review"

export function VocabularyReviewPage() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <ReviewContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}`}
      profileId={profile.id}
      languageCode={profile.targetLanguage}
      locale={profile.explanationLanguage}
    />
  )
}
function ReviewContent({
  profileId,
  languageCode,
  locale,
}: {
  profileId: string
  languageCode: string
  locale: string
}) {
  const { revision, invalidate, pendingReviews } = useVocabularyLearning()
  const loader = useCallback(
    (signal: AbortSignal) => getVocabularyLearningSummary(profileId, signal),
    [profileId]
  )
  const summary = useCatalogResource(
    `vocabulary-summary:${profileId}:${revision}`,
    loader
  )
  // Independent hooks start summary and the server's due queue in parallel.
  const queue = useVocabularyLearningQueue(profileId, locale, true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const pending = [...pendingReviews.entries()].filter(([key]) =>
    key.startsWith(`${profileId}:`)
  )
  function next() {
    if (queue.status !== "ready") return
    setSelectedId(queue.data.items[0]?.progress.id ?? null)
    setRound((value) => value + 1)
  }
  return (
    <div className="min-w-0 max-w-3xl space-y-3">
      {summary.status === "loading" ? (
        <CatalogLoading label="Đang tải số thẻ đến hạn…" />
      ) : null}
      <CatalogFeedback
        error={summary.error}
        onRetry={() => void summary.reload()}
      />
      {!selectedId && summary.data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-semibold">
              {summary.data.due} thẻ đến hạn
            </h2>
            {summary.data.nextFutureReviewAt ? (
              <p className="text-xs text-muted-foreground">
                Lượt ôn tiếp theo ·{" "}
                <ReviewTime value={summary.data.nextFutureReviewAt} />
              </p>
            ) : null}
          </div>
          {queue.data?.items.length ? (
            <Button
              disabled={queue.status !== "ready"}
              onClick={next}
              className="min-h-11 sm:min-h-9"
            >
              Ôn ngay
            </Button>
          ) : null}
        </div>
      ) : null}
      {queue.status === "loading" ? (
        <CatalogLoading label="Đang tải thẻ đến hạn…" />
      ) : null}
      {!selectedId && pending.length ? (
        <section
          className="space-y-3 border-y border-border py-4"
          aria-label="Đánh giá chưa xác nhận"
        >
          <h2 className="text-base font-medium">Xác nhận đánh giá trước</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Chọn một đánh giá để kiểm tra lại kết quả đã gửi.
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.map(([key, operation]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => {
                  setSelectedId(key.slice(profileId.length + 1))
                  setRound((value) => value + 1)
                }}
              >
                Xác nhận: {ratingLabels[operation.payload.rating]}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
      <CatalogFeedback
        error={queue.error}
        onRetry={() =>
          void (queue.data?.nextCursor && queue.error?.status !== 400
            ? queue.loadMore()
            : queue.reload())
        }
      />
      {selectedId ? (
        <div className="mx-auto max-w-xl">
          <VocabularyCardReview
            key={`${selectedId}:${round}`}
            profileId={profileId}
            progressId={selectedId}
            languageCode={languageCode}
            locale={locale}
            onContinue={next}
            queueReady={queue.status === "ready"}
            onUnavailable={() => {
              setSelectedId(null)
              invalidate()
            }}
          />
        </div>
      ) : (
        <>
          {queue.status === "ready" && !queue.data.items.length ? (
            <ContentUnavailable
              title={
                summary.data?.total === 0
                  ? "Lưu nghĩa đầu tiên"
                  : summary.data?.due
                    ? "Chưa mở được thẻ đến hạn"
                    : "Bạn đã ôn hết thẻ đến hạn"
              }
            >
              {summary.data?.total === 0
                ? "Lưu một nghĩa từ mục Tra từ để bắt đầu."
                : "Bạn có thể tra thêm từ hoặc quay lại vào lượt ôn tiếp theo."}
              <Link
                href="/learn/vocabulary"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Tra từ
              </Link>
            </ContentUnavailable>
          ) : null}
          {queue.data?.items.length && summary.status === "error" ? (
            <Button
              variant="outline"
              disabled={queue.status !== "ready"}
              onClick={next}
            >
              Ôn ngay
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
