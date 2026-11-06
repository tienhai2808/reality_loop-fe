"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import {
  getItemProgress,
  listWritingProgress,
  recordItemProgress,
} from "../api/learning-progress-api"
import type {
  WritingProgressAction,
  WritingSystemItemProgress,
} from "../api/learning-progress-schemas"

export type ItemOperation = {
  status: "reading" | "saving" | "idle"
  error: FoundationsError | null
  notice?: string
  requiresRead?: boolean
}
type PageState = {
  status: "loading" | "ready" | "error"
  nextCursor: string | null
  loadingMore: boolean
  error: FoundationsError | null
}
const initialPage: PageState = {
  status: "loading",
  nextCursor: null,
  loadingMore: false,
  error: null,
}

// Mounted inside a viewer keyed by user/session + profile + language + system.
// There is no cross-user cache. Item locks survive detail close/navigation.
export function useWritingProgress(
  profileId: string | null,
  systemCode: string,
  onChanged: () => void
) {
  const [entries, setEntries] = useState<
    Map<string, WritingSystemItemProgress>
  >(() => new Map())
  const records = useRef(new Map<string, WritingSystemItemProgress>())
  const [operations, setOperations] = useState<Map<string, ItemOperation>>(
    () => new Map()
  )
  const operationStates = useRef(new Map<string, ItemOperation>())
  const activeItems = useRef(new Map<string, AbortController>())
  const activePage = useRef<AbortController | null>(null)
  const [page, setPage] = useState<PageState>(initialPage)
  const pageRef = useRef<PageState>(initialPage)

  const updateOperation = useCallback(
    (id: string, operation: ItemOperation) => {
      operationStates.current.set(id, operation)
      setOperations(new Map(operationStates.current))
    },
    []
  )
  const replace = useCallback((progress: WritingSystemItemProgress) => {
    const previous = records.current.get(progress.writingSystemItemId)
    if (previous && previous.version > progress.version) return
    records.current.set(progress.writingSystemItemId, progress)
    setEntries(new Map(records.current))
  }, [])
  const updatePage = useCallback((value: PageState) => {
    pageRef.current = value
    setPage(value)
  }, [])

  const loadPage = useCallback(
    async (more = false) => {
      if (!profileId || activePage.current) return
      const previous = pageRef.current
      if (previous.error?.retryAt && previous.error.retryAt > Date.now()) return
      const after = more ? previous.nextCursor : null
      if (more && !after) return
      const controller = new AbortController()
      activePage.current = controller
      updatePage({
        ...previous,
        status: more ? "ready" : "loading",
        loadingMore: more,
        error: null,
      })
      try {
        const result = await listWritingProgress(
          profileId,
          systemCode,
          after,
          controller.signal
        )
        if (controller.signal.aborted) return
        if (result.nextCursor && result.nextCursor === after)
          throw new FoundationsError(
            "Không tải được trang tiến độ kế tiếp. Hãy tải lại để thử lại."
          )
        for (const progress of result.items) {
          // A late catalog-aligned page must not overwrite an in-flight item action.
          if (!activeItems.current.has(progress.writingSystemItemId))
            replace(progress)
        }
        updatePage({
          status: "ready",
          nextCursor: result.nextCursor,
          loadingMore: false,
          error: null,
        })
      } catch (value) {
        if (!controller.signal.aborted)
          updatePage({
            ...previous,
            status: "error",
            loadingMore: false,
            error: normalizeFoundationsError(value),
          })
      } finally {
        if (activePage.current === controller) activePage.current = null
      }
    },
    [profileId, systemCode, replace, updatePage]
  )

  useEffect(() => {
    void loadPage()
    const itemRequests = activeItems.current
    return () => {
      activePage.current?.abort()
      activePage.current = null
      for (const controller of itemRequests.values()) controller.abort()
      itemRequests.clear()
    }
  }, [loadPage])

  const loadItem = useCallback(
    async (itemId: string, force = false) => {
      if (!profileId || activeItems.current.has(itemId)) return
      const previous = operationStates.current.get(itemId)
      if (previous?.error?.retryAt && previous.error.retryAt > Date.now())
        return
      if (!force && records.current.has(itemId) && !previous?.requiresRead)
        return
      const controller = new AbortController()
      activeItems.current.set(itemId, controller)
      updateOperation(itemId, { status: "reading", error: null })
      try {
        const progress = await getItemProgress(
          profileId,
          systemCode,
          itemId,
          controller.signal
        )
        if (controller.signal.aborted) return
        replace(progress)
        updateOperation(itemId, { status: "idle", error: null })
      } catch (value) {
        if (!controller.signal.aborted)
          updateOperation(itemId, {
            status: "idle",
            error: normalizeFoundationsError(value),
            requiresRead: true,
          })
      } finally {
        if (activeItems.current.get(itemId) === controller)
          activeItems.current.delete(itemId)
      }
    },
    [profileId, systemCode, replace, updateOperation]
  )

  const record = useCallback(
    async (itemId: string, action: WritingProgressAction) => {
      const progress = records.current.get(itemId)
      const previous = operationStates.current.get(itemId)
      if (
        !profileId ||
        !progress ||
        activeItems.current.has(itemId) ||
        previous?.requiresRead
      )
        return
      if (previous?.error?.retryAt && previous.error.retryAt > Date.now())
        return
      const controller = new AbortController()
      activeItems.current.set(itemId, controller)
      updateOperation(itemId, { status: "saving", error: null })
      try {
        const result = await recordItemProgress(
          profileId,
          systemCode,
          itemId,
          { action, version: progress.version },
          controller.signal
        )
        if (controller.signal.aborted) return
        replace(result)
        updateOperation(itemId, {
          status: "idle",
          error: null,
          notice: "Đã lưu tiến độ.",
        })
        onChanged()
      } catch (value) {
        if (controller.signal.aborted) return
        const error = normalizeFoundationsError(value)
        // A conflict or unknown result is resolved with a read, never another POST.
        if (
          error.status === 409 ||
          error.status === null ||
          error.status >= 500
        ) {
          try {
            const latest = await getItemProgress(
              profileId,
              systemCode,
              itemId,
              controller.signal
            )
            if (controller.signal.aborted) return
            replace(latest)
            updateOperation(itemId, {
              status: "idle",
              error: null,
              notice:
                error.status === 409
                  ? "Tiến độ đã đổi ở phiên khác. Hãy xem bản mới nhất trước khi thao tác."
                  : "Chưa xác nhận được thao tác. Hãy xem tiến độ đã lưu mới nhất trước khi thử lại.",
            })
            onChanged()
          } catch (readError) {
            if (!controller.signal.aborted) {
              const latestError = normalizeFoundationsError(readError)
              updateOperation(itemId, {
                status: "idle",
                requiresRead: true,
                error: new FoundationsError(
                  "Chưa xác nhận được tiến độ. Hãy tải lại trước khi ghi thêm lượt học.",
                  latestError.status,
                  latestError.retryAt,
                  latestError.traceId
                ),
              })
            }
          }
        } else {
          updateOperation(itemId, {
            status: "idle",
            error,
            requiresRead: true,
          })
          if (error.status === 404) onChanged()
        }
      } finally {
        if (activeItems.current.get(itemId) === controller)
          activeItems.current.delete(itemId)
      }
    },
    [profileId, systemCode, replace, updateOperation, onChanged]
  )

  return {
    entries,
    operations,
    page,
    loadItem,
    record,
    loadMore: () => loadPage(true),
    reload: () => loadPage(),
  }
}
