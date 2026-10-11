import type { AuthAction, AuthState } from "@/features/auth/model/auth-types"

export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "bootstrapping":
      return {
        status: "bootstrapping",
      }
    case "authenticated":
      return {
        status: "authenticated",
        user: action.session.user,
        sessionId: action.session.sessionId,
        accessTokenExpiresAt: action.session.accessTokenExpiresAt,
      }
    case "unauthenticated":
      return {
        status: "unauthenticated",
      }
    case "error":
      return {
        status: "error",
        error: action.error,
      }
  }
}

