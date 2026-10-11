import { z } from "zod"

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  status: z.string(),
  createdAt: z.string(),
})

export const authenticationResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  accessTokenExpiresAt: z.string(),
  refreshTokenExpiresAt: z.string(),
  sessionId: z.string(),
  user: authUserSchema,
})

export const browserAuthSessionSchema = authenticationResponseSchema.omit({
  refreshToken: true,
  refreshTokenExpiresAt: true,
})

export const authorizationUrlResponseSchema = z.object({
  authorizationUrl: z.string().url(),
})

export const googleCallbackBodySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  device: z.object({
    deviceType: z.string().min(1),
    deviceName: z.string().min(1),
  }),
})

export const persistSessionBodySchema = z.object({
  refreshToken: z.string().min(1),
})

export const problemDetailsSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().optional(),
    detail: z.string().optional(),
    instance: z.string().optional(),
    traceId: z.string().optional(),
    errors: z.record(z.string(), z.array(z.string())).optional(),
  })
  .passthrough()

const rawSessionSchema = z
  .object({
    id: z.string().optional(),
    sessionId: z.string().optional(),
    deviceName: z.string().nullable().optional(),
    deviceType: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    lastSeenAt: z.string().nullable().optional(),
    lastUsedAt: z.string().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    isCurrent: z.boolean().optional(),
    current: z.boolean().optional(),
  })
  .passthrough()

export const authSessionSchema = rawSessionSchema.transform((session, context) => {
  const id = session.sessionId ?? session.id

  if (!id) {
    context.addIssue({
      code: "custom",
      message: "Session id is missing.",
    })
    return z.NEVER
  }

  return {
    id,
    deviceName: session.deviceName ?? session.userAgent ?? "Unknown device",
    deviceType: session.deviceType ?? "Web",
    createdAt: session.createdAt ?? null,
    lastSeenAt: session.lastSeenAt ?? session.lastUsedAt ?? null,
    expiresAt: session.expiresAt ?? null,
    isCurrent: session.isCurrent ?? session.current ?? false,
  }
})

export const sessionsPageSchema = z.object({
  items: z.array(authSessionSchema),
  nextCursor: z.string().nullable(),
})

export type AuthUser = z.infer<typeof authUserSchema>
export type AuthenticationResponse = z.infer<typeof authenticationResponseSchema>
export type BrowserAuthSession = z.infer<typeof browserAuthSessionSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type SessionsPage = z.infer<typeof sessionsPageSchema>

