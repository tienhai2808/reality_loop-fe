"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "../api/language-foundations-errors"
import type { CatalogPage } from "../api/language-foundations-schemas"

type Resource<T> =
  | { status: "loading"; data: T | null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: T | null; error: FoundationsError }

// Local feature resources: keys isolate late responses and scope cancellation to the displayed content.
export function useCatalogResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>
) {
  const [record, setRecord] = useState<{ key: string; value: Resource<T> }>({
    key,
    value: { status: "loading", data: null, error: null },
  })
  const active = useRef<AbortController | null>(null)
  const value: Resource<T> =
    record.key === key
      ? record.value
      : { status: "loading", data: null, error: null }
  const reload = useCallback(async () => {
    if (
      active.current ||
      (record.key === key &&
        record.value.error?.retryAt &&
        record.value.error.retryAt > Date.now())
    )
      return
    const controller = new AbortController()
    active.current = controller
    setRecord({ key, value: { status: "loading", data: null, error: null } })
    try {
      const data = await loader(controller.signal)
      if (!controller.signal.aborted)
        setRecord({ key, value: { status: "ready", data, error: null } })
    } catch (error) {
      if (!controller.signal.aborted)
        setRecord({
          key,
          value: {
            status: "error",
            data: null,
            error: normalizeFoundationsError(error),
          },
        })
    } finally {
      if (active.current === controller) active.current = null
    }
  }, [key, loader, record])

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    async function load() {
      setRecord({ key, value: { status: "loading", data: null, error: null } })
      try {
        const data = await loader(controller.signal)
        if (!controller.signal.aborted)
          setRecord({ key, value: { status: "ready", data, error: null } })
      } catch (error) {
        if (!controller.signal.aborted)
          setRecord({
            key,
            value: {
              status: "error",
              data: null,
              error: normalizeFoundationsError(error),
            },
          })
      } finally {
        if (active.current === controller) active.current = null
      }
    }
    void load()
    return () => {
      active.current?.abort()
      active.current = null
    }
  }, [key, loader])
  return { ...value, reload }
}

export type CatalogCache<T> = Map<
  string,
  { page: CatalogPage<T>; fetchedAt: number }
>

export function useCatalogPage<T extends { id: string }>(
  key: string,
  loader: (
    after: string | null,
    signal: AbortSignal
  ) => Promise<CatalogPage<T>>,
  cache?: CatalogCache<T>
) {
  type PageState = Resource<CatalogPage<T>> & { loadingMore: boolean }
  const [record, setRecord] = useState<{ key: string; value: PageState }>({
    key,
    value: { status: "loading", data: null, error: null, loadingMore: false },
  })
  const active = useRef<AbortController | null>(null)
  const value: PageState =
    record.key === key
      ? record.value
      : { status: "loading", data: null, error: null, loadingMore: false }

  const load = useCallback(
    async (previous?: CatalogPage<T>) => {
      if (
        active.current ||
        (record.key === key &&
          record.value.error?.retryAt &&
          record.value.error.retryAt > Date.now())
      )
        return
      const controller = new AbortController()
      active.current = controller
      setRecord({
        key,
        value: previous
          ? { status: "ready", data: previous, error: null, loadingMore: true }
          : { status: "loading", data: null, error: null, loadingMore: false },
      })
      try {
        const page = await loader(
          previous?.nextCursor ?? null,
          controller.signal
        )
        if (controller.signal.aborted) return
        if (page.nextCursor && previous?.nextCursor === page.nextCursor)
          throw new FoundationsError(
            "The next page couldn't be loaded. Please refresh this content."
          )
        const items = new Map(
          (previous?.items ?? []).map((item) => [item.id, item])
        )
        for (const item of page.items) items.set(item.id, item)
        const merged = {
          items: [...items.values()],
          nextCursor: page.nextCursor,
        }
        cache?.set(key, { page: merged, fetchedAt: Date.now() })
        setRecord({
          key,
          value: {
            status: "ready",
            data: merged,
            error: null,
            loadingMore: false,
          },
        })
      } catch (error) {
        if (!controller.signal.aborted)
          setRecord({
            key,
            value: {
              status: "error",
              data: previous ?? null,
              error: normalizeFoundationsError(error),
              loadingMore: false,
            },
          })
      } finally {
        if (active.current === controller) active.current = null
      }
    },
    [cache, key, loader, record]
  )

  useEffect(() => {
    const controller = new AbortController()
    active.current = controller
    async function start() {
      const cached = cache?.get(key)
      if (cached && Date.now() - cached.fetchedAt < 5 * 60_000) {
        setRecord({
          key,
          value: {
            status: "ready",
            data: cached.page,
            error: null,
            loadingMore: false,
          },
        })
        active.current = null
        return
      }
      setRecord({
        key,
        value: {
          status: "loading",
          data: null,
          error: null,
          loadingMore: false,
        },
      })
      try {
        const page = await loader(null, controller.signal)
        if (!controller.signal.aborted) {
          const data = {
            ...page,
            items: [
              ...new Map(page.items.map((item) => [item.id, item])).values(),
            ],
          }
          cache?.set(key, { page: data, fetchedAt: Date.now() })
          setRecord({
            key,
            value: { status: "ready", data, error: null, loadingMore: false },
          })
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setRecord({
            key,
            value: {
              status: "error",
              data: null,
              error: normalizeFoundationsError(error),
              loadingMore: false,
            },
          })
      } finally {
        if (active.current === controller) active.current = null
      }
    }
    void start()
    return () => {
      active.current?.abort()
      active.current = null
    }
  }, [cache, key, loader])
  return {
    ...value,
    reload: () => load(),
    loadMore: () =>
      value.data?.nextCursor ? load(value.data) : Promise.resolve(),
  }
}
