"use client"

import { useEffect } from "react"
import { Circle, CircleCheck, CircleDot, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CatalogFeedback,
  CatalogLoading,
} from "@/features/language-foundations/components/catalog-feedback"
import type {
  WritingProgressAction,
  WritingSystemItemProgress,
} from "../api/learning-progress-schemas"
import type { ItemOperation } from "../hooks/use-writing-progress"

export function CharacterProgressActions({
  itemId,
  progress,
  operation,
  loadItem,
  onAction,
}: {
  itemId: string
  progress: WritingSystemItemProgress | undefined
  operation: ItemOperation | undefined
  loadItem: (id: string, force?: boolean) => Promise<void>
  onAction: (id: string, action: WritingProgressAction) => Promise<void>
}) {
  useEffect(() => {
    void loadItem(itemId)
  }, [itemId, loadItem])
  const pending =
    operation?.status === "saving" || operation?.status === "reading"
  const isSaving = operation?.status === "saving"
  const status = progress?.status
  const unavailable = !progress || pending || operation?.requiresRead
  return (
    <section
      className="space-y-3 border-t border-border pt-4"
      aria-label="Learning progress"
      aria-busy={pending}
    >
      <h2 className="text-sm font-medium">Learning progress</h2>
      {!progress && !operation?.error ? (
        <CatalogLoading label="Loading character progress..." />
      ) : null}
      {progress ? (
        <div className="space-y-2.5 rounded-lg border border-border bg-surface-subtle p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Status
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === "Completed" && "bg-success-subtle text-success",
                status === "Learning" && "bg-primary/10 text-primary",
                status === "NotStarted" && "bg-muted text-muted-foreground"
              )}
            >
              {status === "Completed" ? (
                <CircleCheck className="size-3.5" aria-hidden="true" />
              ) : status === "Learning" ? (
                <CircleDot className="size-3.5" aria-hidden="true" />
              ) : (
                <Circle className="size-3.5" aria-hidden="true" />
              )}
              {status === "Completed"
                ? "Learned through"
                : status === "Learning"
                  ? "Learning"
                  : "Not started"}
            </span>
          </div>
          {progress.completedAt || progress.lastStudiedAt ? (
            <div className="space-y-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
              {progress.completedAt ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Learned through</span>
                  <ProgressTime value={progress.completedAt} />
                </div>
              ) : null}
              {progress.lastStudiedAt ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Last studied</span>
                  <ProgressTime value={progress.lastStudiedAt} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <CatalogFeedback
        error={operation?.error ?? null}
        onRetry={() => void loadItem(itemId, true)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={unavailable}
          onClick={() => void onAction(itemId, "Study")}
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {status === "Completed"
            ? "Record another study"
            : status === "Learning"
              ? "Record study"
              : "Start learning"}
        </Button>
        {status === "Completed" ? (
          <Button
            variant="ghost"
            disabled={unavailable}
            onClick={() => void onAction(itemId, "Restart")}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Restart learning
          </Button>
        ) : (
          <Button
            disabled={unavailable}
            onClick={() => void onAction(itemId, "Complete")}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Mark as learned
          </Button>
        )}
      </div>
      <p role="status" className="text-xs leading-5 text-muted-foreground">
        {operation?.status === "saving"
          ? "Saving progress..."
          : operation?.status === "reading"
            ? "Checking latest progress..."
            : (operation?.notice ??
              "Learned through means you've chosen to mark this character as learned, not a measure of memorization.")}
      </p>
    </section>
  )
}

function ProgressTime({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))}
    </time>
  )
}
