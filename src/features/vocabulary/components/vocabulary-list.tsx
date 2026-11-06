"use client"

import Link from "next/link"
import { useCallback, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLearnWideLayout } from "@/features/learn/hooks/use-learn-wide-layout"
import { LearnDetailPane } from "@/features/learn/components/learn-detail-pane"
import { VocabularyDetailContent } from "./vocabulary-detail"
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
import {
  useCatalogPage,
  type CatalogCache,
} from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { listVocabulary } from "../api/vocabulary-api"
import {
  partOfSpeechSchema,
  type PartOfSpeech,
  type VocabularyEntrySummaryDto,
} from "../api/vocabulary-schemas"
import {
  partOfSpeechLabels,
  vocabularyListHref,
} from "../lib/vocabulary-labels"
import { VocabularyRow } from "./vocabulary-row"

export function VocabularyList() {
  const { state } = useCurrentLearningProfile()
  const { state: auth } = useAuth()
  const search = useSearchParams()
  const profile = state.current?.profile
  if (!profile || auth.status !== "authenticated") return null
  const selectedCode = search.get("entry")
  const rawFilter = search.get("partOfSpeech")
  const parsed = partOfSpeechSchema.safeParse(rawFilter)
  const detail = selectedCode ? (
    <LearnDetailPane
      label="Chi tiết từ"
      selection={selectedCode}
      closeHref={vocabularyListHref(parsed.success ? parsed.data : undefined)}
      triggerId={`word-${selectedCode}`}
    >
      <VocabularyDetailContent
        key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.targetLanguage}:${selectedCode}`}
        profileId={profile.id}
        languageCode={profile.targetLanguage}
        locale={profile.explanationLanguage}
        entryCode={selectedCode}
      />
    </LearnDetailPane>
  ) : null
  return (
    <>
      {rawFilter && !parsed.success ? (
        <ContentUnavailable title="Bộ lọc này không hợp lệ">
          <Link
            href={vocabularyListHref()}
            className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Xem tất cả từ
          </Link>
        </ContentUnavailable>
      ) : (
        <VocabularyListContent
          key={`${auth.user.id}:${auth.sessionId}:${profile.id}:${profile.targetLanguage}`}
          languageCode={profile.targetLanguage}
          locale={profile.explanationLanguage}
          partOfSpeech={parsed.success ? parsed.data : undefined}
          selectedCode={selectedCode}
          detail={detail}
        />
      )}
    </>
  )
}

const PART_OF_SPEECH_OPTIONS = [
  { value: "all", label: "Tất cả loại từ" },
  ...partOfSpeechSchema.options.map((value) => ({
    value,
    label: partOfSpeechLabels[value],
  })),
] as const

function VocabularyListContent({
  languageCode,
  locale,
  partOfSpeech,
  selectedCode,
  detail,
}: {
  languageCode: string
  locale: string
  partOfSpeech?: PartOfSpeech
  selectedCode: string | null
  detail: ReactNode
}) {
  const router = useRouter()
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listVocabulary(languageCode, locale, partOfSpeech, after, signal),
    [languageCode, locale, partOfSpeech]
  )
  const [cache] = useState<CatalogCache<VocabularyEntrySummaryDto>>(
    () => new Map()
  )
  const page = useCatalogPage(
    `vocabulary:${languageCode}:${locale}:${partOfSpeech ?? "all"}:20`,
    loader,
    cache
  )
  const wide = useLearnWideLayout()
  const selectedInList = page.data?.items.some(
    (entry) => entry.code === selectedCode
  )
  return (
    <div className="grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="vocabulary-part-of-speech"
            className="text-sm font-medium"
          >
            Loại từ
          </label>
          <Select
            items={PART_OF_SPEECH_OPTIONS}
            value={partOfSpeech ?? "all"}
            onValueChange={(val) => {
              const parsed = partOfSpeechSchema.safeParse(val)
              router.push(
                vocabularyListHref(parsed.success ? parsed.data : undefined),
                { scroll: false }
              )
            }}
          >
            <SelectTrigger
              id="vocabulary-part-of-speech"
              className="w-auto min-w-40"
            >
              <SelectValue placeholder="Tất cả loại từ" />
            </SelectTrigger>
            <SelectContent>
              {PART_OF_SPEECH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {page.status === "loading" ? (
          <CatalogLoading label="Đang tải từ vựng…" />
        ) : null}
        {page.error?.status === 404 ? (
          <ContentUnavailable title="Chưa có từ vựng cho ngôn ngữ này">
            Bạn có thể quay lại khi có từ mới.
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
          partOfSpeech ? (
            <ContentUnavailable title="Không có từ thuộc loại này">
              <Link
                href={vocabularyListHref()}
                className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                Xem tất cả từ
              </Link>
            </ContentUnavailable>
          ) : (
            <ContentUnavailable title="Chưa có từ vựng">
              Bạn có thể quay lại khi có từ mới.
            </ContentUnavailable>
          )
        ) : null}
        {page.data?.items.length && page.error?.status !== 404 ? (
          <ul className="divide-y divide-border border-y border-border">
            {page.data.items.map((entry) => (
              <li key={entry.id}>
                <VocabularyRow
                  entry={entry}
                  partOfSpeech={partOfSpeech}
                  selected={selectedCode === entry.code}
                />
                {!wide && selectedCode === entry.code ? detail : null}
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
            {page.loadingMore ? "Đang tải từ…" : "Xem thêm từ"}
          </Button>
        ) : null}
      </div>
      {wide || (!selectedInList && page.status !== "loading") ? detail : null}
    </div>
  )
}
