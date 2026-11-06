"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import type { RecordVocabularyReview } from "../api/vocabulary-learning-schemas"
import type { FoundationsError } from "@/features/language-foundations/api/language-foundations-errors"

type PendingReview = {
  payload: RecordVocabularyReview
  error?: FoundationsError
}

const Context = createContext<{
  revision: number
  invalidate: () => void
  pendingReviews: ReadonlyMap<string, PendingReview>
  savedCards: ReadonlyMap<string, string>
  rememberSavedCard: (key: string, cardId: string) => void
  rememberReview: (
    key: string,
    payload: RecordVocabularyReview,
    error?: FoundationsError
  ) => void
  forgetReview: (key: string) => void
} | null>(null)
export function VocabularyLearningProvider({
  children,
}: {
  children: ReactNode
}) {
  const { state } = useAuth()
  const owner =
    state.status === "authenticated"
      ? `${state.user.id}:${state.sessionId}`
      : "signed-out"
  return <ScopedProvider key={owner}>{children}</ScopedProvider>
}
function ScopedProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0)
  const [pendingReviews, setPendingReviews] = useState<
    Map<string, PendingReview>
  >(() => new Map())
  const [savedCards, setSavedCards] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  )
  const rememberSavedCard = useCallback((key: string, cardId: string) => {
    setSavedCards((previous) => new Map(previous).set(key, cardId))
  }, [])
  const invalidate = useCallback(() => setRevision((value) => value + 1), [])
  const rememberReview = useCallback(
    (key: string, payload: RecordVocabularyReview, error?: FoundationsError) =>
      setPendingReviews((previous) =>
        new Map(previous).set(key, { payload, error })
      ),
    []
  )
  const forgetReview = useCallback(
    (key: string) =>
      setPendingReviews((previous) => {
        const next = new Map(previous)
        next.delete(key)
        return next
      }),
    []
  )
  return (
    <Context.Provider
      value={{
        revision,
        invalidate,
        pendingReviews,
        savedCards,
        rememberSavedCard,
        rememberReview,
        forgetReview,
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useVocabularyLearning() {
  const context = useContext(Context)
  if (!context)
    throw new Error("Vocabulary learning requires the Learn layout.")
  return context
}
