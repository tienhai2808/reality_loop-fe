import { z } from "zod"

const catalogMetadata = {
  id: z.string().min(1),
  code: z.string().min(1),
  nativeName: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  translationLocale: z.string().nullable(),
  isTranslationFallback: z.boolean(),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
}

export const languageSchema = z.object(catalogMetadata)
export const writingSystemSchema = z.object({
  ...catalogMetadata,
  languageCode: z.string(),
})
export const writingSystemItemReadingSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  transcription: z.string(),
  transcriptionSystem: z.string(),
  audioUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
})
export const writingSystemItemSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  symbol: z.string(),
  sortOrder: z.number().int(),
  rowIndex: z.number().int().nonnegative().nullable(),
  columnIndex: z.number().int().nonnegative().nullable(),
  version: z.number().int().positive(),
  updatedAt: z.iso.datetime({ offset: true }),
  primaryReading: writingSystemItemReadingSchema.nullable(),
})

export const catalogPageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  })
export type CatalogPage<T> = { items: T[]; nextCursor: string | null }
export type LanguageDto = z.infer<typeof languageSchema>
export type WritingSystemDto = z.infer<typeof writingSystemSchema>
export type WritingSystemItemDto = z.infer<typeof writingSystemItemSchema>
export type WritingSystemItemReadingDto = z.infer<
  typeof writingSystemItemReadingSchema
>
