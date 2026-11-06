"use client"

import Link from "next/link"
import { useCallback, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, TextQuote } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import {
  useCatalogPage,
  type CatalogCache,
} from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { listGrammarPoints } from "../api/grammar-api"
import type { GrammarPointSummary } from "../api/grammar-schemas"
import { grammarHref } from "./grammar-content"
import { GrammarDetailContent } from "./grammar-detail"
import { useLearnWideLayout } from "@/features/learn/hooks/use-learn-wide-layout"
import { LearnDetailPane } from "@/features/learn/components/learn-detail-pane"

export function GrammarList() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  const language = search.get("language") ?? undefined
  const languageCode = language ?? profile.targetLanguage
  const selectedCode = search.get("point")
  const detail = selectedCode ? (
    <LearnDetailPane
      label="Mẫu ngữ pháp"
      selection={selectedCode}
      closeHref={grammarHref(language)}
      triggerId={`grammar-${selectedCode}`}
    >
      <GrammarDetailContent
        key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${languageCode}:${selectedCode}`}
        languageCode={languageCode}
        locale={profile.explanationLanguage}
        pointCode={selectedCode}
      />
    </LearnDetailPane>
  ) : null
  return (
    <GrammarListContent
      key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${languageCode}:${profile.explanationLanguage}`}
      languageCode={languageCode}
      locale={profile.explanationLanguage}
      selectedCode={selectedCode}
      detail={detail}
    />
  )
}

function GrammarListContent({
  languageCode,
  locale,
  selectedCode,
  detail,
}: {
  languageCode: string
  locale: string
  selectedCode: string | null
  detail: ReactNode
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listGrammarPoints(languageCode, locale, after, signal),
    [languageCode, locale]
  )
  const [cache] = useState<CatalogCache<GrammarPointSummary>>(() => new Map())
  const page = useCatalogPage(
    `grammar:${languageCode}:${locale}:20`,
    loader,
    cache
  )
  const wide = useLearnWideLayout()
  const selectedInList = page.data?.items.some(
    (point) => point.code === selectedCode
  )
  return (
    <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        {page.status === "loading" ? (
          <CatalogLoading label="Đang tải ngữ pháp…" />
        ) : null}
        {page.error?.status === 404 ? (
          <ContentUnavailable title="Chưa có ngữ pháp cho ngôn ngữ này">
            Các mẫu câu sẽ xuất hiện tại đây khi được xuất bản.
          </ContentUnavailable>
        ) : (
          <CatalogFeedback
            error={page.error}
            onRetry={() =>
              void (page.data?.nextCursor && page.error?.status !== 400
                ? page.loadMore()
                : page.reload())
            }
          />
        )}
        {page.status === "ready" && !page.data.items.length ? (
          <ContentUnavailable title="Chưa có mẫu câu">
            Bạn có thể quay lại sau để xem mẫu câu mới.
          </ContentUnavailable>
        ) : null}
        {page.data?.items.length && page.error?.status !== 404 ? (
          <ul className="divide-y divide-border border-y border-border">
            {page.data.items.map((point) => (
              <li key={point.id}>
                <Link
                  id={`grammar-${point.code}`}
                  href={grammarHref(point.languageCode, point.code)}
                  scroll={false}
                  aria-current={
                    point.code === selectedCode ? "page" : undefined
                  }
                  className="group flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-md px-3 py-2.5 outline-none transition-colors hover:bg-muted/80 aria-[current=page]:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:py-2"
                >
                  <div className="min-w-0 space-y-1">
                    <h2
                      lang={point.translationLocale ?? point.languageCode}
                      className={cn(
                        "break-words text-base font-medium leading-snug transition-colors group-hover:text-primary",
                        (point.translationLocale ?? point.languageCode) ===
                          "ja" && "font-ja"
                      )}
                    >
                      {point.name}
                    </h2>
                    <p
                      lang={point.languageCode}
                      className={cn(
                        "break-words text-lg font-medium leading-relaxed text-foreground transition-colors group-hover:text-foreground sm:text-xl",
                        point.languageCode === "ja" && "font-ja"
                      )}
                    >
                      {point.pattern}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
                {!wide && selectedCode === point.code ? detail : null}
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
            {page.loadingMore ? "Đang tải ngữ pháp…" : "Xem thêm mẫu câu"}
          </Button>
        ) : null}
      </div>
      {wide
        ? (detail ?? <EmptyGrammarSelection />)
        : !selectedInList && page.status !== "loading"
          ? detail
          : null}
    </div>
  )
}

function EmptyGrammarSelection() {
  return (
    <div className="hidden min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-8 text-center lg:flex">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <TextQuote className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">
        Chưa chọn mẫu câu
      </p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        Chọn một mẫu ngữ pháp từ danh sách bên trái để xem cấu trúc và cách dùng chi tiết.
      </p>
    </div>
  )
}
