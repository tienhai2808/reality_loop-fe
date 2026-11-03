"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, CircleAlert, CircleCheck, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WritingPracticeQuestion } from "../api/practice-schemas"

export function PracticeQuestion({
  question,
  languageCode,
  questionCount,
  disabled,
  onSubmit,
  onNext,
  onPrevious,
}: {
  question: WritingPracticeQuestion
  languageCode?: string
  questionCount: number
  disabled: boolean
  onSubmit: (selectedOptionIndex: number) => void
  onNext: () => void
  onPrevious?: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const groupId = useId()
  const heading = useRef<HTMLHeadingElement | null>(null)
  const feedback = useRef<HTMLDivElement | null>(null)
  const answered = question.answeredAt !== null
  useEffect(() => {
    if (answered) feedback.current?.focus()
    else heading.current?.focus()
  }, [answered, question.id])
  return (
    <div className="space-y-6">
      <h2
        ref={heading}
        tabIndex={-1}
        className="rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Question {question.position + 1} of {questionCount}
      </h2>
      <p
        lang={languageCode}
        className="font-ja break-all py-4 text-center text-7xl leading-relaxed sm:text-8xl"
      >
        {question.symbol}
      </p>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!answered && selected !== null && !disabled) onSubmit(selected)
        }}
      >
        <fieldset disabled={disabled || answered} className="space-y-3">
          <legend className="mb-3 text-base font-medium">
            How is this character read?
          </legend>
          {question.options.map((option, index) => {
            const chosen = answered
              ? question.selectedOptionIndex === index
              : selected === index
            const isCorrectOption = answered && question.correctOptionIndex === index
            const isWrongChoice = answered && chosen && !question.isCorrect
            return (
              <label
                key={`${question.id}:${index}`}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-base outline-none transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring motion-reduce:transition-none",
                  !answered && chosen && "border-primary bg-muted ring-1 ring-primary",
                  answered && isCorrectOption && "border-success/60 bg-success-subtle text-foreground",
                  answered && isWrongChoice && "border-warning/60 bg-warning-subtle text-foreground",
                  answered && !isCorrectOption && !isWrongChoice && "opacity-60",
                  (answered || disabled) && "cursor-default"
                )}
              >
                <input
                  className="size-4 shrink-0 accent-primary"
                  type="radio"
                  name={groupId}
                  value={index}
                  checked={chosen}
                  onChange={() => setSelected(index)}
                />
                <span className="min-w-0 flex-1 break-words font-medium">{option}</span>
                {isCorrectOption ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                    <Check className="size-4" aria-hidden="true" />
                    Correct reading
                  </span>
                ) : isWrongChoice ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-warning">
                    <Minus className="size-4" aria-hidden="true" />
                    Your answer
                  </span>
                ) : null}
              </label>
            )
          })}
        </fieldset>
        <p className="text-xs text-muted-foreground">
          Transcription: {question.transcriptionSystem}
        </p>
        {answered ? (
          <div
            ref={feedback}
            tabIndex={-1}
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              question.isCorrect
                ? "border-success/30 bg-success-subtle/70"
                : "border-warning/40 bg-warning-subtle/70"
            )}
          >
            {question.isCorrect ? (
              <CircleCheck
                className="mt-0.5 size-5 shrink-0 text-success"
                aria-hidden="true"
              />
            ) : (
              <CircleAlert
                className="mt-0.5 size-5 shrink-0 text-warning"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold">
                {question.isCorrect ? "Correct" : "Not quite"}
              </p>
              <p className="break-words text-sm text-muted-foreground">
                Your answer:{" "}
                <span className="font-medium text-foreground">
                  {question.selectedOptionIndex !== null
                    ? question.options[question.selectedOptionIndex]
                    : "None"}
                </span>
              </p>
              {!question.isCorrect && question.correctOptionIndex !== null ? (
                <p className="break-words text-sm text-muted-foreground">
                  Correct reading:{" "}
                  <span className="font-medium text-foreground">
                    {question.options[question.correctOptionIndex]}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-between gap-3">
          {onPrevious ? (
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={onPrevious}
            >
              Previous answer
            </Button>
          ) : (
            <span />
          )}
          {answered ? (
            <Button type="button" disabled={disabled} onClick={onNext}>
              Next question
            </Button>
          ) : (
            <Button type="submit" disabled={disabled || selected === null}>
              Check answer
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
