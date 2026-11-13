"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Check, Minus } from "lucide-react"
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
  presentation,
  reviewOnly = false,
}: {
  question: Pick<
    WritingPracticeQuestion,
    | "id"
    | "position"
    | "answeredAt"
    | "options"
    | "selectedOptionIndex"
    | "correctOptionIndex"
    | "isCorrect"
  > & { symbol?: string }
  presentation?: {
    prompt: ReactNode
    instruction: ReactNode
    explanation?: ReactNode
    optionLanguage?: string
  }
  reviewOnly?: boolean
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
  const feedback = useRef<HTMLParagraphElement | null>(null)
  const answered = question.answeredAt !== null
  useEffect(() => {
    if (reviewOnly) return
    if (answered) feedback.current?.focus()
    else heading.current?.focus()
  }, [answered, question.id, reviewOnly])
  return (
    <div className="space-y-3">
      <h2
        ref={heading}
        tabIndex={-1}
        className="rounded-sm text-sm font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Câu {question.position + 1}/{questionCount}
      </h2>
      {presentation ? (
        presentation.prompt
      ) : (
        <p
          lang={languageCode}
          className="font-ja break-all py-1 text-center text-7xl leading-relaxed sm:text-8xl"
        >
          {question.symbol}
        </p>
      )}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!answered && selected !== null && !disabled) onSubmit(selected)
        }}
      >
        <fieldset
          disabled={disabled || answered || reviewOnly}
          className="space-y-2"
        >
          <legend className="mb-2 text-base font-medium">
            {presentation ? presentation.instruction : "Chữ này đọc thế nào?"}
          </legend>
          {question.options.map((option, index) => {
            const chosen = answered
              ? question.selectedOptionIndex === index
              : selected === index
            const isCorrectOption =
              answered && question.correctOptionIndex === index
            const isWrongChoice = answered && chosen && !question.isCorrect
            return (
              <label
                key={`${question.id}:${index}`}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-base outline-none transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring motion-reduce:transition-none",
                  !answered &&
                    chosen &&
                    "border-primary bg-muted ring-1 ring-primary",
                  answered &&
                    isCorrectOption &&
                    "border-success/60 bg-success-subtle text-foreground",
                  answered &&
                    isWrongChoice &&
                    "border-warning/60 bg-warning-subtle text-foreground",
                  answered &&
                    !isCorrectOption &&
                    !isWrongChoice &&
                    "opacity-60",
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
                <span
                  lang={presentation?.optionLanguage}
                  className="min-w-0 flex-1 break-words font-medium"
                >
                  {option}
                </span>
                {isCorrectOption ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                    <Check className="size-4" aria-hidden="true" />
                    Đúng
                  </span>
                ) : isWrongChoice ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-warning">
                    <Minus className="size-4" aria-hidden="true" />
                    Bạn chọn
                  </span>
                ) : null}
              </label>
            )
          })}
        </fieldset>
        {answered ? (
          <p
            ref={feedback}
            tabIndex={-1}
            role="status"
            className="rounded-sm text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {question.isCorrect
              ? "Đúng"
              : question.correctOptionIndex === null
                ? "Chưa đúng"
                : `Chưa đúng. ${presentation ? "Đáp án" : "Cách đọc"}: ${question.options[question.correctOptionIndex]}`}
          </p>
        ) : null}
        {answered && presentation?.explanation}
        {reviewOnly && !answered ? (
          <p className="text-sm text-muted-foreground">Chưa trả lời</p>
        ) : null}
        {!reviewOnly ? (
          <div className="flex flex-wrap justify-between gap-3">
            {onPrevious ? (
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                onClick={onPrevious}
              >
                Câu trước
              </Button>
            ) : (
              <span />
            )}
            {answered ? (
              <Button type="button" disabled={disabled} onClick={onNext}>
                Câu tiếp
              </Button>
            ) : (
              <Button type="submit" disabled={disabled || selected === null}>
                Kiểm tra
              </Button>
            )}
          </div>
        ) : null}
      </form>
    </div>
  )
}
