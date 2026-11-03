"use client"

import { useCallback } from "react"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { getLearningProfile } from "@/features/learning-profile/api/learning-profile-api"
import { listWritingSystems } from "@/features/language-foundations/api/language-foundations-api"
import {
  useCatalogPage,
  useCatalogResource,
} from "@/features/language-foundations/hooks/use-catalog"
import type {
  WritingSystemDto,
  CatalogPage,
} from "@/features/language-foundations/api/language-foundations-schemas"

export function usePracticeCatalog(profileId: string) {
  const { state } = useCurrentLearningProfile()
  const current = state.current?.profile
  const matching = current?.id === profileId ? current : null
  const profileLoader = useCallback(
    (signal: AbortSignal) =>
      matching
        ? Promise.resolve(matching)
        : getLearningProfile(profileId, signal),
    [matching, profileId]
  )
  const profile = useCatalogResource(
    `practice-profile:${profileId}`,
    profileLoader
  )
  const language = profile.data?.targetLanguage
  const locale = profile.data?.explanationLanguage
  const systemLoader = useCallback(
    (
      after: string | null,
      signal: AbortSignal
    ): Promise<CatalogPage<WritingSystemDto>> =>
      language && locale
        ? listWritingSystems(language, locale, after, signal)
        : Promise.resolve({ items: [], nextCursor: null }),
    [language, locale]
  )
  const systems = useCatalogPage(
    `practice-systems:${profileId}:${language}:${locale}`,
    systemLoader
  )
  return { profile, systems }
}
