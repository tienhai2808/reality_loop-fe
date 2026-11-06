"use client"

import Link from "next/link"
import { Circle, CircleAlert, CircleCheck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WritingSystemDto } from "@/features/language-foundations/api/language-foundations-schemas"
import type { WritingPracticeDetail } from "../api/practice-schemas"
import { StartPracticePopover } from "./start-practice-popover"

export function PracticeResults({
  detail,
  languageCode,
  system,
  allowPracticeAgain,
  returnHref,
  historyHref,
}: {
  detail: WritingPracticeDetail
  languageCode?: string
  system?: WritingSystemDto
  allowPracticeAgain: boolean
  returnHref: string
  historyHref: string
}) {
  const { session } = detail
  const items = [...detail.items].sort((a, b) => a.position - b.position)
  const missed = items.filter((question) => question.isCorrect === false)
  const remaining = items.filter((question) => question.isCorrect !== false)
  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <div>
          <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight">
            {session.status === "Completed"
              ? "Đã hoàn thành"
              : "Đã kết thúc sớm"}
          </h1>
          {session.endedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Kết thúc{" "}
              <time dateTime={session.endedAt}>
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(session.endedAt))}
              </time>
            </p>
          ) : null}
        </div>

        <p className="border-b border-border pb-2 text-sm text-muted-foreground">
          <strong className="text-foreground">
            {session.correctCount}/{session.questionCount} câu đúng
          </strong>
          {" · "}
          {session.answeredCount} câu đã trả lời
        </p>
      </header>
      <section className="space-y-3" aria-labelledby="practice-review-heading">
        <h2 id="practice-review-heading" className="text-base font-semibold">
          Xem lại đáp án
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          {[...missed, ...remaining].map((question) => (
            <li key={question.id} className="flex gap-3 py-2">
              <span
                lang={languageCode}
                className="font-ja w-16 shrink-0 break-all text-center text-3xl leading-relaxed font-medium"
              >
                {question.symbol}
              </span>
              <div className="min-w-0 space-y-1.5 text-sm">
                {question.answeredAt !== null ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          question.isCorrect
                            ? "bg-success-subtle text-success"
                            : "bg-warning-subtle text-warning"
                        )}
                      >
                        {question.isCorrect ? (
                          <CircleCheck
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <CircleAlert
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        )}
                        {question.isCorrect ? "Đúng" : "Chưa đúng"}
                      </span>
                    </div>
                    <p className="break-words text-muted-foreground">
                      Bạn chọn:{" "}
                      <span className="font-medium text-foreground">
                        {question.selectedOptionIndex !== null
                          ? question.options[question.selectedOptionIndex]
                          : ""}
                      </span>
                    </p>
                    {!question.isCorrect &&
                    question.correctOptionIndex !== null ? (
                      <p className="break-words text-muted-foreground">
                        Cách đọc đúng:{" "}
                        <span className="font-medium text-foreground">
                          {question.options[question.correctOptionIndex]}
                        </span>
                      </p>
                    ) : null}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Circle className="size-3.5" aria-hidden="true" />
                    Chưa trả lời
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        {system && allowPracticeAgain ? (
          <StartPracticePopover
            profileId={session.learningProfileId}
            systemCode={system.code}
            systemName={system.name}
            label="Luyện lại"
          />
        ) : null}
        {!system ? (
          <p className="w-full text-sm text-muted-foreground">
            Bạn vẫn có thể xem kết quả đã lưu. Chọn một bảng chữ hiện có để
            luyện lại.
          </p>
        ) : null}
        <Link
          href={returnHref}
          className={buttonVariants({ variant: "outline" })}
        >
          Về bảng chữ
        </Link>
        <Link
          href={historyHref}
          className={buttonVariants({ variant: "ghost" })}
        >
          Xem lịch sử luyện
        </Link>
      </div>
    </div>
  )
}
