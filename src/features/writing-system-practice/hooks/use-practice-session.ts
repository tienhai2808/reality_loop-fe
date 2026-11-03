"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import {
  abandonWritingPractice,
  getWritingPractice,
  submitWritingPracticeAnswer,
} from "../api/practice-api"
import type { WritingPracticeDetail } from "../api/practice-schemas"

type SessionState = {
  status: "loading" | "ready" | "saving" | "recovering" | "error"
  detail: WritingPracticeDetail | null
  error: FoundationsError | null
  notice: string | null
  questionId: string | null
}
const firstUnanswered = (detail: WritingPracticeDetail) =>
  [...detail.items]
    .sort((a, b) => a.position - b.position)
    .find((item) => item.answeredAt === null)?.id ?? null

// The route owner keys this hook by authenticated user/session + explicit profile/session IDs.
export function usePracticeSession(
  profileId: string,
  sessionId: string,
  creationSnapshot: WritingPracticeDetail | null
) {
  const [initial] = useState(creationSnapshot)
  const [state, setState] = useState<SessionState>(() => ({
    status: initial ? "ready" : "loading",
    detail: initial,
    error: null,
    notice: null,
    questionId: initial ? firstUnanswered(initial) : null,
  }))
  const saved = useRef(initial)
  const currentError = useRef<FoundationsError | null>(null)
  // One lock for GET/reconciliation, answers, and abandon. Never per-question locks.
  const active = useRef<AbortController | null>(null)
  const accept = useCallback(
    (
      detail: WritingPracticeDetail,
      questionId?: string,
      notice: string | null = null
    ) => {
      saved.current = detail
      currentError.current = null
      setState({
        status: "ready",
        detail,
        error: null,
        notice,
        questionId:
          questionId && detail.items.some((item) => item.id === questionId)
            ? questionId
            : firstUnanswered(detail),
      })
    },
    []
  )
  const readSaved = useCallback(
    async (controller: AbortController) => {
      try {
        const detail = await getWritingPractice(
          profileId,
          sessionId,
          controller.signal
        )
        if (!controller.signal.aborted) accept(detail)
      } catch (value) {
        if (!controller.signal.aborted) {
          const error = normalizeFoundationsError(value)
          currentError.current = error
          setState((previous) => ({ ...previous, status: "error", error }))
        }
      } finally {
        if (active.current === controller) active.current = null
      }
    },
    [profileId, sessionId, accept]
  )
  const reload = useCallback(async () => {
    if (
      active.current ||
      (currentError.current?.retryAt &&
        currentError.current.retryAt > Date.now())
    )
      return
    const controller = new AbortController()
    active.current = controller
    setState((previous) => ({
      ...previous,
      status: previous.detail ? "recovering" : "loading",
      error: null,
    }))
    await readSaved(controller)
  }, [readSaved])
  useEffect(() => {
    if (!initial) {
      const controller = new AbortController()
      active.current = controller
      void getWritingPractice(profileId, sessionId, controller.signal)
        .then(
          (detail) => {
            if (!controller.signal.aborted) accept(detail)
          },
          (value: unknown) => {
            if (controller.signal.aborted) return
            const error = normalizeFoundationsError(value)
            currentError.current = error
            setState((previous) => ({ ...previous, status: "error", error }))
          }
        )
        .finally(() => {
          if (active.current === controller) active.current = null
        })
    }
    return () => {
      active.current?.abort()
      active.current = null
    }
  }, [initial, profileId, sessionId, accept])

  const mutate = useCallback(
    async (
      action:
        | { kind: "answer"; questionId: string; selectedOptionIndex: number }
        | { kind: "abandon" }
    ) => {
      const snapshot = saved.current
      if (
        !snapshot ||
        snapshot.session.status !== "InProgress" ||
        active.current ||
        currentError.current
      )
        return false
      if (action.kind === "answer") {
        const question = snapshot.items.find(
          (item) => item.id === action.questionId
        )
        if (
          !question ||
          question.answeredAt !== null ||
          !Number.isInteger(action.selectedOptionIndex) ||
          action.selectedOptionIndex < 0 ||
          action.selectedOptionIndex >= question.options.length
        )
          return false
      }
      const controller = new AbortController()
      active.current = controller
      setState((previous) => ({
        ...previous,
        status: "saving",
        error: null,
        notice: null,
      }))
      try {
        const detail =
          action.kind === "answer"
            ? await submitWritingPracticeAnswer(
                profileId,
                sessionId,
                action.questionId,
                {
                  selectedOptionIndex: action.selectedOptionIndex,
                  version: snapshot.session.version,
                },
                controller.signal
              )
            : await abandonWritingPractice(
                profileId,
                sessionId,
                { version: snapshot.session.version },
                controller.signal
              )
        if (controller.signal.aborted) return false
        accept(detail, action.kind === "answer" ? action.questionId : undefined)
        return true
      } catch (value) {
        if (controller.signal.aborted) return false
        const error = normalizeFoundationsError(value)
        if (
          error.status === 409 ||
          error.status === null ||
          error.status >= 500
        ) {
          setState((previous) => ({ ...previous, status: "recovering" }))
          try {
            const detail = await getWritingPractice(
              profileId,
              sessionId,
              controller.signal
            )
            if (controller.signal.aborted) return false
            accept(
              detail,
              action.kind === "answer" ? action.questionId : undefined,
              error.status === 409
                ? "This session changed in another tab or device. The latest saved state is shown. Review it before continuing."
                : "The request's result was uncertain. The latest saved session is shown; no action was automatically repeated."
            )
          } catch (readError) {
            if (controller.signal.aborted) return false
            const latestError = normalizeFoundationsError(readError)
            const problem = new FoundationsError(
              "We couldn't confirm the saved session. Refresh it before submitting another answer or ending practice.",
              latestError.status,
              latestError.retryAt,
              latestError.traceId
            )
            currentError.current = problem
            setState((previous) => ({
              ...previous,
              status: "error",
              error: problem,
            }))
          }
        } else {
          currentError.current = error
          setState((previous) => ({ ...previous, status: "error", error }))
        }
        return false
      } finally {
        if (active.current === controller) active.current = null
      }
    },
    [profileId, sessionId, accept]
  )
  const navigate = (questionId: string) =>
    setState((previous) => ({ ...previous, questionId }))
  return { ...state, reload, mutate, navigate }
}
