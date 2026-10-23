import { z } from "zod"

export const proficiencyLevelSchema = z.enum([
  "Beginner",
  "Elementary",
  "Intermediate",
  "UpperIntermediate",
  "Advanced",
])
export const learningGoalSchema = z.enum([
  "Travel",
  "Work",
  "Study",
  "DailyLife",
  "Social",
  "Media",
  "Relocation",
  "Other",
])
const versionSchema = z.number().int().positive()
const languageTagSchema = z
  .string()
  .trim()
  .min(1, "Choose a language.")
  .max(35, "Use a language tag of 35 characters or fewer.")

export const learningProfileSchema = z.object({
  id: z.string().min(1),
  targetLanguage: z.string(),
  nativeLanguage: z.string(),
  explanationLanguage: z.string(),
  proficiencyLevel: proficiencyLevelSchema,
  primaryGoal: learningGoalSchema,
  goalNote: z.string().nullable(),
  version: versionSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
})
export const learningProfileOptionsSchema = z.object({
  proficiencyLevels: z.array(proficiencyLevelSchema),
  learningGoals: z.array(learningGoalSchema),
})
export const learningProfilePageSchema = z.object({
  items: z.array(learningProfileSchema),
  nextCursor: z.string().nullable(),
})
export const currentLearningProfileSchema = z.object({
  profile: learningProfileSchema,
  selectionUpdatedAt: z.iso.datetime({ offset: true }),
})
export const learningProfileFormSchema = z.object({
  targetLanguage: languageTagSchema,
  nativeLanguage: languageTagSchema,
  explanationLanguage: languageTagSchema,
  proficiencyLevel: proficiencyLevelSchema,
  primaryGoal: learningGoalSchema,
  goalNote: z.string().trim().max(500, "Use 500 characters or fewer."),
})

export type ProficiencyLevel = z.infer<typeof proficiencyLevelSchema>
export type LearningGoal = z.infer<typeof learningGoalSchema>
export type LearningProfile = z.infer<typeof learningProfileSchema>
export type LearningProfileOptions = z.infer<
  typeof learningProfileOptionsSchema
>
export type LearningProfilePage = z.infer<typeof learningProfilePageSchema>
export type CurrentLearningProfile = z.infer<
  typeof currentLearningProfileSchema
>
export type LearningProfileFormValues = z.infer<
  typeof learningProfileFormSchema
>
export type LearningPreferences = Omit<
  LearningProfileFormValues,
  "targetLanguage" | "goalNote"
> & { goalNote: string | null }
export type CreateLearningProfile = LearningPreferences & {
  targetLanguage: string
}
