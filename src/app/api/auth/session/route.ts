import type { NextRequest } from "next/server"

import { persistRefreshTokenHandler } from "@/features/auth/api/auth-bff"

export async function POST(request: NextRequest) {
  return persistRefreshTokenHandler(request)
}

