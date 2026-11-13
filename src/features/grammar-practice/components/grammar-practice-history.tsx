"use client"

import Link from "next/link"
import { useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import {
  LearnDrawerBody,
  LearnDrawerContent,
} from "@/features/learn/components/learn-drawer"
import { cn } from "@/lib/utils"
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
import {
  useCatalogPage,
  useCatalogResource,
} from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import {
  listGrammarPractice,
  getGrammarPracticeOptions,
} from "../api/grammar-practice-api"
import {
  grammarPracticeStatusSchema,
  type GrammarPracticeStatus,
} from "../api/grammar-practice-schemas"
import { grammarSessionHref } from "../model/grammar-practice-handoff"

export const statusLabels: Record<GrammarPracticeStatus, string> = {
  InProgress: "Đang luyện",
  Completed: "Hoàn thành",
  Abandoned: "Kết thúc sớm",
}

export const statusBadges: Record<GrammarPracticeStatus, string> = {
  InProgress: "bg-primary/10 text-primary",
  Completed: "bg-success-subtle text-success",
  Abandoned: "bg-muted text-muted-foreground",
}

export function GrammarPracticeHistoryDrawer() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const router = useRouter()
  const profileId = search.get("profile") ?? state.current?.profile.id
  if (!profileId || auth.status !== "authenticated") return null
  const historyOpen = search.get("history") === "practice"
  const parsed = grammarPracticeStatusSchema.safeParse(search.get("status"))
  const status = parsed.success ? parsed.data : undefined
  const point = search.get("historyPoint") ?? ""
  function updateHistory(key: "status" | "historyPoint", value: string) {
    const query = new URLSearchParams(search)
    if (value && value !== "all") query.set(key, value)
    else query.delete(key)
    router.replace(`/learn/grammar?${query}`, { scroll: false })
  }

  function close() {
    const query = new URLSearchParams(search)
    for (const key of ["history", "profile", "status", "historyPoint"]) {
      query.delete(key)
    }
    router.replace(`/learn/grammar${query.size ? `?${query}` : ""}`, {
      scroll: false,
    })
  }

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    ...grammarPracticeStatusSchema.options.map((s) => ({
      value: s,
      label: statusLabels[s],
    })),
  ]

  return (
    <Dialog
      open={historyOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <LearnDrawerContent title="Lịch sử luyện ngữ pháp">
        <LearnDrawerBody>
          {profileId !== state.current?.profile.id ? (
            <p className="py-2 text-sm text-muted-foreground">
              Lịch sử này thuộc hồ sơ học khác.
            </p>
          ) : null}
          <div className="sticky top-0 z-10 grid grid-cols-2 items-start gap-2 border-b border-border bg-popover py-2">
            <div className="space-y-2">
              <label
                htmlFor="history-status-filter"
                className="text-sm font-medium text-foreground"
              >
                Trạng thái
              </label>
              <Select
                items={statusOptions}
                value={status ?? "all"}
                onValueChange={(val) => {
                  if (val) updateHistory("status", val)
                }}
              >
                <SelectTrigger id="history-status-filter">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <GrammarPointFilter
              key={`${auth.user.id}:${auth.sessionId}:${profileId}:${state.current?.profile.explanationLanguage}`}
              profileId={profileId}
              point={point}
              onChange={(value) => updateHistory("historyPoint", value)}
            />
          </div>
          <GrammarHistoryList
            key={`${auth.user.id}:${auth.sessionId}:${profileId}:${status}:${point}`}
            profileId={profileId}
            status={status}
            pointCode={point || undefined}
          />
        </LearnDrawerBody>
      </LearnDrawerContent>
    </Dialog>
  )
}

export function GrammarHistoryList({
  profileId,
  status,
  pointCode,
  onLoaded,
}: {
  profileId: string
  status?: string
  pointCode?: string
  onLoaded?: () => void
}) {
  const loader = useCallback(
    (before: string | null, signal: AbortSignal) =>
      listGrammarPractice(
        profileId,
        { status, grammarPointCode: pointCode },
        before,
        signal
      ),
    [profileId, status, pointCode]
  )
  const page = useCatalogPage(
    `grammar-history:${profileId}:${status}:${pointCode}`,
    loader
  )
  useEffect(() => {
    if (page.status === "ready") onLoaded?.()
  }, [page.status, onLoaded])
  return (
    <div className="space-y-4">
      {page.status === "loading" ? (
        <CatalogLoading label="Đang tải lịch sử…" />
      ) : null}
      <CatalogFeedback
        error={page.error}
        onRetry={() =>
          void (page.data?.nextCursor && page.error?.status !== 400
            ? page.loadMore()
            : page.reload())
        }
      />
      {page.status === "ready" && !page.data.items.length ? (
        <ContentUnavailable title="Chưa có bài luyện">
          Các bài đã lưu sẽ xuất hiện tại đây.
        </ContentUnavailable>
      ) : null}
      {page.data && page.error?.status !== 404 ? (
        <ul className="divide-y divide-border border-y border-border">
          {page.data.items.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div className="space-y-1.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusBadges[s.status]
                    )}
                  >
                    {statusLabels[s.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-medium text-foreground">
                    {s.questionCount} câu hỏi
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {s.correctCount} đúng
                  </span>
                  {" · "}
                  <span>{s.incorrectCount} chưa đúng</span>
                  {s.unansweredCount > 0 ? (
                    <>
                      {" · "}
                      <span>{s.unansweredCount} chưa trả lời</span>
                    </>
                  ) : null}
                </p>
                <time
                  dateTime={s.createdAt}
                  className="block text-xs text-muted-foreground"
                >
                  {new Intl.DateTimeFormat("vi-VN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(s.createdAt))}
                </time>
              </div>
              <Link
                className={buttonVariants({
                  variant: s.status === "InProgress" ? "default" : "outline",
                  size: "sm",
                })}
                href={grammarSessionHref(profileId, s.id)}
              >
                <span>
                  {s.status === "InProgress" ? "Tiếp tục" : "Xem kết quả"}
                </span>
                <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {page.data?.nextCursor && !page.error ? (
        <Button
          variant="outline"
          disabled={page.loadingMore}
          aria-busy={page.loadingMore}
          onClick={() => void page.loadMore()}
        >
          {page.loadingMore ? "Đang tải…" : "Xem thêm"}
        </Button>
      ) : null}
    </div>
  )
}

function GrammarPointFilter({
  profileId,
  point,
  onChange,
}: {
  profileId: string
  point: string
  onChange: (point: string) => void
}) {
  const loader = useCallback(
    (signal: AbortSignal) => getGrammarPracticeOptions(profileId, signal),
    [profileId]
  )
  const resource = useCatalogResource(
    `grammar-history-options:${profileId}`,
    loader
  )

  const pointOptions = [
    { value: "all", label: "Tất cả mẫu câu" },
    ...(point && !resource.data?.grammarPoints.some((p) => p.code === point)
      ? [{ value: point, label: point }]
      : []),
    ...(resource.data?.grammarPoints.map((p) => ({
      value: p.code,
      label: p.name,
    })) ?? []),
  ]

  return (
    <div className="space-y-2">
      <label
        htmlFor="history-point-filter"
        className="text-sm font-medium text-foreground"
      >
        Mẫu ngữ pháp
      </label>
      <Select
        items={pointOptions}
        value={point || "all"}
        onValueChange={(val) => {
          if (val) onChange(val === "all" ? "" : val)
        }}
        disabled={resource.status === "loading"}
      >
        <SelectTrigger id="history-point-filter">
          <SelectValue placeholder="Tất cả mẫu câu" />
        </SelectTrigger>
        <SelectContent>
          {pointOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {resource.status === "loading" ? (
        <p role="status" className="text-xs text-muted-foreground">
          Đang tải mẫu câu…
        </p>
      ) : null}
      <CatalogFeedback
        error={resource.error}
        onRetry={() => void resource.reload()}
      />
    </div>
  )
}
