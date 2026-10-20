"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { listAiConnections, listAiProviders } from "../api/ai-api"
import { normalizeAiError, type AiRequestError } from "../api/ai-errors"
import type {
  AiConnectionDto,
  AiConnectionPage,
  AiProviderDto,
} from "../api/ai-schemas"

type Resource<T> =
  | { status: "loading"; data: T; error?: never }
  | { status: "loaded"; data: T; error?: never }
  | { status: "error"; data: T; error: AiRequestError }

export function useAiSettings() {
  const [providers, setProviders] = useState<Resource<AiProviderDto[]>>({
    status: "loading",
    data: [],
  })
  const [connections, setConnections] = useState<Resource<AiConnectionPage>>({
    status: "loading",
    data: { items: [], nextCursor: null },
  })
  const [loadingMore, setLoadingMore] = useState(false)
  const listRequest = useRef<AbortController | null>(null)
  const providerRequest = useRef<AbortController | null>(null)
  const paginationPending = useRef(false)

  const reloadProviders = useCallback(async () => {
    providerRequest.current?.abort()
    const controller = new AbortController()
    providerRequest.current = controller
    setProviders({ status: "loading", data: [] })
    try {
      const data = await listAiProviders(controller.signal)
      if (!controller.signal.aborted) setProviders({ status: "loaded", data })
    } catch (error) {
      if (!controller.signal.aborted)
        setProviders({
          status: "error",
          data: [],
          error: normalizeAiError(error),
        })
    }
  }, [])

  const reload = useCallback(async () => {
    listRequest.current?.abort()
    const controller = new AbortController()
    listRequest.current = controller
    paginationPending.current = false
    setLoadingMore(false)
    setConnections((current) => ({ status: "loading", data: current.data }))
    try {
      const data = await listAiConnections(null, controller.signal)
      if (!controller.signal.aborted) {
        setConnections({ status: "loaded", data })
        return true
      }
    } catch (error) {
      if (!controller.signal.aborted)
        setConnections((current) => ({
          status: "error",
          data: current.data,
          error: normalizeAiError(error),
        }))
    }
    return false
  }, [])

  useEffect(() => {
    // Both requests start immediately; provider catalogs are loaded only by form actions.
    void reloadProviders()
    void reload()
    return () => {
      providerRequest.current?.abort()
      listRequest.current?.abort()
    }
  }, [reload, reloadProviders])

  async function loadMore() {
    if (!connections.data.nextCursor || paginationPending.current) return
    paginationPending.current = true
    setLoadingMore(true)
    const controller = new AbortController()
    listRequest.current = controller
    try {
      const page = await listAiConnections(
        connections.data.nextCursor,
        controller.signal
      )
      if (!controller.signal.aborted)
        setConnections((current) => ({
          status: "loaded",
          data: {
            items: [
              ...current.data.items,
              ...page.items.filter(
                (item) =>
                  !current.data.items.some(
                    (existing) => existing.id === item.id
                  )
              ),
            ],
            nextCursor: page.nextCursor,
          },
        }))
    } catch (error) {
      if (!controller.signal.aborted)
        setConnections((current) => ({
          status: "error",
          data: current.data,
          error: normalizeAiError(error),
        }))
    } finally {
      if (!controller.signal.aborted) {
        paginationPending.current = false
        setLoadingMore(false)
      }
    }
  }

  function replace(connection: AiConnectionDto) {
    setConnections((current) => ({
      ...current,
      data: {
        ...current.data,
        items: current.data.items.map((item) =>
          item.id === connection.id ? connection : item
        ),
      },
    }))
  }

  return {
    providers,
    connections,
    loadingMore,
    reload,
    reloadProviders,
    loadMore,
    replace,
  }
}
