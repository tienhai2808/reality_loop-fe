"use client"

import { useEffect, useRef, useState } from "react"
import {
  normalizeLearningProfileError,
  type LearningProfileError,
} from "../api/learning-profile-errors"

export function useLearningRetryWait(deadline?: number) {
  const [elapsed, setElapsed] = useState<number>()
  useEffect(() => {
    if (!deadline) return
    const retryAt = deadline
    let timer: number
    function tick() {
      const remaining = retryAt - Date.now()
      if (remaining <= 0) setElapsed(deadline)
      else timer = window.setTimeout(tick, Math.min(remaining, 2_147_483_647))
    }
    timer = window.setTimeout(
      tick,
      Math.max(0, Math.min(deadline - Date.now(), 2_147_483_647))
    )
    return () => window.clearTimeout(timer)
  }, [deadline])
  return deadline !== undefined && elapsed !== deadline
}

export function useLearningRequest() {
  const mounted = useRef(false)
  const active = useRef<AbortController | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<LearningProfileError | null>(null)
  const waiting = useLearningRetryWait(error?.retryAt)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      active.current?.abort()
    }
  }, [])

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (
      !mounted.current ||
      active.current ||
      (error?.retryAt && error.retryAt > Date.now())
    )
      return
    const controller = new AbortController()
    active.current = controller
    setPending(true)
    setError(null)
    try {
      await action(controller.signal)
    } catch (value) {
      if (!controller.signal.aborted)
        setError(normalizeLearningProfileError(value))
    } finally {
      active.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return { run, pending, error, waiting }
}
