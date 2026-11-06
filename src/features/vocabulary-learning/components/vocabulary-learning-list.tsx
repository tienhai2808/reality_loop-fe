"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { cn } from "@/lib/utils"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import {
  vocabularyLearningStatusSchema,
  type VocabularyLearningStatus,
} from "../api/vocabulary-learning-schemas"
import { useVocabularyLearningQueue } from "../hooks/use-vocabulary-learning-queue"
import {
  learningStatusLabels,
  ReviewTime,
  savedVocabularyHref,
} from "../lib/review-copy"

import { LearnDetailPane } from "@/features/learn/components/learn-detail-pane"
import { useLearnWideLayout } from "@/features/learn/hooks/use-learn-wide-layout"
import { VocabularyReviewHistory } from "./vocabulary-review-history"

export function VocabularyLearningList() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const parsed = vocabularyLearningStatusSchema.safeParse(search.get("status"))
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <SavedContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}`}
      profileId={profile.id}
      locale={profile.explanationLanguage}
      languageCode={profile.targetLanguage}
      status={parsed.success ? parsed.data : undefined}
    />
  )
}
const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả thẻ" },
  ...vocabularyLearningStatusSchema.options.map((value) => ({
    value,
    label: learningStatusLabels[value],
  })),
] as const

function SavedContent({
  profileId,
  locale,
  languageCode,
  status,
}: {
  profileId: string
  locale: string
  languageCode: string
  status?: VocabularyLearningStatus
}) {
  const router = useRouter()
  const search = useSearchParams()
  const queue = useVocabularyLearningQueue(profileId, locale, false, status)
  const selected = search.get("card")
  const wide = useLearnWideLayout()
  const selectedInList = queue.data?.items.some(
    (card) => card.progress.id === selected
  )
  const detail = selected ? (
    <LearnDetailPane
      label="Chi tiết thẻ"
      selection={selected}
      closeHref={savedVocabularyHref(new URLSearchParams(search))}
      triggerId={`saved-card-${selected}`}
    >
      <VocabularyReviewHistory
        profileId={profileId}
        progressId={selected}
        embedded
      />
    </LearnDetailPane>
  ) : null
  return (
    <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <div className="max-w-xs space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="saved-vocabulary-status"
          >
            Trạng thái ôn
          </label>
          <Select
            items={STATUS_OPTIONS}
            value={status ?? "all"}
            onValueChange={(val) => {
              const parsed = vocabularyLearningStatusSchema.safeParse(val)
              const query = new URLSearchParams(search)
              query.set("mode", "saved")
              if (parsed.success) query.set("status", parsed.data)
              else query.delete("status")
              router.push(`/learn/vocabulary?${query}`, { scroll: false })
            }}
          >
            <SelectTrigger id="saved-vocabulary-status">
              <SelectValue placeholder="Tất cả thẻ" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {queue.status === "loading" ? (
          <CatalogLoading label="Đang tải thẻ đã lưu…" />
        ) : null}
        <CatalogFeedback
          error={queue.error}
          onRetry={() =>
            void (queue.data?.nextCursor && queue.error?.status !== 400
              ? queue.loadMore()
              : queue.reload())
          }
        />
        {queue.status === "ready" && !queue.data.items.length ? (
          <ContentUnavailable title="Chưa có thẻ">
            Lưu một nghĩa để ôn hoặc chọn bộ lọc khác.
            <Link
              href="/learn/vocabulary"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Tra từ
            </Link>
          </ContentUnavailable>
        ) : null}
        {queue.data?.items.length && queue.error?.status !== 404 ? (
          <ul className="divide-y divide-border border-y border-border">
            {queue.data.items.map((card) => (
              <li key={card.progress.id}>
                <Link
                  id={`saved-card-${card.progress.id}`}
                  href={savedVocabularyHref(
                    new URLSearchParams(search),
                    card.progress.id
                  )}
                  scroll={false}
                  aria-current={
                    selected === card.progress.id ? "page" : undefined
                  }
                  className="block space-y-1 rounded-sm px-2 py-2 outline-none hover:bg-muted aria-[current=page]:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <h2
                    lang={languageCode}
                    className="font-ja break-words text-2xl leading-relaxed"
                  >
                    {card.term}
                  </h2>
                  {card.reading !== null ? (
                    <p
                      lang={languageCode}
                      className="font-ja break-words text-sm text-muted-foreground"
                    >
                      {card.reading}
                    </p>
                  ) : null}
                  <p
                    lang={card.translationLocale ?? undefined}
                    className="whitespace-pre-line break-words text-sm leading-6"
                  >
                    {card.meaning ?? "Chưa có bản dịch."}
                  </p>
                  {card.isTranslationFallback && card.translationLocale ? (
                    <p className="text-xs text-muted-foreground">
                      Bản dịch: {languageLabel(card.translationLocale)}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                        card.progress.status === "Reviewing" &&
                          "bg-success-subtle text-success",
                        card.progress.status === "Learning" &&
                          "bg-primary/10 text-primary",
                        card.progress.status === "New" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {learningStatusLabels[card.progress.status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Lượt ôn tiếp theo{" "}
                      <ReviewTime value={card.progress.nextReviewAt} />
                    </span>
                  </div>
                </Link>
                {!wide && selected === card.progress.id ? detail : null}
              </li>
            ))}
          </ul>
        ) : null}
        {queue.data?.nextCursor && !queue.error ? (
          <Button
            variant="outline"
            disabled={queue.loadingMore}
            aria-busy={queue.loadingMore}
            onClick={() => void queue.loadMore()}
          >
            {queue.loadingMore ? "Đang tải thẻ…" : "Xem thêm thẻ"}
          </Button>
        ) : null}
        {queue.asOf ? (
          <p className="text-xs text-muted-foreground">
            Danh sách cập nhật lúc <ReviewTime value={queue.asOf} />.
          </p>
        ) : null}
      </div>
      {wide || (!selectedInList && queue.status !== "loading") ? detail : null}
    </div>
  )
}
