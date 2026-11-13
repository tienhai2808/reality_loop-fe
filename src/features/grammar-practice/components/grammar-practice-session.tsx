"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { getLearningProfile } from "@/features/learning-profile/api/learning-profile-api"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { usePracticeSessionEngine } from "@/features/practice/hooks/use-practice-session-engine"
import { PracticeQuestion } from "@/features/writing-system-practice/components/practice-question"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import {
  getGrammarPractice,
  answerGrammarPractice,
  abandonGrammarPractice,
} from "../api/grammar-practice-api"
import type {
  GrammarPracticeDetail,
  GrammarPracticeQuestion,
} from "../api/grammar-practice-schemas"
import { grammarHistoryHref } from "../model/grammar-history-url"
import { useGrammarPracticeHandoff } from "../model/grammar-practice-handoff"

const api = {
  get: getGrammarPractice,
  answer: answerGrammarPractice,
  abandon: abandonGrammarPractice,
}
export function GrammarPracticeSession({
  profileId,
  sessionId,
}: {
  profileId: string
  sessionId: string
}) {
  const { state } = useAuth()
  const handoff = useGrammarPracticeHandoff()
  if (state.status !== "authenticated") return null
  const initial =
    handoff.detail?.session.learningProfileId === profileId &&
    handoff.detail.session.id === sessionId
      ? handoff.detail
      : null
  return (
    <SessionContent
      key={`${state.user.id}:${state.sessionId}:${profileId}:${sessionId}`}
      profileId={profileId}
      sessionId={sessionId}
      initial={initial}
      clear={handoff.clear}
    />
  )
}
function SessionContent({
  profileId,
  sessionId,
  initial,
  clear,
}: {
  profileId: string
  sessionId: string
  initial: GrammarPracticeDetail | null
  clear: () => void
}) {
  const session = usePracticeSessionEngine(profileId, sessionId, initial, api)
  const { state: current } = useCurrentLearningProfile()
  const profileLoader = useCallback(
    (signal: AbortSignal) => getLearningProfile(profileId, signal),
    [profileId]
  )
  const originalProfile = useCatalogResource(
    `grammar-session-profile:${profileId}`,
    profileLoader
  )
  const languageCode = originalProfile.data?.targetLanguage
  const [confirm, setConfirm] = useState(false)
  const results = useRef<HTMLHeadingElement | null>(null)
  const detail = session.detail
  const ended = !!detail && detail.session.status !== "InProgress"
  const busy = session.status !== "ready"
  useEffect(() => {
    if (initial) clear()
  }, [initial, clear])
  useEffect(() => {
    if (ended) results.current?.focus()
  }, [ended])
  const items = [...(detail?.items ?? [])].sort(
    (a, b) => a.position - b.position
  )
  const question = items.find((q) => q.id === session.questionId)
  const previous = question
    ? items
        .filter((q) => q.position < question.position && q.answeredAt !== null)
        .at(-1)
    : undefined
  function next() {
    const q =
      items.find(
        (q) => q.answeredAt === null && q.position > (question?.position ?? -1)
      ) ?? items.find((q) => q.answeredAt === null)
    if (q) session.navigate(q.id)
  }
  return (
    <div className="mx-auto min-w-0 max-w-2xl space-y-6">
      <nav
        aria-label="Điều hướng bài luyện"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <Link
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          href="/learn/grammar"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về ngữ pháp
        </Link>
        <Link
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          href={grammarHistoryHref(profileId)}
        >
          <History className="size-4" aria-hidden="true" />
          Lịch sử luyện
        </Link>
      </nav>
      {current.current?.profile.id !== profileId ? (
        <p className="text-sm text-muted-foreground">
          Bài luyện này thuộc hồ sơ học khác.
        </p>
      ) : null}
      {session.status === "loading" ? (
        <CatalogLoading label="Đang tải bài đã lưu…" />
      ) : null}
      {session.error?.status === 404 ? (
        <ContentUnavailable title="Không tìm thấy bài luyện">
          Mở lịch sử để chọn bài khác.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={session.error}
          onRetry={() => void session.reload()}
        />
      )}
      {session.notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {session.notice}
        </p>
      ) : null}
      {session.status === "saving" || session.status === "recovering" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {session.status === "saving"
            ? "Đang lưu…"
            : "Đang kiểm tra bài đã lưu…"}
        </p>
      ) : null}
      {detail && session.error?.status !== 404 ? (
        ended ? (
          <section className="space-y-5">
            <h2
              ref={results}
              tabIndex={-1}
              className="rounded-sm text-2xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {detail.session.status === "Completed"
                ? "Đã hoàn thành"
                : "Đã kết thúc sớm"}
            </h2>
            <p className="text-sm leading-7">
              {detail.session.correctCount} đúng ·{" "}
              {detail.session.incorrectCount} chưa đúng ·{" "}
              {detail.session.unansweredCount} chưa trả lời
              <br />
              {detail.session.accuracyPercentage === null
                ? "Chưa có câu trả lời để tính độ chính xác."
                : `Độ chính xác: ${detail.session.accuracyPercentage}%`}
            </p>
            <h3 className="text-base font-semibold">Xem lại bài</h3>
            <ol className="divide-y divide-border">
              {items.map((q) => (
                <li key={q.id} className="py-5">
                  <GrammarQuestion
                    question={q}
                    languageCode={languageCode}
                    count={detail.session.questionCount}
                    disabled
                    reviewOnly
                    onSubmit={() => {}}
                    onNext={() => {}}
                  />
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold">Luyện ngữ pháp</h2>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tiến độ bài luyện</span>
              <span>
                {detail.session.answeredCount} / {detail.session.questionCount} câu
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Số câu đã trả lời"
              aria-valuenow={detail.session.answeredCount}
              aria-valuemin={0}
              aria-valuemax={detail.session.questionCount}
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{
                  width: `${(detail.session.answeredCount / Math.max(detail.session.questionCount, 1)) * 100}%`,
                }}
              />
            </div>
            {question ? (
              <GrammarQuestion
                key={`${question.id}:${question.answeredAt}:${detail.session.version}`}
                question={question}
                languageCode={languageCode}
                count={detail.session.questionCount}
                disabled={busy}
                onSubmit={(index) =>
                  void session.mutate({
                    kind: "answer",
                    questionId: question.id,
                    selectedOptionIndex: index,
                  })
                }
                onNext={next}
                onPrevious={
                  previous ? () => session.navigate(previous.id) : undefined
                }
              />
            ) : (
              <Button disabled={busy} onClick={() => void session.reload()}>
                Tải lại bài
              </Button>
            )}
            <Dialog
              open={confirm}
              onOpenChange={(open) => {
                if (!busy) setConfirm(open)
              }}
            >
              <DialogTrigger
                render={<Button variant="ghost" disabled={busy} />}
              >
                Kết thúc bài
              </DialogTrigger>
              <DialogContent className="max-w-md p-5 sm:p-6">
                <DialogTitle className="text-lg font-semibold">
                  Kết thúc bài luyện?
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                  Câu đã trả lời vẫn được lưu. Bạn sẽ không thể trả lời tiếp bài
                  này. Để tiếp tục sau, hãy quay về ngữ pháp.
                </DialogDescription>
                <div className="flex flex-wrap justify-end gap-2">
                  <DialogClose
                    render={<Button variant="outline" disabled={busy} />}
                  >
                    Luyện tiếp
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => {
                      setConfirm(false)
                      void session.mutate({ kind: "abandon" })
                    }}
                  >
                    Kết thúc bài
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        )
      ) : null}
    </div>
  )
}
function GrammarQuestion({
  question,
  languageCode,
  count,
  disabled,
  reviewOnly,
  onSubmit,
  onNext,
  onPrevious,
}: {
  question: GrammarPracticeQuestion
  languageCode?: string
  count: number
  disabled: boolean
  reviewOnly?: boolean
  onSubmit: (index: number) => void
  onNext: () => void
  onPrevious?: () => void
}) {
  const [before, after] = question.prompt.split("{blank}")
  return (
    <PracticeQuestion
      question={question}
      questionCount={count}
      disabled={disabled}
      reviewOnly={reviewOnly}
      onSubmit={onSubmit}
      onNext={onNext}
      onPrevious={onPrevious}
      presentation={{
        optionLanguage: languageCode,
        prompt: (
          <p
            lang={languageCode}
            className={cn(
              "whitespace-pre-wrap break-words py-4 text-xl leading-loose sm:text-2xl",
              languageCode === "ja" && "font-ja"
            )}
          >
            {before}
            <span
              aria-label="Chỗ trống"
              className="mx-1.5 inline-flex min-h-7 min-w-16 items-center justify-center rounded border-b-2 border-primary bg-muted/70 px-2.5 py-0.5 align-baseline text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              ...
            </span>
            {after}
          </p>
        ),
        instruction: (
          <span lang={question.translationLocale}>
            {question.instruction}
            {question.isTranslationFallback ? (
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Bản dịch · {languageLabel(question.translationLocale)}
              </span>
            ) : null}
          </span>
        ),
        explanation:
          question.explanation !== null ? (
            <p
              lang={question.translationLocale}
              className={cn(
                "whitespace-pre-line break-words text-sm leading-7 text-muted-foreground",
                question.translationLocale === "ja" && "font-ja"
              )}
            >
              {question.explanation}
            </p>
          ) : undefined,
      }}
    />
  )
}
