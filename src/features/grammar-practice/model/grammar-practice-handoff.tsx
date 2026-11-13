"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import type { GrammarPracticeDetail } from "../api/grammar-practice-schemas"

const Context = createContext<{
  detail: GrammarPracticeDetail | null
  remember: (detail: GrammarPracticeDetail) => void
  clear: () => void
} | null>(null)
export function GrammarPracticeHandoffProvider({
  children,
}: {
  children: ReactNode
}) {
  const { state } = useAuth()
  const owner =
    state.status === "authenticated"
      ? `${state.user.id}:${state.sessionId}`
      : "signed-out"
  return <Handoff key={owner}>{children}</Handoff>
}
function Handoff({ children }: { children: ReactNode }) {
  const [detail, remember] = useState<GrammarPracticeDetail | null>(null)
  const clear = useCallback(() => remember(null), [])
  return (
    <Context.Provider value={{ detail, remember, clear }}>
      {children}
    </Context.Provider>
  )
}
export function useGrammarPracticeHandoff() {
  const value = useContext(Context)
  if (!value) throw new Error("Grammar practice requires Learn layout")
  return value
}
export const grammarSessionHref = (profileId: string, sessionId: string) =>
  `/learn/grammar/practice/${encodeURIComponent(profileId)}/${encodeURIComponent(sessionId)}`
