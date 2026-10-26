"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { FoundationsError } from "../api/language-foundations-errors"

export function CatalogFeedback({
  error,
  onRetry,
}: {
  error: FoundationsError | null
  onRetry: () => void
}) {
  const [elapsed, setElapsed] = useState<number>()
  useEffect(() => {
    if (!error?.retryAt) return
    const deadline = error.retryAt
    let timer: number
    function schedule() {
      const delay = deadline - Date.now()
      if (delay <= 0) setElapsed(deadline)
      else timer = window.setTimeout(schedule, Math.min(delay, 2_147_483_647))
    }
    timer = window.setTimeout(
      schedule,
      Math.max(0, Math.min(deadline - Date.now(), 2_147_483_647))
    )
    return () => window.clearTimeout(timer)
  }, [error])
  if (!error) return null
  const waiting = error.retryAt !== undefined && error.retryAt !== elapsed
  return (
    <div className="space-y-3 py-4">
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
      <Button
        type="button"
        variant="outline"
        disabled={waiting}
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  )
}

export function CatalogLoading({ label }: { label: string }) {
  return (
    <div role="status" className="space-y-3 py-5 animate-pulse">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="h-4 w-1/3 rounded-sm bg-muted" aria-hidden="true" />
      <div className="h-3 w-1/2 rounded-sm bg-muted" aria-hidden="true" />
    </div>
  )
}

export function ContentUnavailable({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 border-y border-border py-6">
      <h2 className="text-base font-medium">{title}</h2>
      <div className="max-w-xl text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </div>
  )
}
