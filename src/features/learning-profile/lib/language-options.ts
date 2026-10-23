import type {
  LearningGoal,
  ProficiencyLevel,
} from "../api/learning-profile-schemas"

export const languageOptions = [
  { value: "ja", label: "Japanese" },
  { value: "vi", label: "Vietnamese" },
  { value: "en", label: "English" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "zh-hant", label: "Chinese (Traditional)" },
  { value: "en-us", label: "English (United States)" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
  { value: "th", label: "Thai" },
  { value: "id", label: "Indonesian" },
  { value: "ar", label: "Arabic" },
] as const

export function languageLabel(tag: string): string {
  const known = languageOptions.find(
    (language) => language.value === tag.toLowerCase()
  )
  if (known) return known.label
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? tag
  } catch {
    return tag
  }
}

export const proficiencyLabels: Record<ProficiencyLevel, string> = {
  Beginner: "Beginner",
  Elementary: "Elementary",
  Intermediate: "Intermediate",
  UpperIntermediate: "Upper intermediate",
  Advanced: "Advanced",
}
export const learningGoalLabels: Record<LearningGoal, string> = {
  Travel: "Travel",
  Work: "Work",
  Study: "Study",
  DailyLife: "Daily life",
  Social: "Social",
  Media: "Movies, music & media",
  Relocation: "Living abroad",
  Other: "Other",
}
