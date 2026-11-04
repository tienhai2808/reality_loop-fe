"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, History } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { getWritingSystem } from "@/features/language-foundations/api/language-foundations-api"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import {
  getHandwritingTemplate,
  listHandwritingAttempts,
  submitHandwriting,
} from "../api/handwriting-api"
import {
  submitHandwritingRequestSchema,
  type HandwritingAttemptDetail,
  type HandwritingAttemptSummary,
  type HandwritingTemplateDetail,
  type InkDrawing,
} from "../api/handwriting-schemas"
import { useHandwritingTemplates } from "../hooks/use-handwriting-templates"
import { handwritingAttemptHref } from "../lib/handwriting-labels"
import { HandwritingCharacterEditor } from "./handwriting-character-editor"
import { HandwritingResults } from "./handwriting-results"

type Position = {
  key: string
  detail: HandwritingTemplateDetail
  strokes: InkDrawing
  confirmed: boolean
}
export function HandwritingWorkspace() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  const systemCode = search.get("system")
  if (!profile || auth.status !== "authenticated") return null
  if (!systemCode)
    return (
      <ContentUnavailable title="Choose a writing system">
        <Link
          href="/learn/writing-systems"
          className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open Writing Systems to choose where to practice.
        </Link>
      </ContentUnavailable>
    )
  return (
    <WorkspaceContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${systemCode}`}
      profileId={profile.id}
      systemCode={systemCode}
      languageCode={profile.targetLanguage}
      locale={profile.explanationLanguage}
    />
  )
}
function WorkspaceContent({
  profileId,
  systemCode,
  languageCode,
  locale,
}: {
  profileId: string
  systemCode: string
  languageCode: string
  locale: string
}) {
  const templates = useHandwritingTemplates(profileId, systemCode)
  const metadataLoader = useCallback(
    (signal: AbortSignal) =>
      getWritingSystem(languageCode, systemCode, locale, signal),
    [languageCode, systemCode, locale]
  )
  const metadata = useCatalogResource(
    `handwriting-system:${languageCode}:${systemCode}:${locale}`,
    metadataLoader
  )
  const [positions, setPositions] = useState<Position[]>([])
  const [phase, setPhase] = useState<
    "idle" | "template" | "submitting" | "recovering" | "uncertain"
  >("idle")
  const [activeStroke, setActiveStroke] = useState<string | null>(null)
  const drawingActive = useRef<string | null>(null)
  const [error, setError] = useState<FoundationsError | null>(null)
  const [result, setResult] = useState<HandwritingAttemptDetail | null>(null)
  const [recent, setRecent] = useState<HandwritingAttemptSummary[] | null>(null)
  const [historyError, setHistoryError] = useState<FoundationsError | null>(
    null
  )
  const active = useRef<AbortController | null>(null)
  const resultRef = useRef<HTMLDivElement | null>(null)
  useEffect(
    () => () => {
      active.current?.abort()
    },
    []
  )
  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])
  const policy = templates.policy
  const busy =
    phase === "submitting" || phase === "template" || phase === "recovering"
  const totalPoints = positions.reduce(
    (total, position) =>
      total +
      position.strokes.reduce((count, stroke) => count + stroke.length, 0),
    0
  )

  async function choose(templateId: string, key?: string) {
    if (
      active.current ||
      drawingActive.current ||
      error?.status === 429 ||
      !policy ||
      (!key && positions.length >= policy.maximumCharacters)
    )
      return
    const controller = new AbortController()
    active.current = controller
    setPhase("template")
    try {
      const cached = key
        ? undefined
        : positions.find(
            (position) =>
              position.confirmed &&
              position.detail.template.reference.id === templateId
          )?.detail
      const detail =
        cached ??
        (await getHandwritingTemplate(
          profileId,
          systemCode,
          templateId,
          controller.signal
        ))
      if (controller.signal.aborted) return
      if (detail.drawingFormatVersion !== 1)
        throw new FoundationsError(
          "This template uses a drawing format this version of the app cannot edit yet.",
          400
        )
      setPositions((previous) =>
        key
          ? previous.map((position) =>
              position.key === key
                ? { ...position, detail, confirmed: true }
                : position
            )
          : [
              ...previous,
              {
                key: crypto.randomUUID(),
                detail,
                strokes: [],
                confirmed: true,
              },
            ]
      )
      setResult(null)
    } catch (value) {
      if (!controller.signal.aborted) setError(normalizeFoundationsError(value))
    } finally {
      if (active.current === controller) active.current = null
      if (!controller.signal.aborted) setPhase("idle")
    }
  }
  function change(key: string, strokes: InkDrawing) {
    setPositions((previous) =>
      previous.map((position) =>
        position.key === key ? { ...position, strokes } : position
      )
    )
    setResult(null)
  }
  async function recover(controller: AbortController) {
    setPhase("recovering")
    setHistoryError(null)
    try {
      const page = await listHandwritingAttempts(
        profileId,
        { systemCode },
        null,
        controller.signal
      )
      if (!controller.signal.aborted) setRecent(page.items)
    } catch (value) {
      if (!controller.signal.aborted)
        setHistoryError(normalizeFoundationsError(value))
    } finally {
      if (!controller.signal.aborted) setPhase("uncertain")
    }
  }
  async function reloadRecent() {
    if (
      active.current ||
      (historyError?.retryAt && historyError.retryAt > Date.now())
    )
      return
    const controller = new AbortController()
    active.current = controller
    await recover(controller)
    if (active.current === controller) active.current = null
  }
  async function submit() {
    if (
      active.current ||
      drawingActive.current ||
      !policy ||
      !positions.length ||
      error ||
      result ||
      templates.error?.status === 404 ||
      phase !== "idle" ||
      positions.some((position) => !position.confirmed)
    )
      return
    const parsed = submitHandwritingRequestSchema.safeParse({
      characters: positions.map((position) => ({
        templateId: position.detail.template.reference.id,
        strokes: position.strokes,
      })),
    })
    if (
      !parsed.success ||
      positions.length > policy.maximumCharacters ||
      totalPoints > policy.maximumTotalPoints ||
      positions.some(
        (position) =>
          position.strokes.length > policy.maximumStrokesPerCharacter ||
          position.strokes.some(
            (stroke) => stroke.length > policy.maximumPointsPerStroke
          )
      )
    ) {
      setError(
        new FoundationsError(
          "This drawing exceeds the published input limits. Undo or clear strokes and try again.",
          400
        )
      )
      return
    }
    if (
      new TextEncoder().encode(JSON.stringify(parsed.data)).byteLength >
      256 * 1024
    ) {
      setError(
        new FoundationsError(
          "This drawing is too large to submit. Undo strokes or clear and redraw with fewer points.",
          413
        )
      )
      return
    }
    const controller = new AbortController()
    active.current = controller
    setPhase("submitting")
    try {
      const detail = await submitHandwriting(
        profileId,
        systemCode,
        parsed.data,
        controller.signal
      )
      if (!controller.signal.aborted) setResult(detail)
    } catch (value) {
      if (controller.signal.aborted) return
      const problem = normalizeFoundationsError(value)
      setError(problem)
      if (problem.status === 409) {
        setPositions((previous) =>
          previous.map((position) => ({ ...position, confirmed: false }))
        )
        void templates.reload()
      } else if (problem.status === null || problem.status >= 500) {
        setError(
          new FoundationsError(
            "We couldn't confirm whether this attempt was saved. Check recent attempts before choosing to submit a new one.",
            problem.status,
            problem.retryAt,
            problem.traceId
          )
        )
        await recover(controller)
      }
    } finally {
      if (active.current === controller) active.current = null
      if (!controller.signal.aborted)
        setPhase((current) => (current === "uncertain" ? current : "idle"))
    }
  }

  return (
    <div className="min-w-0 max-w-4xl space-y-6">
      <nav
        className="flex flex-wrap items-center justify-between gap-3"
        aria-label="Handwriting navigation"
      >
        <Link
          href={`/learn/writing-systems?${new URLSearchParams({ system: systemCode })}`}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Writing Systems
        </Link>
        <Link
          href={`/learn/handwriting/${encodeURIComponent(profileId)}/history`}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <History className="size-3.5" aria-hidden="true" />
          Handwriting history
        </Link>
      </nav>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Practice writing
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {metadata.data?.name ?? "Writing system"} · Choose a character, study
          its strokes, and try it yourself.
        </p>
      </header>
      {templates.status === "loading" ? (
        <CatalogLoading label="Loading handwriting templates..." />
      ) : null}
      {templates.error?.status === 404 ||
      (templates.status === "ready" && !templates.data.items.length) ? (
        <ContentUnavailable title="Handwriting is coming for this writing system">
          No published handwriting templates are available here yet. You can
          still explore its character chart.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={templates.error}
          onRetry={() =>
            void (templates.data?.nextCursor && templates.error?.status !== 400
              ? templates.loadMore()
              : templates.reload())
          }
        />
      )}
      {templates.data?.items.length && templates.error?.status !== 404 ? (
        <section
          className="space-y-3"
          aria-label="Choose handwriting characters"
        >
          <h2 className="text-sm font-medium">
            {positions.length ? "Add a character" : "Choose a character"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {templates.data.items.map((template) => (
              <Button
                key={template.reference.id}
                variant="outline"
                className="font-ja h-14 min-w-14 text-2xl"
                lang={languageCode}
                aria-label={`Add ${template.reference.symbol}`}
                disabled={
                  busy ||
                  activeStroke !== null ||
                  !policy ||
                  positions.length >= policy.maximumCharacters ||
                  phase === "uncertain" ||
                  error?.status === 429
                }
                onClick={() => void choose(template.reference.id)}
              >
                {template.reference.symbol}
              </Button>
            ))}
          </div>
          {policy ? (
            <p className="text-xs text-muted-foreground">
              Up to {policy.maximumCharacters} character positions. Repeating a
              character is welcome.
            </p>
          ) : null}
        </section>
      ) : null}
      {templates.data?.nextCursor && !templates.error ? (
        <Button
          variant="outline"
          disabled={templates.loadingMore || busy}
          onClick={() => void templates.loadMore()}
        >
          {templates.loadingMore ? "Loading templates..." : "More characters"}
        </Button>
      ) : null}
      {phase === "template" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading reference strokes...
        </p>
      ) : null}
      {policy ? (
        <div className="grid gap-8 md:grid-cols-2">
          {positions.map((position, index) => (
            <HandwritingCharacterEditor
              key={position.key}
              detail={position.detail}
              languageCode={languageCode}
              drawing={position.strokes}
              position={index}
              policy={policy}
              templates={templates.data?.items ?? []}
              pointBudget={
                policy.maximumTotalPoints -
                (totalPoints -
                  position.strokes.reduce(
                    (sum, stroke) => sum + stroke.length,
                    0
                  ))
              }
              disabled={
                busy || (activeStroke !== null && activeStroke !== position.key)
              }
              editingStroke={activeStroke !== null}
              confirmed={position.confirmed}
              onConfirm={() =>
                void choose(position.detail.template.reference.id, position.key)
              }
              onSelect={(templateId) => void choose(templateId, position.key)}
              onChange={(strokes) => change(position.key, strokes)}
              onStart={() => setResult(null)}
              onActive={(value) => {
                drawingActive.current = value ? position.key : null
                setActiveStroke(value ? position.key : null)
              }}
              onRemove={() => {
                setPositions((previous) =>
                  previous.filter((item) => item.key !== position.key)
                )
                setResult(null)
              }}
            />
          ))}
        </div>
      ) : null}
      {phase === "uncertain" || phase === "recovering" ? (
        <section
          className="space-y-3 border-y border-border py-5"
          aria-label="Check uncertain attempt"
        >
          <p role="alert" className="text-sm leading-6 text-muted-foreground">
            {error?.message}
          </p>
          {phase === "recovering" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Checking recent attempts...
            </p>
          ) : null}
          <CatalogFeedback
            error={historyError}
            onRetry={() => void reloadRecent()}
          />
          {recent ? (
            <ul className="divide-y divide-border border-y border-border">
              {recent.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        lang={languageCode}
                        className="font-ja break-all text-xl font-medium leading-relaxed"
                      >
                        {attempt.targetText}
                      </span>
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
          {recent && !recent.length ? (
            <p className="text-sm text-muted-foreground">
              No recent attempts have appeared yet. Check again before
              submitting a fresh attempt.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {!historyError ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void reloadRecent()}
              >
                Check recent attempts
              </Button>
            ) : null}
            {recent ? (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setPhase("idle")
                  setError(null)
                  setRecent(null)
                }}
              >
                Choose to submit a fresh attempt
              </Button>
            ) : null}
          </div>
        </section>
      ) : (
        <CatalogFeedback error={error} onRetry={() => setError(null)} />
      )}
      {positions.length ? (
        <div className="space-y-2">
          <Button
            disabled={
              busy ||
              activeStroke !== null ||
              !!error ||
              !!result ||
              templates.error?.status === 404 ||
              phase !== "idle" ||
              positions.some((position) => !position.confirmed)
            }
            aria-busy={phase === "submitting"}
            onClick={() => void submit()}
          >
            {phase === "submitting"
              ? "Checking handwriting..."
              : "Check handwriting"}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Only Check handwriting sends your drawing. An empty drawing can be
            checked too.
          </p>
        </div>
      ) : null}
      {result ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HandwritingResults
            detail={result}
            languageCode={languageCode}
            references={positions.map((position) => position.detail)}
            onPracticeAgain={() => {
              setPositions((previous) =>
                previous.map((position) => ({ ...position, strokes: [] }))
              )
              setResult(null)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
