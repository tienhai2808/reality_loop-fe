import { Check, CircleAlert, Clock3 } from "lucide-react"

import { cn } from "@/lib/utils"
import { aiFailureMessages } from "../api/ai-errors"
import type { AiConnectionDto } from "../api/ai-schemas"

export function AiConnectionStatus({
  connection,
}: {
  connection: AiConnectionDto
}) {
  const { status, retryAfterAt, lastFailureCode, isEnabled } = connection
  const Icon =
    status === "Ready" ? Check : status === "CoolingDown" ? Clock3 : CircleAlert
  const label =
    status === "Ready"
      ? "Ready"
      : status === "CoolingDown"
        ? "Temporarily unavailable"
        : "Needs attention"
  return (
    <div className="space-y-1 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-muted-foreground">
          {isEnabled ? "Enabled" : "Disabled"}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1",
            status === "Ready" ? "text-success" : "text-warning"
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {label}
        </span>
      </div>
      {status === "NeedsAttention" && lastFailureCode ? (
        <p className="text-muted-foreground">
          {aiFailureMessages[lastFailureCode]}
        </p>
      ) : null}
      {status === "CoolingDown" && retryAfterAt ? (
        <p className="text-muted-foreground">
          Retry available{" "}
          <time dateTime={retryAfterAt}>{formatAiTime(retryAfterAt)}</time>
        </p>
      ) : null}
    </div>
  )
}

export function formatAiTime(value: string | number) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}
