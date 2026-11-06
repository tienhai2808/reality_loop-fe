"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  normalizeFoundationsError,
  FoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import { recordVocabularyReview } from "../api/vocabulary-learning-api"
import type {
  RecordVocabularyReview,
  VocabularyReview,
  VocabularyReviewRating,
} from "../api/vocabulary-learning-schemas"
import { useVocabularyLearning } from "../model/vocabulary-learning-context"

type ReviewState =
  | { status: "idle" }
  | { status: "submitting"; payload: RecordVocabularyReview }
  | {
      status: "retry"
      payload: RecordVocabularyReview
      error: FoundationsError
    }
  | { status: "conflict" }
  | { status: "saved"; receipt: VocabularyReview }

export function useVocabularyReview(profileId: string, progressId: string) {
  const { invalidate, pendingReviews, rememberReview, forgetReview } =
    useVocabularyLearning()
  const key = `${profileId}:${progressId}`
  const [initial] = useState(pendingReviews.get(key) ?? null)
  const [state, setState] = useState<ReviewState>(() =>
    initial
      ? {
          status: "retry",
          payload: initial.payload,
          error:
            initial.error ??
            new FoundationsError(
              "Một đánh giá trước chưa được xác nhận. Hãy thử lại đánh giá đó trước."
            ),
        }
      : { status: "idle" }
  )
  const pending = useRef<RecordVocabularyReview | null>(
    initial?.payload ?? null
  )
  const ready = useRef(initial === null)
  const active = useRef<AbortController | null>(null)
  const failure = useRef<FoundationsError | null>(initial?.error ?? null)
  useEffect(
    () => () => {
      active.current?.abort()
    },
    []
  )
  const send = useCallback(
    async (payload: RecordVocabularyReview) => {
      if (
        active.current ||
        (failure.current?.retryAt && failure.current.retryAt > Date.now())
      )
        return
      const controller = new AbortController()
      active.current = controller
      setState({ status: "submitting", payload })
      try {
        const receipt = await recordVocabularyReview(
          profileId,
          progressId,
          payload,
          controller.signal
        )
        if (controller.signal.aborted) return
        pending.current = null
        forgetReview(key)
        failure.current = null
        setState({ status: "saved", receipt })
        // Never derive progress or write an old receipt into the card cache.
        invalidate()
      } catch (value) {
        if (controller.signal.aborted) return
        const error = normalizeFoundationsError(value)
        failure.current = error
        if (error.status === 409) {
          pending.current = null
          forgetReview(key)
          setState({ status: "conflict" })
          invalidate()
        } else {
          rememberReview(key, payload, error)
          setState({ status: "retry", payload, error })
        }
      } finally {
        if (active.current === controller) active.current = null
      }
    },
    [profileId, progressId, invalidate, forgetReview, rememberReview, key]
  )
  function rate(rating: VocabularyReviewRating, version: number) {
    if (
      active.current ||
      pending.current ||
      !ready.current ||
      state.status !== "idle"
    )
      return
    ready.current = false
    const payload = Object.freeze({
      requestId: crypto.randomUUID(),
      version,
      rating,
    })
    pending.current = payload
    rememberReview(key, payload)
    failure.current = null
    void send(payload)
  }
  function retry() {
    if (pending.current) void send(pending.current)
  }
  function reloadForNewAction() {
    if (active.current) return
    pending.current = null
    forgetReview(key)
    failure.current = null
    setState({ status: "conflict" })
    invalidate()
  }
  function confirmLatest() {
    if (!active.current) {
      failure.current = null
      ready.current = true
      setState({ status: "idle" })
    }
  }
  return { state, rate, retry, reloadForNewAction, confirmLatest }
}
