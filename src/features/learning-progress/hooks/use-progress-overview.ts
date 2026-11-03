"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useCatalogResource } from "@/features/language-foundations/hooks/use-catalog"
import { getWritingProgressOverview } from "../api/learning-progress-api"

// The owning viewer is keyed by user/session, profile, and displayed language.
export function useProgressOverview(profileId: string | null) {
  const [revision, setRevision] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryAt = useRef<number | undefined>(undefined)
  const loader = useCallback(
    (signal: AbortSignal) =>
      profileId
        ? getWritingProgressOverview(profileId, signal)
        : Promise.resolve(null),
    [profileId]
  )
  const overview = useCatalogResource(
    `progress-overview:${profileId}:${revision}`,
    loader
  )
  useEffect(() => {
    retryAt.current = overview.error?.retryAt
  }, [overview.error])
  const refresh = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    function updateWhenAllowed() {
      const delay = (retryAt.current ?? 0) - Date.now()
      if (delay > 0) {
        timer.current = setTimeout(
          updateWhenAllowed,
          Math.min(delay, 2_147_483_647)
        )
        return
      }
      timer.current = null
      setRevision((value) => value + 1)
    }
    timer.current = setTimeout(updateWhenAllowed, 180)
  }, [])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  return { ...overview, refresh }
}
