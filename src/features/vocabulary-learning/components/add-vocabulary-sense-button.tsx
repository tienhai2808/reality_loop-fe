"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { CatalogFeedback } from "@/features/language-foundations/components/catalog-feedback"
import {
  normalizeFoundationsError,
  type FoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import { addVocabularySense } from "../api/vocabulary-learning-api"
import { useVocabularyLearning } from "../model/vocabulary-learning-context"
import { savedVocabularyHref } from "../lib/review-copy"

export function AddVocabularySenseButton({
  profileId,
  senseId,
}: {
  profileId: string
  senseId: string
}) {
  const search = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<FoundationsError | null>(null)
  const active = useRef<AbortController | null>(null)
  const { invalidate, savedCards, rememberSavedCard } = useVocabularyLearning()
  const senseKey = `${profileId}:${senseId}`
  const savedCardId = savedCards.get(senseKey)
  useEffect(
    () => () => {
      active.current?.abort()
    },
    []
  )
  async function add() {
    if (
      active.current ||
      savedCardId ||
      (error?.retryAt && error.retryAt > Date.now())
    )
      return
    const controller = new AbortController()
    active.current = controller
    setPending(true)
    setError(null)
    try {
      const saved = await addVocabularySense(
        profileId,
        senseId,
        controller.signal
      )
      if (controller.signal.aborted) return
      rememberSavedCard(senseKey, saved.id)
      invalidate()
    } catch (value) {
      if (!controller.signal.aborted) setError(normalizeFoundationsError(value))
    } finally {
      if (active.current === controller) active.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <div className="space-y-2">
      {savedCardId ? (
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" className="text-xs text-muted-foreground">
            Đã lưu để ôn
          </span>
          <Link
            href={savedVocabularyHref(new URLSearchParams(search), savedCardId)}
            scroll={false}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Xem thẻ
          </Link>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pending || !!error}
          aria-busy={pending}
          onClick={() => void add()}
        >
          {pending ? "Đang lưu nghĩa…" : "Lưu để ôn"}
        </Button>
      )}
      <CatalogFeedback error={error} onRetry={() => void add()} />
    </div>
  )
}
