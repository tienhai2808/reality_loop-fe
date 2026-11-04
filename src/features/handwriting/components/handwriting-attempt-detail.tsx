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
        aria-label="Saved handwriting navigation"
      >
        <Link
          href={`/learn/handwriting/${encodeURIComponent(profileId)}/history`}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Handwriting history
        </Link>
        <Link
          href="/learn/writing-systems"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Writing Systems
        </Link>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">
        Saved handwriting attempt
      </h1>
      {current.current?.profile.id !== profileId ? (
        <p className="text-sm leading-6 text-muted-foreground">
          This attempt is saved under another learning profile. Viewing it
          won&apos;t change your selection.
        </p>
      ) : null}
      {attempt.status === "loading" ? (
        <CatalogLoading label="Loading saved drawing and feedback..." />
      ) : null}
      {attempt.error?.status === 404 ? (
        <ContentUnavailable title="Attempt unavailable">
          This saved attempt could not be found. Choose another attempt from
          history.
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
                {attempt.data.attempt.passed ? "Passed" : "Needs improvement"}
              </span>
              <span className="text-sm text-muted-foreground">
                Shape match {attempt.data.attempt.matchScore} / 100
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              A geometry similarity result, including stroke order and direction
              feedback.
            </p>
            <p className="text-xs text-muted-foreground">
              <time dateTime={attempt.data.attempt.createdAt}>
                {new Intl.DateTimeFormat("en", {
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
                Practice again with a fresh drawing
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose this learning profile in Settings to start a fresh
                drawing for the same language.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              This attempt remains available even when its writing system is no
              longer published.
            </p>
          )}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
              Evaluation details
            </summary>
            <p className="pt-2">
              Algorithm: {attempt.data.attempt.algorithmVersion}
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
              Load reference for {character.template.symbol}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              A published reference isn&apos;t currently available. Your saved
              drawing and feedback are preserved.
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
        <CatalogLoading label="Loading reference strokes..." />
      ) : reference.error?.status === 404 ? (
        <p className="text-xs text-muted-foreground">
          This reference is no longer published. The saved drawing and feedback
          can still be reviewed.
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
