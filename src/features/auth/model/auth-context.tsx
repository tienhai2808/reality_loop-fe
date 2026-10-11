"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react"
import { useRouter } from "next/navigation"

import {
  clearBrowserSession,
  logoutBrowserSession,
} from "@/features/auth/api/auth-api"
import { networkAuthError } from "@/features/auth/api/auth-errors"
import type { BrowserAuthSession } from "@/features/auth/api/auth-schemas"
import { authReducer } from "@/features/auth/model/auth-reducer"
import type {
  AuthContextValue,
  AuthState,
} from "@/features/auth/model/auth-types"
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  setStoredAuthSession,
} from "@/features/auth/model/auth-session-store"
import { refreshSessionSingleFlight } from "@/features/auth/model/refresh-coordinator"

const initialState: AuthState = {
  status: "bootstrapping",
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const [state, dispatch] = useReducer(authReducer, initialState)
  const explicitSessionRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const session = await refreshSessionSingleFlight()

        if (cancelled || explicitSessionRef.current) {
          return
        }

        setStoredAuthSession(session)
        dispatch({
          type: "authenticated",
          session,
        })
      } catch {
        if (cancelled || explicitSessionRef.current || getStoredAccessToken()) {
          return
        }

        clearStoredAuthSession()
        dispatch({
          type: "unauthenticated",
        })
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const setAuthenticatedSession = useCallback((session: BrowserAuthSession) => {
    explicitSessionRef.current = true
    setStoredAuthSession(session)
    dispatch({
      type: "authenticated",
      session,
    })
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const session = await refreshSessionSingleFlight()
      explicitSessionRef.current = true
      setStoredAuthSession(session)
      dispatch({
        type: "authenticated",
        session,
      })
      return session
    } catch {
      explicitSessionRef.current = false
      clearStoredAuthSession()
      await clearBrowserSession()
      dispatch({
        type: "unauthenticated",
      })
      return null
    }
  }, [])

  const signOut = useCallback(async () => {
    const accessToken = getStoredAccessToken()

    try {
      await logoutBrowserSession({ accessToken })
    } catch {
      await clearBrowserSession()
    } finally {
      explicitSessionRef.current = false
      clearStoredAuthSession()
      dispatch({
        type: "unauthenticated",
      })
      router.replace("/sign-in")
    }
  }, [router])

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      setAuthenticatedSession,
      refreshSession,
      signOut,
    }),
    [refreshSession, setAuthenticatedSession, signOut, state]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.")
  }

  return context
}

export function authBootstrapErrorState(): AuthState {
  return {
    status: "error",
    error: networkAuthError(),
  }
}

