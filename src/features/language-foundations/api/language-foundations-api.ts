import { z } from "zod"
import { authenticatedFetch } from "@/features/auth/api/authenticated-fetch"
import { env } from "@/lib/env"
import {
  FoundationsError,
  foundationsErrorFromResponse,
  normalizeFoundationsError,
} from "./language-foundations-errors"
import {
  catalogPageSchema,
  languageSchema,
  writingSystemSchema,
  writingSystemItemSchema,
  writingSystemItemReadingSchema,
} from "./language-foundations-schemas"

export async function getFoundationContent<T>(
  path: string,
  query: URLSearchParams,
  schema: z.ZodType<T>,
  signal: AbortSignal
): Promise<T> {
  try {
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/languages${path}?${query}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
      }
    )
    if (!response.ok) throw await foundationsErrorFromResponse(response)
    const value: unknown = await response.json()
    const parsed = schema.safeParse(value)
    if (!parsed.success)
      throw new FoundationsError(
        "The content response couldn't be read. Please try again."
      )
    return parsed.data
  } catch (error) {
    throw normalizeFoundationsError(error)
  }
}

export function catalogPageQuery(
  pageSize: number,
  after: string | null,
  locale?: string
) {
  const query = new URLSearchParams({ pageSize: String(pageSize) })
  if (after) query.set("after", after)
  if (locale) query.set("locale", locale)
  return query
}
const systemsPath = (language: string) =>
  `/${encodeURIComponent(language)}/writing-systems`
const systemPath = (language: string, system: string) =>
  `${systemsPath(language)}/${encodeURIComponent(system)}`

export function listLanguages(
  locale: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    "",
    catalogPageQuery(20, after, locale),
    catalogPageSchema(languageSchema),
    signal
  )
}
export function getLanguage(
  language: string,
  locale: string,
  signal: AbortSignal
) {
  return getFoundationContent(
    `/${encodeURIComponent(language)}`,
    new URLSearchParams({ locale }),
    languageSchema,
    signal
  )
}
export function listWritingSystems(
  language: string,
  locale: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    systemsPath(language),
    catalogPageQuery(20, after, locale),
    catalogPageSchema(writingSystemSchema),
    signal
  )
}
export function getWritingSystem(
  language: string,
  system: string,
  locale: string,
  signal: AbortSignal
) {
  return getFoundationContent(
    systemPath(language, system),
    new URLSearchParams({ locale }),
    writingSystemSchema,
    signal
  )
}
export function listWritingSystemItems(
  language: string,
  system: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    `${systemPath(language, system)}/items`,
    catalogPageQuery(100, after),
    catalogPageSchema(writingSystemItemSchema),
    signal
  )
}
export function listItemReadings(
  language: string,
  system: string,
  item: string,
  after: string | null,
  signal: AbortSignal
) {
  return getFoundationContent(
    `${systemPath(language, system)}/items/${encodeURIComponent(item)}/readings`,
    catalogPageQuery(20, after),
    catalogPageSchema(writingSystemItemReadingSchema),
    signal
  )
}
