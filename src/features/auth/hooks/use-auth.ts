"use client"

import { useAuthContext } from "@/features/auth/model/auth-context"

export function useAuth() {
  return useAuthContext()
}

