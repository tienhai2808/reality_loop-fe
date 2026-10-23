import { z } from "zod"

import { authenticatedFetch } from "@/features/auth/api/authenticated-fetch"
import { env } from "@/lib/env"
import {
  LearningProfileError,
  learningProfileErrorFromResponse,
  normalizeLearningProfileError,
} from "./learning-profile-errors"
import {
  currentLearningProfileSchema,
  learningProfileOptionsSchema,
  learningProfilePageSchema,
  learningProfileSchema,
  type CreateLearningProfile,
  type LearningPreferences,
} from "./learning-profile-schemas"

async function request(path: string, init: RequestInit = {}) {
  try {
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/learning-profiles${path}`,
      {
        ...init,
        cache: "no-store",
        signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(30_000)])
          : AbortSignal.timeout(30_000),
      }
    )
    if (!response.ok) throw await learningProfileErrorFromResponse(response)
    return response
  } catch (error) {
    throw normalizeLearningProfileError(error)
  }
}

async function read<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  try {
    const value: unknown = await response.json()
    const parsed = schema.safeParse(value)
    if (parsed.success) return parsed.data
  } catch {
    /* An interrupted response has an unknown result. */
  }
  throw new LearningProfileError(
    "The server response couldn't be confirmed. Please refresh your profiles."
  )
}

const json = (body: unknown): RequestInit => ({
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

export async function getLearningProfileOptions(signal?: AbortSignal) {
  return read(
    await request("/options", { signal }),
    learningProfileOptionsSchema
  )
}
export async function listLearningProfiles(
  after?: string | null,
  signal?: AbortSignal
) {
  const query = new URLSearchParams({ pageSize: "20" })
  if (after) query.set("after", after)
  return read(await request(`?${query}`, { signal }), learningProfilePageSchema)
}
export async function getLearningProfile(id: string, signal?: AbortSignal) {
  return read(
    await request(`/${encodeURIComponent(id)}`, { signal }),
    learningProfileSchema
  )
}
export async function createLearningProfile(
  body: CreateLearningProfile,
  signal?: AbortSignal
) {
  return read(
    await request("", { method: "POST", ...json(body), signal }),
    learningProfileSchema
  )
}
export async function updateLearningPreferences(
  id: string,
  body: LearningPreferences & { version: number },
  signal?: AbortSignal
) {
  return read(
    await request(`/${encodeURIComponent(id)}/preferences`, {
      method: "PUT",
      ...json(body),
      signal,
    }),
    learningProfileSchema
  )
}
export async function deleteLearningProfile(
  id: string,
  version: number,
  signal?: AbortSignal
) {
  await request(
    `/${encodeURIComponent(id)}?${new URLSearchParams({ version: String(version) })}`,
    { method: "DELETE", signal }
  )
}
export async function getCurrentLearningProfile(signal?: AbortSignal) {
  const response = await request("/current", { signal })
  return response.status === 204
    ? null
    : read(response, currentLearningProfileSchema)
}
export async function selectCurrentLearningProfile(
  profileId: string,
  signal?: AbortSignal
) {
  return read(
    await request("/current", {
      method: "PUT",
      ...json({ profileId }),
      signal,
    }),
    currentLearningProfileSchema
  )
}
