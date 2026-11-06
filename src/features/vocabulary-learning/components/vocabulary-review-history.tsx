"use client"

import Link from "next/link"
import { useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { getLearningProfile } from "@/features/learning-profile/api/learning-profile-api"
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
import { partOfSpeechLabels } from "@/features/vocabulary/lib/vocabulary-labels"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import {
  getVocabularyLearningCard,
  listVocabularyReviews,
} from "../api/vocabulary-learning-api"
import { useVocabularyLearning } from "../model/vocabulary-learning-context"
import {
  learningStatusLabels,
  ratingLabels,
  ReviewTime,
} from "../lib/review-copy"

export function VocabularyReviewHistory({
  profileId,
  progressId,
  embedded = false,
}: {
  profileId: string
  progressId: string
  embedded?: boolean
}) {
  const { state } = useAuth()
  if (state.status !== "authenticated") return null
  return (
    <HistoryContent
      key={`${state.user.id}:${state.sessionId}:${profileId}:${progressId}`}
      profileId={profileId}
      progressId={progressId}
      embedded={embedded}
    />
  )
}
function HistoryContent({
  profileId,
  progressId,
  embedded,
}: {
  profileId: string
  progressId: string
  embedded: boolean
}) {
  const { state: current } = useCurrentLearningProfile()
  const matching =
    current.current?.profile.id === profileId ? current.current.profile : null
  const profileLoader = useCallback(
    (signal: AbortSignal) =>
      matching
        ? Promise.resolve(matching)
        : getLearningProfile(profileId, signal),
    [profileId, matching]
  )
  const profile = useCatalogResource(
    `review-history-profile:${profileId}`,
    profileLoader
  )
  const locale = profile.data?.explanationLanguage
  const { revision } = useVocabularyLearning()
  const cardLoader = useCallback(
    (signal: AbortSignal) =>
      locale
        ? getVocabularyLearningCard(profileId, progressId, locale, signal)
        : Promise.resolve(null),
    [profileId, progressId, locale]
  )
  const card = useCatalogResource(
    `saved-vocabulary-card:${profileId}:${progressId}:${locale}:${revision}`,
    cardLoader
  )
  const historyLoader = useCallback(
    (before: string | null, signal: AbortSignal) =>
      listVocabularyReviews(profileId, progressId, before, signal),
    [profileId, progressId]
  )
  const history = useCatalogPage(
    `vocabulary-reviews:${profileId}:${progressId}:${revision}`,
    historyLoader
  )
  return (
    <div className="min-w-0 max-w-3xl space-y-3">
      {!embedded ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-3"
          aria-label="Điều hướng thẻ đã lưu"
        >
          <Link
            href="/learn/vocabulary?mode=saved"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Thẻ của hồ sơ hiện tại
          </Link>
          <Link
            href="/learn/vocabulary?mode=review"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ôn theo hồ sơ hiện tại
          </Link>
        </nav>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight">Thẻ từ vựng</h1>
      {current.current?.profile.id !== profileId ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Thẻ và lịch sử này thuộc hồ sơ học khác.
        </p>
      ) : null}
      {profile.status === "loading" || card.status === "loading" ? (
        <CatalogLoading label="Đang tải nghĩa đã lưu…" />
      ) : null}
      <CatalogFeedback
        error={profile.error}
        onRetry={() => void profile.reload()}
      />
      {card.error?.status === 404 ? (
        <ContentUnavailable title="Không tìm thấy nghĩa">
          Nội dung này có thể đã ngừng phát hành. Bạn vẫn có thể xem lịch sử ôn
          bên dưới.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={card.error}
          onRetry={() => void card.reload()}
        />
      )}
      {card.data ? (
        <section className="space-y-3" aria-label="Nghĩa đã lưu">
          <h2
            lang={profile.data?.targetLanguage}
            className="font-ja break-words text-4xl leading-relaxed"
          >
            {card.data.term}
          </h2>
          {card.data.reading !== null ? (
            <p
              lang={profile.data?.targetLanguage}
              className="font-ja break-words text-lg text-muted-foreground"
            >
              {card.data.reading}
            </p>
          ) : null}
          <PronunciationAudioButton
            url={card.data.audioUrl}
            label={card.data.reading ?? card.data.term}
            scope={`saved-vocabulary:${profileId}:${progressId}`}
          />
          <p className="text-xs font-medium text-muted-foreground">
            {partOfSpeechLabels[card.data.partOfSpeech]}
          </p>
          <p
            lang={card.data.translationLocale ?? undefined}
            className="whitespace-pre-line break-words text-base leading-7"
          >
            {card.data.meaning ?? "Chưa có bản dịch."}
          </p>
          {card.data.usageNote !== null ? (
            <p
              lang={card.data.translationLocale ?? undefined}
              className="whitespace-pre-line break-words text-sm leading-6 text-muted-foreground"
            >
              {card.data.usageNote}
            </p>
          ) : null}
          {card.data.isTranslationFallback && card.data.translationLocale ? (
            <p className="text-xs text-muted-foreground">
              Bản dịch: {languageLabel(card.data.translationLocale)}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                card.data.progress.status === "Reviewing" &&
                  "bg-success-subtle text-success",
                card.data.progress.status === "Learning" &&
                  "bg-primary/10 text-primary",
                card.data.progress.status === "New" &&
                  "bg-muted text-muted-foreground"
              )}
            >
              {learningStatusLabels[card.data.progress.status]}
            </span>
            <span className="text-xs text-muted-foreground">
              Lượt ôn tiếp theo{" "}
              <ReviewTime value={card.data.progress.nextReviewAt} />
            </span>
          </div>
        </section>
      ) : null}
      <section
        className="space-y-4"
        aria-labelledby="vocabulary-review-history-heading"
      >
        <h2
          id="vocabulary-review-history-heading"
          className="text-lg font-semibold"
        >
          Lịch sử ôn
        </h2>
        <p className="text-xs leading-5 text-muted-foreground">
          Lịch sử ghi lại đánh giá và lịch ôn của từng lượt.
        </p>
        {history.status === "loading" ? (
          <CatalogLoading label="Đang tải lịch sử ôn…" />
        ) : null}
        {history.error?.status === 404 ? (
          <ContentUnavailable title="Không tải được lịch sử ôn">
            Không tìm thấy hồ sơ hoặc thẻ.
          </ContentUnavailable>
        ) : (
          <CatalogFeedback
            error={history.error}
            onRetry={() =>
              void (history.data?.nextCursor && history.error?.status !== 400
                ? history.loadMore()
                : history.reload())
            }
          />
        )}
        {history.status === "ready" && !history.data.items.length ? (
          <p className="text-sm text-muted-foreground">
            Nghĩa này chưa được ôn.
          </p>
        ) : null}
        {history.data?.items.length && history.error?.status !== 404 ? (
          <ol className="divide-y divide-border border-y border-border">
            {history.data.items.map((review) => (
              <li key={review.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    #{review.reviewNumber}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                      (review.rating === "Good" || review.rating === "Easy") &&
                        "bg-success-subtle text-success",
                      review.rating === "Hard" &&
                        "bg-warning-subtle text-warning",
                      review.rating === "Again" &&
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {ratingLabels[review.rating]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Đã ôn <ReviewTime value={review.reviewedAt} />
                </p>
                <p className="text-sm">
                  Lượt ôn tiếp theo: <ReviewTime value={review.nextReviewAt} />
                </p>
                <p className="text-xs text-muted-foreground">
                  Khoảng cách: {review.previousIntervalMinutes} →{" "}
                  {review.intervalMinutes} phút · {review.previousStatus} →{" "}
                  {learningStatusLabels[review.status]}
                </p>
              </li>
            ))}
          </ol>
        ) : null}
        {history.data?.nextCursor && !history.error ? (
          <Button
            variant="outline"
            disabled={history.loadingMore}
            aria-busy={history.loadingMore}
            onClick={() => void history.loadMore()}
          >
            {history.loadingMore ? "Đang tải lượt ôn…" : "Xem thêm lượt ôn"}
          </Button>
        ) : null}
      </section>
    </div>
  )
}
