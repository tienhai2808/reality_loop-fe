import type {
  VocabularyLearningStatus,
  VocabularyReviewRating,
} from "../api/vocabulary-learning-schemas"

export const ratingLabels: Record<VocabularyReviewRating, string> = {
  Again: "Ôn lại",
  Hard: "Khó",
  Good: "Nhớ được",
  Easy: "Dễ",
}

export const ratingHints: Record<VocabularyReviewRating, string> = {
  Again: "Chưa nhớ",
  Hard: "Nhớ sau khi nghĩ lâu",
  Good: "Nhớ đúng nghĩa",
  Easy: "Nhớ ngay",
}

export const learningStatusLabels: Record<VocabularyLearningStatus, string> = {
  New: "Mới",
  Learning: "Đang học",
  Reviewing: "Đang ôn",
}

export function savedVocabularyHref(query: URLSearchParams, cardId?: string) {
  const params = new URLSearchParams(query)
  params.set("mode", "saved")
  if (cardId) params.set("card", cardId)
  else params.delete("card")
  return `/learn/vocabulary?${params}`
}

export function ReviewTime({ value }: { value: string }) {
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))}
    </time>
  )
}
