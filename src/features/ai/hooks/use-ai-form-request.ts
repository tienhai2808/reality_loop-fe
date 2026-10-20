"use client"

import { useEffect, useRef, useState } from "react"

import { normalizeAiError, type AiRequestError } from "../api/ai-errors"

export function useAiRetryWait(retryAt?: number) {
  const [elapsedDeadline, setElapsedDeadline] = useState<number>()
  useEffect(() => {
    if (!retryAt) return
    const deadline = retryAt
    let timer: number
    function schedule() {
      const remaining = deadline - Date.now()
      if (remaining <= 0) setElapsedDeadline(deadline)
      else
        timer = window.setTimeout(schedule, Math.min(remaining, 2_147_483_647))
    }
    timer = window.setTimeout(
      schedule,
      Math.max(0, Math.min(retryAt - Date.now(), 2_147_483_647))
    )
    return () => window.clearTimeout(timer)
  }, [retryAt])
  return retryAt !== undefined && elapsedDeadline !== retryAt
}

export function useAiFormRequest() {
  const mounted = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AiRequestError | null>(null)
  const waiting = useAiRetryWait(error?.retryAt)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      controller.current?.abort()
    }
  }, [])

  function reportError(value: unknown) {
    const next = normalizeAiError(value)
    setError(next)
    return next
  }

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (
      !mounted.current ||
      busy.current ||
      (error?.retryAt && error.retryAt > Date.now())
    )
      return
    busy.current = true
    setPending(true)
    setError(null)
    const nextController = new AbortController()
    controller.current = nextController
    try {
      await action(nextController.signal)
    } catch (value) {
      if (!nextController.signal.aborted) reportError(value)
    } finally {
      busy.current = false
      if (!nextController.signal.aborted) setPending(false)
    }
  }

  return { pending, error, waiting, run }
}
