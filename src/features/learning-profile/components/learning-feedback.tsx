"use client"

import { Button } from "@/components/ui/button"
import type { LearningProfileError } from "../api/learning-profile-errors"
import { useLearningRetryWait } from "../hooks/use-learning-request"

export function LearningFeedback({
  error,
  onRetry,
  retryLabel = "Try again",
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
            Try again after{" "}
            {new Intl.DateTimeFormat("en", {
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
          {pending ? "Refreshing..." : retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
