"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
import { WritingHistoryPanel } from "@/features/learn/components/writing-history-panel"

type Position = {
  key: string
  detail: HandwritingTemplateDetail
  strokes: InkDrawing
  confirmed: boolean
}
export function HandwritingWorkspace({ systemCode }: { systemCode: string }) {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <WorkspaceContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${systemCode}`}
      profileId={profile.id}
      systemCode={systemCode}
      languageCode={profile.targetLanguage}
      locale={profile.explanationLanguage}
      characterCode={search.get("character")}
    />
  )
}
function WorkspaceContent({
  profileId,
  systemCode,
  languageCode,
  locale,
  characterCode,
}: {
  profileId: string
  systemCode: string
  languageCode: string
  locale: string
  characterCode: string | null
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
  const [activePosition, setActivePosition] = useState<string | null>(null)
  const selectedIndex = positions.findIndex(
    (position) => position.key === activePosition
  )
  const positionIndex = selectedIndex < 0 ? positions.length - 1 : selectedIndex
  const currentPosition = positions[positionIndex]
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
  const preferred = templates.data?.items.find(
    (item) => item.itemCode === characterCode
  )
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
          "Phiên bản này chưa hỗ trợ chỉnh sửa mẫu nét này.",
          400
        )
      const positionKey = key ?? crypto.randomUUID()
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
                key: positionKey,
                detail,
                strokes: [],
                confirmed: true,
              },
            ]
      )
      setActivePosition(positionKey)
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
          "Bài viết vượt giới hạn. Hãy hoàn tác hoặc xóa bớt nét rồi thử lại.",
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
          "Bài viết quá lớn. Hãy hoàn tác hoặc viết lại với ít nét hơn.",
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
            "Chưa xác nhận được bài đã lưu. Hãy kiểm tra các bài gần đây trước khi gửi lại.",
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
    <div
      className={cn(
        "grid min-w-0 items-start gap-4",
        result && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      )}
    >
      <div className="min-w-0 space-y-3">
        <nav
          className="flex flex-wrap items-center justify-between gap-3"
          aria-label="Điều hướng luyện viết"
        >
          <Link
            href={`/learn/writing-systems?${new URLSearchParams({ system: systemCode, ...(characterCode ? { character: characterCode } : {}) })}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {metadata.data?.name ?? "Về bảng chữ"}
          </Link>
          <WritingHistoryPanel profileId={profileId} defaultKind="writing" />
        </nav>
        <h2 className="sr-only">Luyện viết {metadata.data?.name}</h2>
        {templates.status === "loading" ? (
          <CatalogLoading label="Đang tải chữ mẫu…" />
        ) : null}
        {templates.error?.status === 404 ||
        (templates.status === "ready" && !templates.data.items.length) ? (
          <ContentUnavailable title="Bảng chữ này chưa có mẫu luyện viết">
            Bạn vẫn có thể xem và nghe cách đọc trong bảng chữ.
          </ContentUnavailable>
        ) : (
          <CatalogFeedback
            error={templates.error}
            onRetry={() =>
              void (templates.data?.nextCursor &&
              templates.error?.status !== 400
                ? templates.loadMore()
                : templates.reload())
            }
          />
        )}
        {templates.data?.items.length && templates.error?.status !== 404 ? (
          <section className="space-y-3" aria-label="Chọn chữ để luyện viết">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mr-1 text-sm font-medium">
                {positions.length ? "Thêm chữ" : "Chọn chữ"}
              </h3>
              {templates.data.items.map((template) => (
                <Button
                  key={template.reference.id}
                  variant={
                    !positions.length &&
                    template.reference.id === preferred?.reference.id
                      ? "default"
                      : "outline"
                  }
                  className="font-ja h-11 min-w-11 text-xl"
                  lang={languageCode}
                  aria-label={`Thêm ${template.reference.symbol}`}
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
          </section>
        ) : null}
        {templates.data?.nextCursor && !templates.error ? (
          <Button
            variant="outline"
            disabled={templates.loadingMore || busy}
            onClick={() => void templates.loadMore()}
          >
            {templates.loadingMore ? "Đang tải mẫu chữ…" : "Thêm chữ mẫu"}
          </Button>
        ) : null}
        {phase === "template" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Đang tải nét mẫu…
          </p>
        ) : null}
        {positions.length > 1 ? (
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Chữ đang luyện"
          >
            <span className="text-xs text-muted-foreground">
              {positions.length}/{policy?.maximumCharacters} ô
            </span>
            {positions.map((position, index) => (
              <Button
                key={position.key}
                type="button"
                variant={
                  position.key === currentPosition?.key ? "secondary" : "ghost"
                }
                aria-pressed={position.key === currentPosition?.key}
                aria-label={`Ô ${index + 1}, chữ ${position.detail.template.reference.symbol}`}
                disabled={busy || activeStroke !== null}
                onClick={() => setActivePosition(position.key)}
                className="min-h-11 min-w-11"
              >
                <span lang={languageCode} className="font-ja text-lg">
                  {position.detail.template.reference.symbol}
                </span>
                <span className="text-xs text-muted-foreground">
                  {index + 1}
                </span>
              </Button>
            ))}
          </div>
        ) : null}
        {policy && currentPosition ? (
          <HandwritingCharacterEditor
            key={currentPosition.key}
            detail={currentPosition.detail}
            languageCode={languageCode}
            drawing={currentPosition.strokes}
            position={positionIndex}
            policy={policy}
            templates={templates.data?.items ?? []}
            pointBudget={
              policy.maximumTotalPoints -
              (totalPoints -
                currentPosition.strokes.reduce(
                  (sum, stroke) => sum + stroke.length,
                  0
                ))
            }
            disabled={
              busy ||
              (activeStroke !== null && activeStroke !== currentPosition.key)
            }
            editingStroke={activeStroke !== null}
            confirmed={currentPosition.confirmed}
            onConfirm={() =>
              void choose(
                currentPosition.detail.template.reference.id,
                currentPosition.key
              )
            }
            onSelect={(templateId) =>
              void choose(templateId, currentPosition.key)
            }
            onChange={(strokes) => change(currentPosition.key, strokes)}
            onStart={() => setResult(null)}
            onActive={(value) => {
              drawingActive.current = value ? currentPosition.key : null
              setActiveStroke(value ? currentPosition.key : null)
            }}
            onRemove={() => {
              setPositions((previous) =>
                previous.filter((item) => item.key !== currentPosition.key)
              )
              setResult(null)
            }}
          />
        ) : null}
        {phase === "uncertain" || phase === "recovering" ? (
          <section
            className="space-y-3 border-y border-border py-5"
            aria-label="Kiểm tra bài đã gửi"
          >
            <p role="alert" className="text-sm leading-6 text-muted-foreground">
              {error?.message}
            </p>
            {phase === "recovering" ? (
              <p role="status" className="text-sm text-muted-foreground">
                Đang kiểm tra các bài gần đây…
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
                          {attempt.passed ? "Đạt" : "Cần sửa"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <time dateTime={attempt.createdAt}>
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(attempt.createdAt))}
                        </time>
                      </p>
                    </div>
                    <Link
                      href={handwritingAttemptHref(profileId, attempt.id)}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Xem bài viết
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {recent && !recent.length ? (
              <p className="text-sm text-muted-foreground">
                Chưa thấy bài vừa gửi. Hãy kiểm tra lại trước khi gửi bài mới.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {!historyError ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void reloadRecent()}
                >
                  Kiểm tra bài gần đây
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
                  Gửi bài mới
                </Button>
              ) : null}
            </div>
          </section>
        ) : (
          <CatalogFeedback error={error} onRetry={() => setError(null)} />
        )}
        {positions.length ? (
          <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-10 border-t border-border bg-background py-2 lg:static">
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
              {phase === "submitting" ? "Đang chấm bài…" : "Chấm bài"}
            </Button>
          </div>
        ) : null}
      </div>
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
