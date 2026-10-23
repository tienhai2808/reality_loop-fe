"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getLearningProfileOptions,
  listLearningProfiles,
} from "../api/learning-profile-api"
import {
  LearningProfileError,
  normalizeLearningProfileError,
} from "../api/learning-profile-errors"
import type {
  LearningProfile,
  LearningProfileOptions,
  LearningProfilePage,
} from "../api/learning-profile-schemas"
import { useCurrentLearningProfile } from "./use-current-learning-profile"

type Resource<T> =
  | { status: "loading" | "ready"; data: T; error?: never }
  | { status: "error"; data: T; error: LearningProfileError }

export function useLearningProfiles() {
  const { refreshCurrent } = useCurrentLearningProfile()
  const [options, setOptions] = useState<
    Resource<LearningProfileOptions | null>
  >({ status: "loading", data: null })
  const [profiles, setProfiles] = useState<Resource<LearningProfilePage>>({
    status: "loading",
    data: { items: [], nextCursor: null },
  })
  const [loadingMore, setLoadingMore] = useState(false)
  const optionsRequest = useRef<AbortController | null>(null)
  const listRequest = useRef<AbortController | null>(null)
  const pagination = useRef(false)

  const reloadOptions = useCallback(async () => {
    optionsRequest.current?.abort()
    const controller = new AbortController()
    optionsRequest.current = controller
    setOptions({ status: "loading", data: null })
    try {
      const data = await getLearningProfileOptions(controller.signal)
      if (!controller.signal.aborted) setOptions({ status: "ready", data })
    } catch (value) {
      if (!controller.signal.aborted)
        setOptions({
          status: "error",
          data: null,
          error: normalizeLearningProfileError(value),
        })
    }
  }, [])

  const reload = useCallback(async () => {
    listRequest.current?.abort()
    const controller = new AbortController()
    listRequest.current = controller
    pagination.current = false
    setLoadingMore(false)
    setProfiles((previous) => ({ status: "loading", data: previous.data }))
    try {
      const data = await listLearningProfiles(null, controller.signal)
      if (!controller.signal.aborted) {
        setProfiles({ status: "ready", data })
        return data
      }
    } catch (value) {
      if (!controller.signal.aborted)
        setProfiles((previous) => ({
          status: "error",
          data: previous.data,
          error: normalizeLearningProfileError(value),
        }))
    }
    return null
  }, [])

  useEffect(() => {
    // Options, profiles, and current selection are independent browser-authenticated requests.
    void reloadOptions()
    void reload()
    void refreshCurrent().catch(() => undefined)
    return () => {
      optionsRequest.current?.abort()
      listRequest.current?.abort()
    }
  }, [refreshCurrent, reload, reloadOptions])

  async function loadMore() {
    if (!profiles.data.nextCursor || pagination.current) return
    pagination.current = true
    setLoadingMore(true)
    const controller = new AbortController()
    listRequest.current = controller
    try {
      const page = await listLearningProfiles(
        profiles.data.nextCursor,
        controller.signal
      )
      if (!controller.signal.aborted)
        setProfiles((previous) => ({
          status: "ready",
          data: {
            items: [
              ...previous.data.items,
              ...page.items.filter(
                (item) => !previous.data.items.some((old) => old.id === item.id)
              ),
            ],
            nextCursor: page.nextCursor,
          },
        }))
    } catch (value) {
      if (!controller.signal.aborted)
        setProfiles((previous) => ({
          status: "error",
          data: previous.data,
          error: normalizeLearningProfileError(value),
        }))
    } finally {
      if (!controller.signal.aborted) {
        pagination.current = false
        setLoadingMore(false)
      }
    }
  }

  function replaceProfile(profile: LearningProfile) {
    setProfiles((previous) => ({
      ...previous,
      data: {
        ...previous.data,
        items: previous.data.items.map((old) =>
          old.id === profile.id ? profile : old
        ),
      },
    }))
  }

  async function recoverCreation(
    targetLanguage: string,
    signal: AbortSignal
  ): Promise<LearningProfile | null> {
    listRequest.current?.abort()
    const items: LearningProfile[] = []
    const seen = new Set<string>()
    let cursor: string | null = null
    // A normalized language is unique per user. Search server pages before allowing another POST.
    do {
      const page = await listLearningProfiles(cursor, signal)
      if (signal.aborted)
        throw new LearningProfileError("The profile refresh was cancelled.")
      items.push(...page.items)
      cursor = page.nextCursor
      const found = items.find(
        (profile) =>
          profile.targetLanguage.toLowerCase() ===
          targetLanguage.trim().toLowerCase()
      )
      if (found || !cursor) {
        setProfiles({ status: "ready", data: { items, nextCursor: cursor } })
        return found ?? null
      }
      if (seen.has(cursor))
        throw new LearningProfileError(
          "We couldn't finish refreshing your profiles. Please try again."
        )
      seen.add(cursor)
    } while (cursor)
    return null
  }

  return {
    options,
    profiles,
    loadingMore,
    reloadOptions,
    reload,
    loadMore,
    replaceProfile,
    recoverCreation,
  }
}
