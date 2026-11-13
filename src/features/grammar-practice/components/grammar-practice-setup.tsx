"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, History, Loader2, Play } from "lucide-react"
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
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import {
  normalizeFoundationsError,
  type FoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import {
  getGrammarPracticeOptions,
  startGrammarPractice,
} from "../api/grammar-practice-api"
import type { GrammarPracticeOptions } from "../api/grammar-practice-schemas"
import { grammarHistoryHref } from "../model/grammar-history-url"
import {
  grammarSessionHref,
  useGrammarPracticeHandoff,
} from "../model/grammar-practice-handoff"
import { GrammarHistoryList } from "./grammar-practice-history"

export function GrammarPracticeActions({
  languageCode,
  pointCode,
}: {
  languageCode: string
  pointCode?: string
}) {
  const { state } = useCurrentLearningProfile()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || profile.targetLanguage !== languageCode) return null
  const query = new URLSearchParams()
  if (pointCode) query.set("point", pointCode)
  return (
    <div className="flex flex-wrap items-center gap-2.5 text-sm">
      <Link
        className={buttonVariants({ variant: "default", size: "sm" })}
        href={`/learn/grammar/practice${query.size ? `?${query}` : ""}`}
      >
        <Play className="size-4 shrink-0" aria-hidden="true" />
        <span>{pointCode ? "Luyện mẫu câu này" : "Luyện ngữ pháp"}</span>
      </Link>
      <Link
        className={buttonVariants({ variant: "outline", size: "sm" })}
        href={grammarHistoryHref(profile.id, new URLSearchParams(search))}
        scroll={false}
      >
        <History className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>Lịch sử luyện</span>
      </Link>
    </div>
  )
}
export function GrammarPracticeSetup() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <SetupContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.explanationLanguage}:${search.get("point")}`}
      profileId={profile.id}
      pointCode={search.get("point") ?? ""}
    />
  )
}
function SetupContent({
  profileId,
  pointCode,
}: {
  profileId: string
  pointCode: string
}) {
  const loader = useCallback(
    (signal: AbortSignal) => getGrammarPracticeOptions(profileId, signal),
    [profileId]
  )
  const options = useCatalogResource(`grammar-options:${profileId}`, loader)
  return (
    <div className="max-w-xl space-y-6">
      <Link
        href="/learn/grammar"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Về ngữ pháp
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Luyện ngữ pháp</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Chọn mẫu câu và số lượng câu hỏi để bắt đầu bài luyện tập.
        </p>
      </header>
      {options.status === "loading" ? (
        <CatalogLoading label="Đang tải lựa chọn…" />
      ) : null}
      <CatalogFeedback
        error={options.error}
        onRetry={() => void options.reload()}
      />
      {options.data ? (
        <StartForm options={options.data} pointCode={pointCode} />
      ) : null}
    </div>
  )
}
function StartForm({
  options,
  pointCode,
}: {
  options: GrammarPracticeOptions
  pointCode: string
}) {
  const [point, setPoint] = useState(pointCode)
  const [count, setCount] = useState(options.defaultQuestionCount)
  const [phase, setPhase] = useState<"idle" | "starting" | "uncertain">("idle")
  const [error, setError] = useState<FoundationsError | null>(null)
  const [historyChecked, setHistoryChecked] = useState(false)
  const markHistoryChecked = useCallback(() => setHistoryChecked(true), [])
  const active = useRef<AbortController | null>(null)
  const router = useRouter()
  const { remember } = useGrammarPracticeHandoff()
  useEffect(() => () => active.current?.abort(), [])
  const chosen = options.grammarPoints.find((p) => p.code === point)
  const available = point
    ? (chosen?.availableQuestionCount ?? 0)
    : options.availableQuestionCount
  const max = Math.min(options.maxQuestionCount, available)
  const valid =
    (!point || !!chosen) && count >= options.minQuestionCount && count <= max

  const pointOptions = [
    { value: "all", label: "Luyện tổng hợp" },
    ...(point && !chosen ? [{ value: point, label: "Mẫu câu hiện không có" }] : []),
    ...options.grammarPoints.map((p) => ({
      value: p.code,
      label: `${p.name} · ${p.availableQuestionCount} câu`,
    })),
  ]

  const countOptions = Array.from(
    {
      length: Math.max(
        0,
        options.maxQuestionCount - options.minQuestionCount + 1
      ),
    },
    (_, i) => options.minQuestionCount + i
  ).map((n) => ({
    value: String(n),
    label: `${n} câu`,
    disabled: n > max,
  }))

  async function start() {
    if (active.current || phase !== "idle" || error || !valid) return
    const controller = new AbortController()
    active.current = controller
    setPhase("starting")
    setHistoryChecked(false)
    try {
      const detail = await startGrammarPractice(
        options.learningProfileId,
        { questionCount: count, ...(point ? { grammarPointCode: point } : {}) },
        controller.signal
      )
      if (controller.signal.aborted) return
      remember(detail)
      router.push(
        grammarSessionHref(options.learningProfileId, detail.session.id)
      )
    } catch (value) {
      if (controller.signal.aborted) return
      const problem = normalizeFoundationsError(value)
      setError(problem)
      setPhase(
        problem.status === null || problem.status >= 500 ? "uncertain" : "idle"
      )
    } finally {
      if (active.current === controller) active.current = null
    }
  }
  if (phase === "uncertain")
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm">
          Chưa xác nhận được bài đã tạo. Hãy kiểm tra lịch sử trước khi bắt đầu
          bài mới.
        </p>
        <GrammarHistoryList
          profileId={options.learningProfileId}
          pointCode={point || undefined}
          onLoaded={markHistoryChecked}
        />
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          href={grammarHistoryHref(options.learningProfileId)}
        >
          <History className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>Mở toàn bộ lịch sử</span>
        </Link>
        <Button
          variant="outline"
          disabled={!historyChecked}
          onClick={() => {
            setError(null)
            setPhase("idle")
          }}
        >
          Tôi đã kiểm tra, tạo bài mới
        </Button>
      </div>
    )
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        void start()
      }}
    >
      <div className="space-y-2">
        <label
          htmlFor="grammar-practice-point"
          className="text-sm font-medium text-foreground"
        >
          Nội dung luyện
        </label>
        <Select
          items={pointOptions}
          value={point || "all"}
          onValueChange={(val) => {
            if (val) {
              setPoint(val === "all" ? "" : val)
              setCount(options.defaultQuestionCount)
            }
          }}
          disabled={phase === "starting"}
        >
          <SelectTrigger id="grammar-practice-point">
            <SelectValue placeholder="Chọn nội dung luyện" />
          </SelectTrigger>
          <SelectContent>
            {pointOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {available} câu hỏi có sẵn trong hệ thống
      </p>

      <div className="space-y-2">
        <label
          htmlFor="grammar-practice-count"
          className="text-sm font-medium text-foreground"
        >
          Số lượng câu hỏi
        </label>
        <Select
          items={countOptions}
          value={String(count)}
          onValueChange={(val) => {
            if (val) setCount(Number(val))
          }}
          disabled={phase === "starting"}
        >
          <SelectTrigger id="grammar-practice-count">
            <SelectValue placeholder="Chọn số câu" />
          </SelectTrigger>
          <SelectContent>
            {countOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {available < options.minQuestionCount ? (
        <ContentUnavailable title="Chưa đủ câu hỏi">
          Chọn nội dung khác để bắt đầu bài luyện.
        </ContentUnavailable>
      ) : null}
      <CatalogFeedback error={error} onRetry={() => setError(null)} />
      <Button
        type="submit"
        disabled={!valid || phase !== "idle" || !!error}
        aria-busy={phase === "starting"}
      >
        {phase === "starting" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Đang tạo bài…</span>
          </>
        ) : (
          <>
            <Play className="size-4" aria-hidden="true" />
            <span>Bắt đầu luyện</span>
          </>
        )}
      </Button>
    </form>
  )
}
