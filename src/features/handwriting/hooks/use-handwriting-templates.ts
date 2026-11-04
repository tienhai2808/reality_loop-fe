"use client"

import { useCallback, useState } from "react"
import { useCatalogPage } from "@/features/language-foundations/hooks/use-catalog"
import { listHandwritingTemplates } from "../api/handwriting-api"
import type { HandwritingPolicy } from "../api/handwriting-schemas"

// The workspace is keyed by authenticated owner, profile, and writing system.
export function useHandwritingTemplates(profileId: string, systemCode: string) {
  const [policy, setPolicy] = useState<HandwritingPolicy | null>(null)
  const loader = useCallback(
    async (after: string | null, signal: AbortSignal) => {
      const page = await listHandwritingTemplates(
        profileId,
        systemCode,
        after,
        signal
      )
      if (!signal.aborted) setPolicy(page.policy)
      // Adapt nested reference identity to the existing catalog paging utility.
      return {
        items: page.items.map((item) => ({ ...item, id: item.reference.id })),
        nextCursor: page.nextCursor,
      }
    },
    [profileId, systemCode]
  )
  const page = useCatalogPage(
    `handwriting-templates:${profileId}:${systemCode}`,
    loader
  )
  return { ...page, policy }
}
