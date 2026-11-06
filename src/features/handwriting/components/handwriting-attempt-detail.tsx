"use client"

import Link from "next/link"
import { useCallback, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "@/features/language-foundations/components/catalog-feedback"
import { usePracticeCatalog } from "@/features/writing-system-practice/hooks/use-practice-catalog"
import {
  getHandwritingAttempt,
  getHandwritingTemplate,
} from "../api/handwriting-api"
import type { HandwritingAttemptCharacter } from "../api/handwriting-schemas"
import { handwritingWorkspaceHref } from "../lib/handwriting-labels"
import { HandwritingCharacterResult } from "./handwriting-results"

export function HandwritingAttemptDetailView({
  profileId,
  attemptId,
}: {
  profileId: string
  attemptId: string
}) {
  const { state } = useAuth()
  if (state.status !== "authenticated") return null
  return (
    <AttemptContent
      key={`${state.user.id}:${state.sessionId}:${profileId}:${attemptId}`}
      profileId={profileId}
      attemptId={attemptId}
    />
  )
}
function AttemptContent({
  profileId,
  attemptId,
}: {
  profileId: string
  attemptId: string
}) {
  const loader = useCallback(
    (signal: AbortSignal) =>
      getHandwritingAttempt(profileId, attemptId, signal),
    [profileId, attemptId]
  )
  const attempt = useCatalogResource(
    `handwriting-attempt:${profileId}:${attemptId}`,
    loader
  )
  const { systems, profile } = usePracticeCatalog(profileId)
  const { state: current } = useCurrentLearningProfile()
  const system = systems.data?.items.find(
    (item) => item.id === attempt.data?.attempt.writingSystemId
  )
  return (
    <div className="min-w-0 max-w-4xl space-y-6">
      <nav
        className="flex flex-wrap items-center justify-between gap-3"
        aria-label="Điều hướng bài viết đã lưu"
      >
        <Link
          href={`/learn/handwriting/${encodeURIComponent(profileId)}/history`}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Lịch sử luyện viết
        </Link>
        <Link
          href="/learn/writing-systems"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Bảng chữ
        </Link>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">Bài viết đã lưu</h1>
      {current.current?.profile.id !== profileId ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Bài viết này thuộc hồ sơ học khác.
        </p>
      ) : null}
      {attempt.status === "loading" ? (
        <CatalogLoading label="Đang tải bài viết và nhận xét…" />
      ) : null}
      {attempt.error?.status === 404 ? (
        <ContentUnavailable title="Không tìm thấy bài viết">
          Hãy chọn bài khác trong lịch sử.
        </ContentUnavailable>
      ) : (
        <CatalogFeedback
          error={attempt.error}
          onRetry={() => void attempt.reload()}
        />
      )}
      {attempt.data ? (
        <>
          <header className="space-y-2">
            <p
              lang={profile.data?.targetLanguage}
              className="font-ja break-all text-4xl leading-relaxed"
            >
              {attempt.data.attempt.targetText}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                  attempt.data.attempt.passed
                    ? "bg-success-subtle text-success"
                    : "bg-warning-subtle text-warning"
                )}
              >
                {attempt.data.attempt.passed ? "Đạt" : "Cần sửa"}
              </span>
              <span className="text-sm text-muted-foreground">
                Độ giống mẫu {attempt.data.attempt.matchScore} / 100
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Xem độ giống mẫu, thứ tự và hướng nét.
            </p>
            <p className="text-xs text-muted-foreground">
              <time dateTime={attempt.data.attempt.createdAt}>
                {new Intl.DateTimeFormat("vi-VN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(attempt.data.attempt.createdAt))}
              </time>
            </p>
          </header>
          {[...attempt.data.characters]
            .sort((a, b) => a.position - b.position)
            .map((character) => (
              <SavedCharacter
                key={character.id}
                profileId={profileId}
                systemCode={system?.code}
                character={character}
                languageCode={profile.data?.targetLanguage}
              />
            ))}
          {system ? (
            current.current?.profile.id === profileId ? (
              <Link
                href={handwritingWorkspaceHref(system.code)}
                className={buttonVariants({ variant: "outline" })}
              >
                Luyện viết lại
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chọn hồ sơ này trong Cài đặt để luyện viết cùng ngôn ngữ.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Bạn vẫn có thể xem bài đã lưu khi bảng chữ này ngừng phát hành.
            </p>
          )}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              Nhận xét chi tiết
            </summary>
            <p className="pt-2">
              Thuật toán: {attempt.data.attempt.algorithmVersion}
            </p>
          </details>
        </>
      ) : null}
    </div>
  )
}
function SavedCharacter({
  profileId,
  systemCode,
  character,
  languageCode,
}: {
  profileId: string
  systemCode?: string
  character: HandwritingAttemptCharacter
  languageCode?: string
}) {
  const [showReference, setShowReference] = useState(false)
  return (
    <div className="space-y-3">
      {systemCode && showReference ? (
        <SavedReference
          profileId={profileId}
          systemCode={systemCode}
          character={character}
          languageCode={languageCode}
        />
      ) : (
        <>
          <HandwritingCharacterResult
            character={character}
            languageCode={languageCode}
          />
          {systemCode ? (
            <Button variant="ghost" onClick={() => setShowReference(true)}>
              Tải mẫu cho chữ {character.template.symbol}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Mẫu hiện không có. Bài viết và nhận xét vẫn có thể xem.
            </p>
          )}
        </>
      )}
    </div>
  )
}
function SavedReference({
  profileId,
  systemCode,
  character,
  languageCode,
}: {
  profileId: string
  systemCode: string
  character: HandwritingAttemptCharacter
  languageCode?: string
}) {
  const loader = useCallback(
    (signal: AbortSignal) =>
      getHandwritingTemplate(
        profileId,
        systemCode,
        character.template.id,
        signal
      ),
    [profileId, systemCode, character.template.id]
  )
  const reference = useCatalogResource(
    `saved-handwriting-reference:${profileId}:${systemCode}:${character.template.id}:${character.template.revision}`,
    loader
  )
  return (
    <div className="space-y-3">
      <HandwritingCharacterResult
        character={character}
        languageCode={languageCode}
        reference={reference.data ?? undefined}
      />
      {reference.status === "loading" ? (
        <CatalogLoading label="Đang tải nét mẫu…" />
      ) : reference.error?.status === 404 ? (
        <p className="text-xs text-muted-foreground">
          Mẫu đã ngừng phát hành. Bạn vẫn có thể xem bài viết và nhận xét.
        </p>
      ) : (
        <CatalogFeedback
          error={reference.error}
          onRetry={() => void reference.reload()}
        />
      )}
    </div>
  )
}
