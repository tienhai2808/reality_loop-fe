"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  getCurrentLearningProfile,
  selectCurrentLearningProfile,
} from "../api/learning-profile-api"
import {
  LearningProfileError,
  normalizeLearningProfileError,
} from "../api/learning-profile-errors"
import type {
  CurrentLearningProfile,
  LearningProfile,
} from "../api/learning-profile-schemas"

type CurrentProfileState =
  | { status: "loading"; current: null }
  | { status: "ready"; current: CurrentLearningProfile | null }
  | {
      status: "error"
      current: CurrentLearningProfile | null
      error: LearningProfileError
    }

type CurrentProfileContextValue = {
  state: CurrentProfileState
  selectingId: string | null
  refreshCurrent: () => Promise<CurrentLearningProfile | null>
  selectCurrent: (
    id: string,
    signal?: AbortSignal
  ) => Promise<CurrentLearningProfile>
  replaceProfile: (profile: LearningProfile) => void
}

const CurrentProfileContext = createContext<CurrentProfileContextValue | null>(
  null
)

export function CurrentLearningProfileProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { state: auth } = useAuth()
  const owner =
    auth.status === "authenticated" ? `${auth.user.id}:${auth.sessionId}` : null
  const [record, setRecord] = useState<{
    owner: string | null
    state: CurrentProfileState
  }>({ owner: null, state: { status: "loading", current: null } })
  const [selectionState, setSelectionState] = useState<{
    owner: string | null
    id: string | null
  }>({ owner: null, id: null })
  const state: CurrentProfileState =
    owner && record.owner === owner
      ? record.state
      : { status: "loading", current: null }
  const setState = useCallback(
    (update: React.SetStateAction<CurrentProfileState>) => {
      setRecord((previous) => {
        const old: CurrentProfileState =
          previous.owner === owner
            ? previous.state
            : { status: "loading", current: null }
        return {
          owner,
          state: typeof update === "function" ? update(old) : update,
        }
      })
    },
    [owner]
  )
  const mounted = useRef(false)
  const revision = useRef(0)
  const query = useRef<{
    controller: AbortController
    promise: Promise<CurrentLearningProfile | null>
  } | null>(null)
  const selection = useRef<AbortController | null>(null)
  const invalidateQuery = useCallback(() => {
    revision.current += 1
    query.current?.controller.abort()
    query.current = null
  }, [])

  const refreshCurrent = useCallback(() => {
    if (!owner)
      return Promise.reject(
        new LearningProfileError(
          "Please sign in to load your learning profile.",
          401
        )
      )
    if (query.current) return query.current.promise
    const controller = new AbortController()
    const startedAtRevision = revision.current
    const promise: Promise<CurrentLearningProfile | null> =
      getCurrentLearningProfile(controller.signal)
        .then((current) => {
          if (
            !controller.signal.aborted &&
            startedAtRevision === revision.current
          )
            setState((previous) => {
              // A late GET must not replace preferences already updated in this browser.
              if (
                previous.current &&
                current &&
                previous.current.profile.id === current.profile.id &&
                previous.current.profile.version > current.profile.version
              ) {
                return {
                  status: "ready",
                  current: { ...current, profile: previous.current.profile },
                }
              }
              return { status: "ready", current }
            })
          return current
        })
        .catch((value: unknown) => {
          const error = normalizeLearningProfileError(value)
          if (
            !controller.signal.aborted &&
            startedAtRevision === revision.current
          )
            setState((previous) => ({
              status: "error",
              current: previous.current,
              error,
            }))
          throw error
        })
        .finally(() => {
          if (query.current?.promise === promise) query.current = null
        })
    query.current = { controller, promise }
    return promise
  }, [owner, setState])

  useEffect(() => {
    mounted.current = true
    if (owner) void refreshCurrent().catch(() => undefined)
    return () => {
      mounted.current = false
      revision.current += 1
      query.current?.controller.abort()
      query.current = null
      selection.current?.abort()
      selection.current = null
    }
  }, [owner, refreshCurrent])

  const selectCurrent = useCallback(
    async (id: string, signal?: AbortSignal) => {
      if (selection.current)
        throw new LearningProfileError(
          "A profile selection is already being saved."
        )
      invalidateQuery()
      const controller = new AbortController()
      selection.current = controller
      setSelectionState({ owner, id })
      try {
        const current = await selectCurrentLearningProfile(
          id,
          signal
            ? AbortSignal.any([signal, controller.signal])
            : controller.signal
        )
        if (mounted.current && !controller.signal.aborted && !signal?.aborted) {
          invalidateQuery()
          setState({ status: "ready", current })
        }
        return current
      } catch (error) {
        if (mounted.current && !controller.signal.aborted)
          void refreshCurrent().catch(() => undefined)
        throw error
      } finally {
        if (selection.current === controller) selection.current = null
        if (mounted.current && !controller.signal.aborted)
          setSelectionState({ owner, id: null })
      }
    },
    [invalidateQuery, owner, refreshCurrent, setState]
  )

  const replaceProfile = useCallback(
    (profile: LearningProfile) => {
      setState((previous) =>
        previous.current?.profile.id === profile.id
          ? { status: "ready", current: { ...previous.current, profile } }
          : previous
      )
    },
    [setState]
  )

  return (
    <CurrentProfileContext.Provider
      value={{
        state,
        selectingId: selectionState.owner === owner ? selectionState.id : null,
        refreshCurrent,
        selectCurrent,
        replaceProfile,
      }}
    >
      {children}
    </CurrentProfileContext.Provider>
  )
}

export function useCurrentLearningProfile() {
  const context = useContext(CurrentProfileContext)
  if (!context)
    throw new Error(
      "Learning Profile state requires an authenticated CurrentLearningProfileProvider."
    )
  return context
}
