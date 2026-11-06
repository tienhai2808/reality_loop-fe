import type {
  LearningGoal,
  ProficiencyLevel,
} from "../api/learning-profile-schemas"

export const languageOptions = [
  { value: "ja", label: "Tiếng Nhật" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
  { value: "ko", label: "Tiếng Hàn" },
  { value: "zh", label: "Tiếng Trung" },
  { value: "zh-hant", label: "Tiếng Trung phồn thể" },
  { value: "en-us", label: "Tiếng Anh (Hoa Kỳ)" },
  { value: "fr", label: "Tiếng Pháp" },
  { value: "de", label: "Tiếng Đức" },
  { value: "es", label: "Tiếng Tây Ban Nha" },
  { value: "pt", label: "Tiếng Bồ Đào Nha" },
  { value: "it", label: "Tiếng Ý" },
  { value: "th", label: "Tiếng Thái" },
  { value: "id", label: "Tiếng Indonesia" },
  { value: "ar", label: "Tiếng Ả Rập" },
] as const

export function languageLabel(tag: string): string {
  const known = languageOptions.find(
    (language) => language.value === tag.toLowerCase()
  )
  if (known) return known.label
  try {
    return new Intl.DisplayNames(["vi"], { type: "language" }).of(tag) ?? tag
  } catch {
    return tag
  }
}

export const proficiencyLabels: Record<ProficiencyLevel, string> = {
  Beginner: "Mới bắt đầu",
  Elementary: "Sơ cấp",
  Intermediate: "Trung cấp",
  UpperIntermediate: "Trung cấp cao",
  Advanced: "Nâng cao",
}
export const learningGoalLabels: Record<LearningGoal, string> = {
  Travel: "Du lịch",
  Work: "Công việc",
  Study: "Học tập",
  DailyLife: "Đời sống",
  Social: "Giao tiếp",
  Media: "Phim, nhạc và truyền thông",
  Relocation: "Sống ở nước ngoài",
  Other: "Khác",
}
