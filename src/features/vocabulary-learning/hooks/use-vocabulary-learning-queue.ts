"use client"

import { useCallback, useState } from "react"
import { useCatalogPage } from "@/features/language-foundations/hooks/use-catalog"
import { listVocabularyLearning } from "../api/vocabulary-learning-api"
import type { VocabularyLearningStatus } from "../api/vocabulary-learning-schemas"
import { useVocabularyLearning } from "../model/vocabulary-learning-context"

export function useVocabularyLearningQueue(
  profileId: string,
  locale: string,
  dueOnly: boolean,
  status?: VocabularyLearningStatus
) {
  const { revision } = useVocabularyLearning()
  const key = `vocabulary-learning:${profileId}:${locale}:${dueOnly}:${status}:${revision}`
  const [snapshot, setSnapshot] = useState<{
    key: string
    asOf: string
  } | null>(null)
  const loader = useCallback(
    async (after: string | null, signal: AbortSignal) => {
      const page = await listVocabularyLearning(
        profileId,
        locale,
        dueOnly,
        status,
        after,
        signal
      )
      if (!signal.aborted) setSnapshot({ key, asOf: page.asOf })
      return {
        items: page.items.map((card) => ({ ...card, id: card.progress.id })),
        nextCursor: page.nextCursor,
      }
    },
    [key, profileId, locale, dueOnly, status]
  )
  const queue = useCatalogPage(key, loader)
  return { ...queue, asOf: snapshot?.key === key ? snapshot.asOf : null }
}
