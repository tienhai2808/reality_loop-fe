"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import type { WritingPracticeDetail } from "../api/practice-schemas"
import { usePracticeSession } from "../hooks/use-practice-session"
import { usePracticeCatalog } from "../hooks/use-practice-catalog"
import {
  practiceHistoryHref,
  usePracticeHandoff,
} from "../model/practice-handoff"
import { PracticeQuestion } from "./practice-question"
import { PracticeResults } from "./practice-results"

export function PracticeSessionView({
  profileId,
  sessionId,
}: {
  profileId: string
  sessionId: string
}) {
  const { state } = useAuth()
  const handoff = usePracticeHandoff()
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
      clearHandoff={handoff.clear}
    />
  )
}
function SessionContent({
  profileId,
  sessionId,
  initial,
  clearHandoff,
}: {
  profileId: string
  sessionId: string
  initial: WritingPracticeDetail | null
  clearHandoff: () => void
}) {
  const search = useSearchParams()
  const session = usePracticeSession(profileId, sessionId, initial)
  const { profile, systems } = usePracticeCatalog(profileId)
  const { state: current } = useCurrentLearningProfile()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const resultsHeading = useRef<HTMLDivElement | null>(null)
  const detail = session.detail
  const ended = detail?.session.status !== "InProgress"
  useEffect(() => {
    if (initial) clearHandoff()
  }, [initial, clearHandoff])
  useEffect(() => {
    if (detail && ended) resultsHeading.current?.focus()
  }, [detail, ended])
  const busy = session.status !== "ready"
  const system = systems.data?.items.find(
    (entry) => entry.id === detail?.session.writingSystemId
  )
  const returnQuery = new URLSearchParams()
  if (system) returnQuery.set("system", system.code)
  const character = search.get("character")
  if (character) returnQuery.set("character", character)
  const returnHref = `/learn/writing-systems${returnQuery.size ? `?${returnQuery}` : ""}`
  const historyHref =
    current.current?.profile.id === profileId
      ? `/learn/writing-systems?${new URLSearchParams({ ...Object.fromEntries(returnQuery), history: "recognition" })}`
      : practiceHistoryHref()
  const items = [...(detail?.items ?? [])].sort(
    (a, b) => a.position - b.position
  )
  const question = items.find((item) => item.id === session.questionId)
  const previous = question
    ? items
        .filter(
          (item) =>
            item.position < question.position && item.answeredAt !== null
        )
        .at(-1)
    : undefined
  function next() {
    const nextQuestion =
      items.find(
        (item) =>
          item.answeredAt === null && item.position > (question?.position ?? -1)
      ) ?? items.find((item) => item.answeredAt === null)
    if (nextQuestion) session.navigate(nextQuestion.id)
  }
  return (
    <div className="mx-auto min-w-0 max-w-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={returnHref}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về bảng chữ
        </Link>
        <Link
          href={historyHref}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <History className="size-3.5" aria-hidden="true" />
          Lịch sử luyện nhận diện
        </Link>
      </div>
      {current.current?.profile.id !== profileId ? (
        <p className="border-y border-border py-3 text-sm leading-6 text-muted-foreground">
          Bài luyện này thuộc hồ sơ học khác.
        </p>
      ) : null}
      {session.status === "loading" ? (
        <CatalogLoading label="Đang tải bài luyện đã lưu…" />
      ) : null}
      {session.error?.status === 404 ? (
        <ContentUnavailable title="Không tìm thấy bài luyện">
          Bài luyện này hiện không có. Mở lịch sử để chọn bài khác.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={session.error}
          onRetry={() => void session.reload()}
        />
      )}
      {session.notice ? (
        <p role="status" className="text-sm leading-6 text-muted-foreground">
          {session.notice}
        </p>
      ) : null}
      {session.status === "saving" || session.status === "recovering" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {session.status === "saving"
            ? "Đang lưu bài…"
            : "Đang kiểm tra bài đã lưu…"}
        </p>
      ) : null}
      {detail && session.error?.status !== 404 ? (
        !items.length ? (
          <ContentUnavailable title="Không có câu hỏi">
            Về Bảng chữ hoặc chọn bài khác trong lịch sử.
          </ContentUnavailable>
        ) : ended ? (
          <div
            ref={resultsHeading}
            tabIndex={-1}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PracticeResults
              detail={detail}
              languageCode={profile.data?.targetLanguage}
              system={system}
              allowPracticeAgain={!busy}
              returnHref={returnHref}
              historyHref={historyHref}
            />
          </div>
        ) : (
          <>
            <header className="space-y-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {system
                  ? `Luyện nhận diện ${system.name}`
                  : "Luyện nhận diện chữ"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Đã trả lời {detail.session.answeredCount}/
                {detail.session.questionCount} câu
              </p>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Số câu đã trả lời"
                aria-valuenow={detail.session.answeredCount}
                aria-valuemin={0}
                aria-valuemax={detail.session.questionCount}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                  style={{
                    width: `${detail.session.questionCount > 0 ? (detail.session.answeredCount / detail.session.questionCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </header>
            {question ? (
              <PracticeQuestion
                key={`${question.id}:${question.answeredAt}:${detail.session.version}`}
                question={question}
                languageCode={profile.data?.targetLanguage}
                questionCount={detail.session.questionCount}
                disabled={busy}
                onSubmit={(selectedOptionIndex) =>
                  void session.mutate({
                    kind: "answer",
                    questionId: question.id,
                    selectedOptionIndex,
                  })
                }
                onNext={next}
                onPrevious={
                  previous ? () => session.navigate(previous.id) : undefined
                }
              />
            ) : (
              <ContentUnavailable title="Đã trả lời hết">
                Tải lại bài để kiểm tra kết quả mới nhất.
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void session.reload()}
                >
                  Tải lại bài
                </Button>
              </ContentUnavailable>
            )}
            <div className="border-t border-border pt-4">
              <Dialog
                open={confirmEnd}
                onOpenChange={(open) => {
                  if (!busy) setConfirmEnd(open)
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
                    Câu đã trả lời vẫn được lưu. Nếu muốn làm tiếp sau, hãy quay
                    về Bảng chữ.
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
                        setConfirmEnd(false)
                        void session.mutate({ kind: "abandon" })
                      }}
                    >
                      Kết thúc bài
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )
      ) : null}
    </div>
  )
}
