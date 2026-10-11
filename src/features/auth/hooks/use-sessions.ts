"use client"

import { useCallback, useEffect, useReducer } from "react"

import { getAuthErrorMessage } from "@/features/auth/api/auth-errors"
import type { AuthSession } from "@/features/auth/api/auth-schemas"
import { listSessions } from "@/features/auth/api/session-api"

type SessionsState =
  | {
      status: "loading"
      items: AuthSession[]
      nextCursor: string | null
      error: null
      loadingMore: false
    }
  | {
      status: "loaded"
      items: AuthSession[]
      nextCursor: string | null
      error: null
      loadingMore: boolean
    }
  | {
      status: "error"
      items: AuthSession[]
      nextCursor: string | null
      error: string
      loadingMore: false
    }

type SessionsAction =
  | {
      type: "loading"
    }
  | {
      type: "loaded"
      items: AuthSession[]
      nextCursor: string | null
    }
  | {
      type: "loading-more"
    }
  | {
      type: "append"
      items: AuthSession[]
      nextCursor: string | null
    }
  | {
      type: "error"
      error: string
    }

const initialState: SessionsState = {
  status: "loading",
  items: [],
  nextCursor: null,
  error: null,
  loadingMore: false,
}

export function useSessions() {
  const [state, dispatch] = useReducer(sessionsReducer, initialState)

  const load = useCallback(async () => {
    dispatch({ type: "loading" })

    try {
      const page = await listSessions()
      dispatch({
        type: "loaded",
        items: page.items,
        nextCursor: page.nextCursor,
      })
    } catch (error) {
      dispatch({
        type: "error",
        error: getAuthErrorMessage(error),
      })
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!state.nextCursor || state.loadingMore) {
      return
    }

    dispatch({ type: "loading-more" })

    try {
      const page = await listSessions({
        before: state.nextCursor,
      })
      dispatch({
        type: "append",
        items: page.items,
        nextCursor: page.nextCursor,
      })
    } catch (error) {
      dispatch({
        type: "error",
        error: getAuthErrorMessage(error),
      })
    }
  }, [state.loadingMore, state.nextCursor])

  useEffect(() => {
    void load()
  }, [load])

  return {
    state,
    reload: load,
    loadMore,
  }
}

function sessionsReducer(
  state: SessionsState,
  action: SessionsAction
): SessionsState {
  switch (action.type) {
    case "loading":
      return initialState
    case "loaded":
      return {
        status: "loaded",
        items: action.items,
        nextCursor: action.nextCursor,
        error: null,
        loadingMore: false,
      }
    case "loading-more":
      return {
        ...state,
        status: "loaded",
        error: null,
        loadingMore: true,
      }
    case "append":
      return {
        status: "loaded",
        items: [...state.items, ...action.items],
        nextCursor: action.nextCursor,
        error: null,
        loadingMore: false,
      }
    case "error":
      return {
        status: "error",
        items: state.items,
        nextCursor: state.nextCursor,
        error: action.error,
        loadingMore: false,
      }
  }
}

