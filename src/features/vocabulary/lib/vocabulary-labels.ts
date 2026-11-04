import type { PartOfSpeech } from "../api/vocabulary-schemas"

export const partOfSpeechLabels: Record<PartOfSpeech, string> = {
  Noun: "Noun",
  Verb: "Verb",
  Adjective: "Adjective",
  Adverb: "Adverb",
  Pronoun: "Pronoun",
  Determiner: "Determiner",
  Adposition: "Adposition",
  Conjunction: "Conjunction",
  Particle: "Particle",
  Interjection: "Interjection",
  Numeral: "Numeral",
  Auxiliary: "Auxiliary",
  Other: "Other",
}

export function vocabularyListHref(partOfSpeech?: PartOfSpeech) {
  return `/learn/vocabulary${partOfSpeech ? `?${new URLSearchParams({ partOfSpeech })}` : ""}`
}
