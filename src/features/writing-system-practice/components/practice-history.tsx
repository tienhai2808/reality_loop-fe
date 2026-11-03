"use client"

import Link from "next/link"
import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { useCatalogPage } from "@/features/language-foundations/hooks/use-catalog"
import { cn } from "@/lib/utils"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { listWritingPractice } from "../api/practice-api"
import {
  writingPracticeStatusSchema,
  type WritingPracticeStatus,
} from "../api/practice-schemas"
import { usePracticeCatalog } from "../hooks/use-practice-catalog"
import { practiceSessionHref } from "../model/practice-handoff"

export function PracticeHistory() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const parsed = writingPracticeStatusSchema.safeParse(search.get("status"))
  const status = parsed.success ? parsed.data : undefined
  const systemCode = search.get("system") || undefined
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <HistoryContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${status}:${systemCode}`}
      profileId={profile.id}
      status={status}
      systemCode={systemCode}
    />
  )
}

const STATUS_OPTIONS = [
  { value: "all", label: "All sessions" },
  { value: "InProgress", label: "In progress" },
  { value: "Completed", label: "Completed" },
  { value: "Abandoned", label: "Ended early" },
] as const

function HistoryContent({
  profileId,
  status,
  systemCode,
}: {
  profileId: string
  status?: WritingPracticeStatus
  systemCode?: string
}) {
  const router = useRouter()
  const { profile, systems } = usePracticeCatalog(profileId)
  const loader = useCallback(
    (before: string | null, signal: AbortSignal) =>
      listWritingPractice(profileId, { status, systemCode }, before, signal),
    [profileId, status, systemCode]
  )
  // No history cache: every return after completion/abandonment reads page one again.
  const history = useCatalogPage(
    `practice-history:${profileId}:${status}:${systemCode}`,
    loader
  )
  function filter(key: "status" | "system", value: string) {
    const query = new URLSearchParams()
    if (status) query.set("status", status)
    if (systemCode) query.set("system", systemCode)
    if (value) query.set(key, value)
    else query.delete(key)
    router.push(`/learn/practice/history${query.size ? `?${query}` : ""}`, {
      scroll: false,
    })
  }
  const systemOptions = [
    { value: "all", label: "All writing systems" },
    ...(systemCode &&
    !systems.data?.items.some((system) => system.code === systemCode)
      ? [{ value: systemCode, label: "Selected writing system" }]
      : []),
    ...(systems.data?.items.map((system) => ({
      value: system.code,
      label: system.name,
    })) ?? []),
  ]

  return (
    <div className="min-w-0 max-w-3xl space-y-6">
      <Link
        href="/learn/writing-systems"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Writing Systems
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Practice history
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Continue any unfinished practice, or review your saved answers.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="practice-status" className="text-sm font-medium">
            Status
          </label>
          <Select
            items={STATUS_OPTIONS}
            value={status ?? "all"}
            onValueChange={(val) =>
              filter("status", val === "all" ? "" : val ?? "")
            }
          >
            <SelectTrigger id="practice-status">
              <SelectValue placeholder="All sessions" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="practice-system" className="text-sm font-medium">
            Writing system
          </label>
          <Select
            items={systemOptions}
            value={systemCode ?? "all"}
            onValueChange={(val) =>
              filter("system", val === "all" ? "" : val ?? "")
            }
          >
            <SelectTrigger id="practice-system">
              <SelectValue placeholder="All writing systems" />
            </SelectTrigger>
            <SelectContent>
              {systemOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {profile.status === "loading" || systems.status === "loading" ? (
        <p role="status" className="text-xs text-muted-foreground">
          Loading writing-system names...
        </p>
      ) : null}
      {systems.data?.nextCursor && !systems.error ? (
        <Button
          variant="ghost"
          disabled={systems.loadingMore}
          onClick={() => void systems.loadMore()}
        >
          More writing systems
        </Button>
      ) : null}
      {history.status === "loading" ? (
        <CatalogLoading label="Loading practice history..." />
      ) : null}
      {history.error?.status === 404 ? (
        <ContentUnavailable title="Practice history unavailable">
          This learning profile or its sessions are no longer available.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={history.error}
          onRetry={() =>
            void (history.data ? history.loadMore() : history.reload())
          }
        />
      )}
      {history.status === "ready" && !history.data.items.length ? (
        <ContentUnavailable
          title={
            status === "InProgress"
              ? "No unfinished practice"
              : "No practice sessions here yet"
          }
        >
          Start a practice from Writing Systems, or change the filters to see
          other saved sessions.
        </ContentUnavailable>
      ) : null}
      {history.data?.items.length ? (
        <ul className="divide-y divide-border border-y border-border">
          {history.data.items.map((session) => {
            const system = systems.data?.items.find(
              (entry) => entry.id === session.writingSystemId
            )
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-sm font-semibold text-foreground">
                      {system?.name ?? "Writing system practice"} ·{" "}
                      {session.questionCount} questions
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                        session.status === "Completed" && "bg-success-subtle text-success",
                        session.status === "InProgress" && "bg-primary/10 text-primary",
                        session.status === "Abandoned" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {session.status === "InProgress"
                        ? "In progress"
                        : session.status === "Completed"
                          ? "Completed"
                          : "Ended early"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={session.createdAt}>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(session.createdAt))}
                    </time>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{session.answeredCount}</span> answered ·{" "}
                    <span className="font-medium text-foreground">{session.correctCount}</span> correct
                    {session.accuracyPercentage !== null
                      ? ` · ${session.accuracyPercentage}% accuracy`
                      : ""}
                  </p>
                </div>
                <Link
                  href={practiceSessionHref(profileId, session.id)}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-md px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    session.status === "InProgress"
                      ? "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]"
                      : "border border-border bg-surface text-foreground hover:bg-muted"
                  )}
                >
                  {session.status === "InProgress"
                    ? "Continue"
                    : "View results"}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
      {history.data?.nextCursor && !history.error ? (
        <Button
          variant="outline"
          disabled={history.loadingMore}
          aria-busy={history.loadingMore}
          onClick={() => void history.loadMore()}
        >
          {history.loadingMore ? "Loading sessions..." : "Load more sessions"}
        </Button>
      ) : null}
    </div>
  )
}
