import type { NextRequest } from "next/server"

import { refreshSessionHandler } from "@/features/auth/api/auth-bff"

export async function POST(request: NextRequest) {
  return refreshSessionHandler(request)
}

