import type { NextRequest } from "next/server"

import { clearBrowserSessionHandler } from "@/features/auth/api/auth-bff"

export async function POST(request: NextRequest) {
  return clearBrowserSessionHandler(request)
}

