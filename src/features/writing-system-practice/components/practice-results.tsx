"use client"

import Link from "next/link"
import { Circle, CircleAlert, CircleCheck } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WritingSystemDto } from "@/features/language-foundations/api/language-foundations-schemas"
import type { WritingPracticeDetail } from "../api/practice-schemas"
import { StartPracticeDialog } from "./start-practice-dialog"
import { practiceHistoryHref } from "../model/practice-handoff"

export function PracticeResults({
  detail,
  languageCode,
  system,
  allowPracticeAgain,
}: {
  detail: WritingPracticeDetail
  languageCode?: string
  system?: WritingSystemDto
  allowPracticeAgain: boolean
}) {
  const { session } = detail
  const items = [...detail.items].sort((a, b) => a.position - b.position)
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight">
            {session.status === "Completed"
              ? "Practice completed"
              : "Practice ended early"}
          </h1>
          {session.endedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Ended{" "}
              <time dateTime={session.endedAt}>
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(session.endedAt))}
              </time>
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="space-y-1 rounded-lg border border-border bg-surface-subtle p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Score</p>
            <p className="text-xl font-semibold tracking-tight">
              {session.correctCount}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {session.questionCount}
              </span>
            </p>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-surface-subtle p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Accuracy</p>
            <p className="text-xl font-semibold tracking-tight">
              {session.accuracyPercentage !== null
                ? `${session.accuracyPercentage}%`
                : "—"}
            </p>
          </div>
          <div className="col-span-2 space-y-1 rounded-lg border border-border bg-surface-subtle p-3.5 sm:col-span-1">
            <p className="text-xs font-medium text-muted-foreground">Breakdown</p>
            <p className="text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">
                {session.answeredCount}
              </span>{" "}
              answered ·{" "}
              <span className="font-medium text-foreground">
                {session.incorrectCount}
              </span>{" "}
              incorrect
            </p>
          </div>
        </div>
      </header>
      <section className="space-y-3" aria-labelledby="practice-review-heading">
        <h2 id="practice-review-heading" className="text-base font-semibold">
          Review answers
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          {items.map((question) => (
            <li key={question.id} className="flex gap-4 py-4">
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
                          <CircleCheck className="size-3.5" aria-hidden="true" />
                        ) : (
                          <CircleAlert className="size-3.5" aria-hidden="true" />
                        )}
                        {question.isCorrect ? "Correct" : "Not quite"}
                      </span>
                    </div>
                    <p className="break-words text-muted-foreground">
                      Your answer:{" "}
                      <span className="font-medium text-foreground">
                        {question.selectedOptionIndex !== null
                          ? question.options[question.selectedOptionIndex]
                          : ""}
                      </span>
                    </p>
                    {!question.isCorrect && question.correctOptionIndex !== null ? (
                      <p className="break-words text-muted-foreground">
                        Correct reading:{" "}
                        <span className="font-medium text-foreground">
                          {question.options[question.correctOptionIndex]}
                        </span>
                      </p>
                    ) : null}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Circle className="size-3.5" aria-hidden="true" />
                    Not answered
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        {system && allowPracticeAgain ? (
          <StartPracticeDialog
            profileId={session.learningProfileId}
            systemCode={system.code}
            systemName={system.name}
            label="Practice again"
          />
        ) : null}
        {!system ? (
          <p className="w-full text-sm text-muted-foreground">
            Saved results remain available. Choose a published writing system to
            start another practice.
          </p>
        ) : null}
        <Link
          href="/learn/writing-systems"
          className={buttonVariants({ variant: "outline" })}
        >
          Return to Writing Systems
        </Link>
        <Link
          href={practiceHistoryHref()}
          className={buttonVariants({ variant: "ghost" })}
        >
          View practice history
        </Link>
      </div>
    </div>
  )
}
