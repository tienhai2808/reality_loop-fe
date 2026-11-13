"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
export type PracticeSnapshot = {
  session: { status: string; version: number }
  items: {
    id: string
    position: number
    answeredAt: string | null
    options: string[]
  }[]
}
export type PracticeSessionApi<T extends PracticeSnapshot> = {
  get: (profileId: string, sessionId: string, signal: AbortSignal) => Promise<T>
  answer: (
    profileId: string,
    sessionId: string,
    questionId: string,
    body: { selectedOptionIndex: number; version: number },
    signal: AbortSignal
  ) => Promise<T>
  abandon: (
    profileId: string,
    sessionId: string,
    body: { version: number },
    signal: AbortSignal
  ) => Promise<T>
}

type SessionState<T extends PracticeSnapshot> = {
  status: "loading" | "ready" | "saving" | "recovering" | "error"
  detail: T | null
  error: FoundationsError | null
  notice: string | null
  questionId: string | null
}
const firstUnanswered = (detail: PracticeSnapshot) =>
  [...detail.items]
    .sort((a, b) => a.position - b.position)
    .find((item) => item.answeredAt === null)?.id ?? null

// The route owner keys this hook by authenticated user/session + explicit profile/session IDs.
export function usePracticeSessionEngine<T extends PracticeSnapshot>(
  profileId: string,
  sessionId: string,
  creationSnapshot: T | null,
  api: PracticeSessionApi<T>
) {
  const [initial] = useState(creationSnapshot)
  const [state, setState] = useState<SessionState<T>>(() => ({
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
    (detail: T, questionId?: string, notice: string | null = null) => {
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
        const detail = await api.get(profileId, sessionId, controller.signal)
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
    [profileId, sessionId, accept, api]
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
      void api
        .get(profileId, sessionId, controller.signal)
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
  }, [initial, profileId, sessionId, accept, api])

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
            ? await api.answer(
                profileId,
                sessionId,
                action.questionId,
                {
                  selectedOptionIndex: action.selectedOptionIndex,
                  version: snapshot.session.version,
                },
                controller.signal
              )
            : await api.abandon(
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
            const detail = await api.get(
              profileId,
              sessionId,
              controller.signal
            )
            if (controller.signal.aborted) return false
            accept(
              detail,
              action.kind === "answer" ? action.questionId : undefined,
              error.status === 409
                ? "Bài luyện đã đổi ở tab hoặc thiết bị khác. Hãy xem bản mới nhất trước khi tiếp tục."
                : "Chưa xác nhận được thao tác. Bên dưới là bài đã lưu mới nhất."
            )
          } catch (readError) {
            if (controller.signal.aborted) return false
            const latestError = normalizeFoundationsError(readError)
            const problem = new FoundationsError(
              "Chưa xác nhận được bài đã lưu. Hãy tải lại trước khi trả lời hoặc kết thúc.",
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
    [profileId, sessionId, accept, api]
  )
  const navigate = (questionId: string) =>
    setState((previous) => ({ ...previous, questionId }))
  return { ...state, reload, mutate, navigate }
}
