"use client"

import Link from "next/link"
import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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

export function HandwritingHistory({
  profileId,
  embedded = false,
}: {
  profileId: string
  embedded?: boolean
}) {
  const { state } = useAuth()
  const { state: current } = useCurrentLearningProfile()
  if (state.status !== "authenticated") return null
  return (
    <HistoryContent
      key={`${state.user.id}:${state.sessionId}:${profileId}:${current.current?.profile.id}`}
      profileId={profileId}
      embedded={embedded}
      otherProfile={current.current?.profile.id !== profileId}
    />
  )
}
function HistoryContent({
  profileId,
  otherProfile,
  embedded,
}: {
  profileId: string
  otherProfile: boolean
  embedded: boolean
}) {
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const systemCode =
    search.get(embedded ? "historySystem" : "system") || undefined
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
    const query = new URLSearchParams(search)
    const param = embedded && key === "system" ? "historySystem" : key
    if (value) query.set(param, value)
    else query.delete(param)
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, {
      scroll: false,
    })
  }
  const resultOptions = [
    { value: "all", label: "Tất cả kết quả" },
    { value: "true", label: "Đạt" },
    { value: "false", label: "Cần sửa" },
  ] as const
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
              Lịch sử luyện viết
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.data
                ? `${languageLabel(profile.data.targetLanguage)} · `
                : ""}
              Xem bài viết đã gửi và nhận xét từng nét.
            </p>
            {otherProfile ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Đang xem bài viết của hồ sơ học khác.
              </p>
            ) : null}
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
          <label
            htmlFor="handwriting-history-passed"
            className="text-sm font-medium"
          >
            Kết quả
          </label>
          <Select
            items={resultOptions}
            value={passed === undefined ? "all" : String(passed)}
            onValueChange={(val) =>
              filter("passed", val === "all" ? "" : (val ?? ""))
            }
          >
            <SelectTrigger id="handwriting-history-passed">
              <SelectValue placeholder="Tất cả kết quả" />
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
            Bảng chữ
          </label>
          <Select
            items={systemOptions}
            value={systemCode ?? "all"}
            onValueChange={(val) =>
              filter("system", val === "all" ? "" : (val ?? ""))
            }
          >
            <SelectTrigger id="handwriting-history-system">
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
        <CatalogLoading label="Đang tải bài viết…" />
      ) : null}
      {history.error?.status === 404 ? (
        <ContentUnavailable title="Không tải được lịch sử luyện viết">
          Hồ sơ hoặc bài viết đã lưu hiện không có.
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
        <ContentUnavailable title="Chưa có bài viết">
          Luyện một chữ hoặc đổi bộ lọc để xem bài khác.
        </ContentUnavailable>
      ) : null}
      {history.data?.items.length && history.error?.status !== 404 ? (
        <ul
          className={cn(
            "divide-y divide-border border-b border-border",
            !embedded && "border-t"
          )}
        >
          {history.data.items.map((attempt) => (
            <li
              key={attempt.id}
              className={cn(
                "flex flex-wrap items-center justify-between",
                embedded ? "gap-2 py-2.5" : "gap-4 py-4"
              )}
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
                    {attempt.passed ? "Đạt" : "Cần sửa"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {systems.data?.items.find(
                    (system) => system.id === attempt.writingSystemId
                  )?.name ?? "Bảng chữ"}{" "}
                  · Độ giống mẫu {attempt.matchScore} / 100
                </p>
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
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Xem bài viết
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
          {history.loadingMore ? "Đang tải bài viết…" : "Xem thêm bài viết"}
        </Button>
      ) : null}
    </div>
  )
}
