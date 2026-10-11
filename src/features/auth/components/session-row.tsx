import { Check, MonitorSmartphone } from "lucide-react"

import type { AuthSession } from "@/features/auth/api/auth-schemas"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SessionRow({
  session,
  selected,
  disabled,
  onSelectedChange,
  onSignOut,
}: {
  session: AuthSession
  selected: boolean
  disabled?: boolean
  onSelectedChange: (selected: boolean) => void
  onSignOut: () => void
}) {
  return (
    <div className="grid gap-3 border-t border-border py-4 md:grid-cols-[2rem_minmax(0,1fr)_auto] md:items-center">
      <label className="flex items-center md:justify-center">
        <span className="sr-only">Select {session.deviceName}</span>
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={(event) => onSelectedChange(event.currentTarget.checked)}
          className="size-4 rounded border-border accent-primary"
        />
      </label>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <MonitorSmartphone className="size-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="truncate text-sm font-medium">{session.deviceName}</h3>
          {session.isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-xs font-medium text-success">
              <Check className="size-3" aria-hidden="true" />
              Current
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.deviceType} · Last active {formatSessionDate(session.lastSeenAt)}
          {session.createdAt ? ` · Created ${formatSessionDate(session.createdAt)}` : ""}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onSignOut}
        className={cn("justify-self-start md:justify-self-end")}
      >
        Sign out
      </Button>
    </div>
  )
}

function formatSessionDate(value: string | null): string {
  if (!value) {
    return "recently"
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return "recently"
  }

  const deltaMs = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (deltaMs < minute) {
    return "now"
  }

  if (deltaMs < hour) {
    return `${Math.floor(deltaMs / minute)} minutes ago`
  }

  if (deltaMs < day) {
    return `${Math.floor(deltaMs / hour)} hours ago`
  }

  if (deltaMs < 7 * day) {
    return `${Math.floor(deltaMs / day)} days ago`
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp))
}

