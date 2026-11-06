"use client"

import { Button } from "@/components/ui/button"
import type { LearningProfileError } from "../api/learning-profile-errors"
import { useLearningRetryWait } from "../hooks/use-learning-request"

export function LearningFeedback({
  error,
  onRetry,
  retryLabel = "Thử lại",
  pending = false,
}: {
  error: LearningProfileError | null
  onRetry?: () => void
  retryLabel?: string
  pending?: boolean
}) {
  const waiting = useLearningRetryWait(error?.retryAt)
  if (!error) return null
  return (
    <div className="space-y-2">
      <div
        role="alert"
        className="space-y-1 text-sm leading-6 text-destructive"
      >
        <p>{error.message}</p>
        {error.retryAt ? (
          <p>
            Thử lại sau{" "}
            {new Intl.DateTimeFormat("vi-VN", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            }).format(new Date(error.retryAt))}
            .
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          disabled={waiting || pending}
          aria-busy={pending}
          onClick={onRetry}
        >
          {pending ? "Đang tải lại…" : retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
