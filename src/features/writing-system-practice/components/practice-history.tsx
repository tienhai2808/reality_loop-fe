"use client"

import Link from "next/link"
import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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

export function PracticeHistory({ embedded = false }: { embedded?: boolean }) {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const parsed = writingPracticeStatusSchema.safeParse(search.get("status"))
  const status = parsed.success ? parsed.data : undefined
  const systemCode =
    search.get(embedded ? "historySystem" : "system") || undefined
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  return (
    <HistoryContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}`}
      profileId={profile.id}
      embedded={embedded}
      status={status}
      systemCode={systemCode}
    />
  )
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả bài luyện" },
  { value: "InProgress", label: "Đang làm" },
  { value: "Completed", label: "Đã hoàn thành" },
  { value: "Abandoned", label: "Kết thúc sớm" },
] as const

function HistoryContent({
  profileId,
  status,
  embedded,
  systemCode,
}: {
  profileId: string
  embedded: boolean
  status?: WritingPracticeStatus
  systemCode?: string
}) {
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
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
    const query = new URLSearchParams(search)
    const param = embedded && key === "system" ? "historySystem" : key
    if (value) query.set(param, value)
    else query.delete(param)
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, {
      scroll: false,
    })
  }
  const systemOptions = [
    { value: "all", label: embedded ? "Tất cả" : "Tất cả bảng chữ" },
    ...(systemCode &&
    !systems.data?.items.some((system) => system.code === systemCode)
      ? [{ value: systemCode, label: "Bảng chữ đã chọn" }]
      : []),
    ...(systems.data?.items.map((system) => ({
      value: system.code,
      label: system.name,
    })) ?? []),
  ]

  return (
    <div className="min-w-0 max-w-3xl space-y-3">
      {!embedded ? (
        <>
          <Link
            href="/learn/writing-systems"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Về bảng chữ
          </Link>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Lịch sử luyện nhận diện
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Tiếp tục bài đang dở hoặc xem lại đáp án.
            </p>
          </header>
        </>
      ) : null}
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          embedded &&
            "sticky top-0 z-10 grid-cols-2 gap-2 border-b border-border bg-popover py-2"
        )}
      >
        <div className="space-y-2">
          <label htmlFor="practice-status" className="text-sm font-medium">
            Trạng thái
          </label>
          <Select
            items={STATUS_OPTIONS}
            value={status ?? "all"}
            onValueChange={(val) =>
              filter("status", val === "all" ? "" : (val ?? ""))
            }
          >
            <SelectTrigger id="practice-status">
              <SelectValue placeholder="Tất cả bài luyện" />
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
            Bảng chữ
          </label>
          <Select
            items={systemOptions}
            value={systemCode ?? "all"}
            onValueChange={(val) =>
              filter("system", val === "all" ? "" : (val ?? ""))
            }
          >
            <SelectTrigger id="practice-system">
              <SelectValue placeholder="Tất cả bảng chữ" />
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
          Đang tải tên bảng chữ…
        </p>
      ) : null}
      {systems.data?.nextCursor && !systems.error ? (
        <Button
          variant="ghost"
          disabled={systems.loadingMore}
          onClick={() => void systems.loadMore()}
        >
          Xem thêm bảng chữ
        </Button>
      ) : null}
      {history.status === "loading" ? (
        <CatalogLoading label="Đang tải lịch sử luyện…" />
      ) : null}
      {history.error?.status === 404 ? (
        <ContentUnavailable title="Không tải được lịch sử luyện">
          Hồ sơ hoặc các bài luyện hiện không có.
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
        <ContentUnavailable
          title={
            status === "InProgress"
              ? "Không có bài đang dở"
              : "Chưa có bài luyện"
          }
        >
          Bắt đầu từ Bảng chữ hoặc đổi bộ lọc để xem bài đã lưu.
        </ContentUnavailable>
      ) : null}
      {history.data?.items.length ? (
        <ul
          className={cn(
            "divide-y divide-border border-b border-border",
            !embedded && "border-t"
          )}
        >
          {history.data.items.map((session) => {
            const system = systems.data?.items.find(
              (entry) => entry.id === session.writingSystemId
            )
            return (
              <li
                key={session.id}
                className={cn(
                  "flex flex-wrap items-center justify-between",
                  embedded ? "gap-2 py-2.5" : "gap-4 py-4"
                )}
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-sm font-semibold text-foreground">
                      {system?.name ?? "Luyện nhận diện chữ"} ·{" "}
                      {session.questionCount} câu
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                        session.status === "Completed" &&
                          "bg-success-subtle text-success",
                        session.status === "InProgress" &&
                          "bg-primary/10 text-primary",
                        session.status === "Abandoned" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {session.status === "InProgress"
                        ? "Đang làm"
                        : session.status === "Completed"
                          ? "Đã hoàn thành"
                          : "Kết thúc sớm"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={session.createdAt}>
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(session.createdAt))}
                    </time>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {session.answeredCount}
                    </span>{" "}
                    câu đã trả lời ·{" "}
                    <span className="font-medium text-foreground">
                      {session.correctCount}
                    </span>{" "}
                    câu đúng
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
                  {session.status === "InProgress" ? "Tiếp tục" : "Xem kết quả"}
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
          {history.loadingMore ? "Đang tải bài luyện…" : "Xem thêm bài luyện"}
        </Button>
      ) : null}
    </div>
  )
}
