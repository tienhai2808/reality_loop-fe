import { z } from "zod"

export const aiProviderSchema = z.enum(["OpenAI", "Anthropic", "Google"])
export const aiConnectionStatusSchema = z.enum([
  "Ready",
  "CoolingDown",
  "NeedsAttention",
])
export const aiFailureCodeSchema = z.enum([
  "InvalidApiKey",
  "QuotaExceeded",
  "RateLimited",
  "ProviderUnavailable",
  "ModelUnavailable",
])
export const aiProviderDtoSchema = z.object({
  id: aiProviderSchema,
  name: z.string(),
})
export const aiModelDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
})
export const aiModelPageSchema = z.object({
  items: z.array(aiModelDtoSchema),
  isFallback: z.boolean(),
})
export const aiConnectionDtoSchema = z.object({
  id: z.string().min(1),
  provider: aiProviderSchema,
  displayName: z.string(),
  apiKeyLast4: z.string(),
  modelId: z.string(),
  sortOrder: z.number().int(),
  isEnabled: z.boolean(),
  status: aiConnectionStatusSchema,
  retryAfterAt: z.iso.datetime({ offset: true }).nullable(),
  lastFailureCode: aiFailureCodeSchema.nullable(),
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})
export const aiConnectionPageSchema = z.object({
  items: z.array(aiConnectionDtoSchema),
  nextCursor: z.string().nullable(),
})

export const aiKeySchema = z
  .string()
  .min(8, "Enter an API key of at least 8 characters.")
  .max(8192, "The API key is too long.")
export const aiDisplayNameSchema = z
  .string()
  .trim()
  .max(150, "Use 150 characters or fewer.")
export const connectAiFormSchema = z.object({
  provider: aiProviderSchema,
  apiKey: aiKeySchema,
  modelId: z
    .string()
    .min(1, "Choose a model.")
    .max(200, "The model ID is too long."),
  displayName: aiDisplayNameSchema,
})
export const manageAiFormSchema = z.object({
  displayName: aiDisplayNameSchema,
  isEnabled: z.boolean(),
  apiKey: z.union([z.literal(""), aiKeySchema]),
  modelId: z.string().max(200, "The model ID is too long."),
})

export type AiProvider = z.infer<typeof aiProviderSchema>
export type AiConnectionStatus = z.infer<typeof aiConnectionStatusSchema>
export type AiFailureCode = z.infer<typeof aiFailureCodeSchema>
export type AiProviderDto = z.infer<typeof aiProviderDtoSchema>
export type AiModelDto = z.infer<typeof aiModelDtoSchema>
export type AiModelPage = z.infer<typeof aiModelPageSchema>
export type AiConnectionDto = z.infer<typeof aiConnectionDtoSchema>
export type AiConnectionPage = z.infer<typeof aiConnectionPageSchema>
export type ConnectAiForm = z.infer<typeof connectAiFormSchema>
export type ManageAiForm = z.infer<typeof manageAiFormSchema>
export type CreateAiConnection = Omit<ConnectAiForm, "displayName"> & {
  displayName?: string
}
export type UpdateAiConnection = { version: number } & Partial<ManageAiForm>
