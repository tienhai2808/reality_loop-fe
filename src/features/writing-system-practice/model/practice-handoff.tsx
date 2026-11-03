"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import type { WritingPracticeDetail } from "../api/practice-schemas"

type Handoff = {
  detail: WritingPracticeDetail | null
  remember: (detail: WritingPracticeDetail) => void
  clear: () => void
}
const Context = createContext<Handoff | null>(null)

export function PracticeHandoffProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const owner =
    state.status === "authenticated"
      ? `${state.user.id}:${state.sessionId}`
      : "signed-out"
  return <ScopedHandoff key={owner}>{children}</ScopedHandoff>
}
function ScopedHandoff({ children }: { children: ReactNode }) {
  // One creation response, transferred across Learn routes. Not a session cache.
  const [detail, remember] = useState<WritingPracticeDetail | null>(null)
  const clear = useCallback(() => remember(null), [])
  return (
    <Context.Provider value={{ detail, remember, clear }}>
      {children}
    </Context.Provider>
  )
}
export function usePracticeHandoff() {
  const context = useContext(Context)
  if (!context) throw new Error("Practice requires the Learn layout.")
  return context
}

export function practiceSessionHref(profileId: string, sessionId: string) {
  return `/learn/practice/${encodeURIComponent(profileId)}/${encodeURIComponent(sessionId)}`
}
export function practiceHistoryHref(systemCode?: string) {
  return `/learn/practice/history${systemCode ? `?${new URLSearchParams({ system: systemCode })}` : ""}`
}
