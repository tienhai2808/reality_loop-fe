import type {
  AuthUser,
  BrowserAuthSession,
} from "@/features/auth/api/auth-schemas"
import type { AppAuthError } from "@/features/auth/api/auth-errors"

export type AuthState =
  | {
      status: "bootstrapping"
    }
  | {
      status: "unauthenticated"
    }
  | {
      status: "authenticated"
      user: AuthUser
      sessionId: string
      accessTokenExpiresAt: string
    }
  | {
      status: "error"
      error: AppAuthError
    }

export type AuthAction =
  | {
      type: "bootstrapping"
    }
  | {
      type: "authenticated"
      session: BrowserAuthSession
    }
  | {
      type: "unauthenticated"
    }
  | {
      type: "error"
      error: AppAuthError
    }

export type AuthContextValue = {
  state: AuthState
  setAuthenticatedSession: (session: BrowserAuthSession) => void
  refreshSession: () => Promise<BrowserAuthSession | null>
  signOut: () => Promise<void>
}

