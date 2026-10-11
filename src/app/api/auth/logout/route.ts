import type { NextRequest } from "next/server"

import { logoutSessionHandler } from "@/features/auth/api/auth-bff"

export async function POST(request: NextRequest) {
  return logoutSessionHandler(request)
}

