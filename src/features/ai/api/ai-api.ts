import { z } from "zod"

import { authenticatedFetch } from "@/features/auth/api/authenticated-fetch"
import { env } from "@/lib/env"
import {
  aiErrorFromResponse,
  AiRequestError,
  normalizeAiError,
} from "./ai-errors"
import {
  aiConnectionDtoSchema,
  aiConnectionPageSchema,
  aiModelPageSchema,
  aiProviderDtoSchema,
  type AiProvider,
  type CreateAiConnection,
  type UpdateAiConnection,
} from "./ai-schemas"

async function request(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  try {
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}/ai/${path}`,
      {
        ...init,
        cache: "no-store",
        signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(60_000)])
          : AbortSignal.timeout(60_000),
      }
    )
    if (!response.ok) throw await aiErrorFromResponse(response)
    return response
  } catch (error) {
    throw normalizeAiError(error)
  }
}

async function read<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  try {
    const value: unknown = await response.json()
    const parsed = schema.safeParse(value)
    if (parsed.success) return parsed.data
  } catch {
    /* The response may have been interrupted. Never expose its body. */
  }
  throw new AiRequestError(
    "The server response couldn't be confirmed. Please try again."
  )
}

const json = (body: unknown): RequestInit => ({
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

export async function listAiProviders(signal?: AbortSignal) {
  return read(
    await request("providers", { signal }),
    z.array(aiProviderDtoSchema)
  )
}

export async function listAiConnections(
  after?: string | null,
  signal?: AbortSignal
) {
  const query = new URLSearchParams({ pageSize: "20" })
  if (after) query.set("after", after)
  return read(
    await request(`connections?${query}`, { signal }),
    aiConnectionPageSchema
  )
}

export async function loadAiModels(
  provider: AiProvider,
  apiKey: string,
  signal?: AbortSignal
) {
  return read(
    await request(`providers/${encodeURIComponent(provider)}/models`, {
      method: "POST",
      ...json({ apiKey }),
      signal,
    }),
    aiModelPageSchema
  )
}

export async function createAiConnection(
  payload: Readonly<CreateAiConnection>,
  idempotencyKey: string,
  signal?: AbortSignal
) {
  const response = await request("connections", {
    method: "POST",
    ...json(payload),
    signal,
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  })
  return read(response, aiConnectionDtoSchema)
}

export async function updateAiConnection(
  id: string,
  payload: UpdateAiConnection,
  signal?: AbortSignal
) {
  return read(
    await request(`connections/${encodeURIComponent(id)}`, {
      method: "PATCH",
      ...json(payload),
      signal,
    }),
    aiConnectionDtoSchema
  )
}

export async function verifyAiConnection(
  id: string,
  version: number,
  signal?: AbortSignal
) {
  return read(
    await request(`connections/${encodeURIComponent(id)}/verify`, {
      method: "POST",
      ...json({ version }),
      signal,
    }),
    aiConnectionDtoSchema
  )
}

export async function deleteAiConnection(
  id: string,
  version: number,
  signal?: AbortSignal
) {
  await request(
    `connections/${encodeURIComponent(id)}?${new URLSearchParams({ version: String(version) })}`,
    { method: "DELETE", signal }
  )
}
