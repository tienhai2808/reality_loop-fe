"use client"

import Link from "next/link"
import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import { usePracticeCatalog } from "@/features/writing-system-practice/hooks/use-practice-catalog"
import { listHandwritingAttempts } from "../api/handwriting-api"
import { handwritingAttemptHref } from "../lib/handwriting-labels"

export function HandwritingHistory({ profileId }: { profileId: string }) {
  const { state } = useAuth()
  const { state: current } = useCurrentLearningProfile()
  if (state.status !== "authenticated") return null
  return (
    <HistoryContent
      key={`${state.user.id}:${state.sessionId}:${profileId}:${current.current?.profile.id}`}
      profileId={profileId}
      otherProfile={current.current?.profile.id !== profileId}
    />
  )
}
function HistoryContent({
  profileId,
  otherProfile,
}: {
  profileId: string
  otherProfile: boolean
}) {
  const search = useSearchParams()
  const router = useRouter()
  const systemCode = search.get("system") || undefined
  const passed =
    search.get("passed") === "true"
      ? true
      : search.get("passed") === "false"
        ? false
        : undefined
  const { profile, systems } = usePracticeCatalog(profileId)
  const loader = useCallback(
    (before: string | null, signal: AbortSignal) =>
      listHandwritingAttempts(
        profileId,
        { systemCode, passed },
        before,
        signal
      ),
    [profileId, systemCode, passed]
  )
  const history = useCatalogPage(
    `handwriting-history:${profileId}:${systemCode}:${passed}`,
    loader
  )
  function filter(key: "system" | "passed", value: string) {
    const query = new URLSearchParams()
    if (systemCode) query.set("system", systemCode)
    if (passed !== undefined) query.set("passed", String(passed))
    if (value) query.set(key, value)
    else query.delete(key)
    router.push(
      `/learn/handwriting/${encodeURIComponent(profileId)}/history${query.size ? `?${query}` : ""}`,
      { scroll: false }
    )
  }
  const resultOptions = [
    { value: "all", label: "All results" },
    { value: "true", label: "Passed" },
    { value: "false", label: "Needs improvement" },
  ] as const
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
          Handwriting history
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.data
            ? `${languageLabel(profile.data.targetLanguage)} · `
            : ""}
          Review your submitted drawings and saved feedback.
        </p>
        {otherProfile ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Showing saved handwriting history for a different learning profile.
          </p>
        ) : null}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="handwriting-history-passed"
            className="text-sm font-medium"
          >
            Result
          </label>
          <Select
            items={resultOptions}
            value={passed === undefined ? "all" : String(passed)}
            onValueChange={(val) =>
              filter("passed", val === "all" ? "" : val ?? "")
            }
          >
            <SelectTrigger id="handwriting-history-passed">
              <SelectValue placeholder="All results" />
            </SelectTrigger>
            <SelectContent>
              {resultOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="handwriting-history-system"
            className="text-sm font-medium"
          >
            Writing system
          </label>
          <Select
            items={systemOptions}
            value={systemCode ?? "all"}
            onValueChange={(val) =>
              filter("system", val === "all" ? "" : val ?? "")
            }
          >
            <SelectTrigger id="handwriting-history-system">
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
        <CatalogLoading label="Loading handwriting attempts..." />
      ) : null}
      {history.error?.status === 404 ? (
        <ContentUnavailable title="Handwriting history unavailable">
          This profile or its saved attempts are no longer available.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={history.error}
          onRetry={() =>
            void (history.data?.nextCursor && history.error?.status !== 400
              ? history.loadMore()
              : history.reload())
          }
        />
      )}
      {history.status === "ready" && !history.data.items.length ? (
        <ContentUnavailable title="No handwriting attempts here yet">
          Try a character from Writing Systems, or change the filters to see
          other attempts.
        </ContentUnavailable>
      ) : null}
      {history.data?.items.length && history.error?.status !== 404 ? (
        <ul className="divide-y divide-border border-y border-border">
          {history.data.items.map((attempt) => (
            <li
              key={attempt.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    lang={profile.data?.targetLanguage}
                    className="font-ja break-all text-2xl font-medium leading-relaxed"
                  >
                    {attempt.targetText}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                      attempt.passed
                        ? "bg-success-subtle text-success"
                        : "bg-warning-subtle text-warning"
                    )}
                  >
                    {attempt.passed ? "Passed" : "Needs improvement"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {systems.data?.items.find(
                    (system) => system.id === attempt.writingSystemId
                  )?.name ?? "Writing system"}{" "}
                  · Shape match {attempt.matchScore} / 100
                </p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={attempt.createdAt}>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(attempt.createdAt))}
                  </time>
                </p>
              </div>
              <Link
                href={handwritingAttemptHref(profileId, attempt.id)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View drawing
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {history.data?.nextCursor && !history.error ? (
        <Button
          variant="outline"
          disabled={history.loadingMore}
          aria-busy={history.loadingMore}
          onClick={() => void history.loadMore()}
        >
          {history.loadingMore ? "Loading attempts..." : "Load more attempts"}
        </Button>
      ) : null}
    </div>
  )
}
