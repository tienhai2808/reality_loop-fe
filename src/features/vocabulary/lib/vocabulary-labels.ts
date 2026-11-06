import type { PartOfSpeech } from "../api/vocabulary-schemas"

export const partOfSpeechLabels: Record<PartOfSpeech, string> = {
  Noun: "Danh từ",
  Verb: "Động từ",
  Adjective: "Tính từ",
  Adverb: "Trạng từ",
  Pronoun: "Đại từ",
  Determiner: "Từ hạn định",
  Adposition: "Giới từ hoặc hậu giới từ",
  Conjunction: "Liên từ",
  Particle: "Trợ từ",
  Interjection: "Thán từ",
  Numeral: "Số từ",
  Auxiliary: "Trợ động từ",
  Other: "Khác",
}

export function vocabularyListHref(
  partOfSpeech?: PartOfSpeech,
  entry?: string
) {
  const query = new URLSearchParams()
  if (partOfSpeech) query.set("partOfSpeech", partOfSpeech)
  if (entry) query.set("entry", entry)
  return `/learn/vocabulary${query.size ? `?${query}` : ""}`
}
