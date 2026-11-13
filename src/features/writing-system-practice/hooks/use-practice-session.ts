"use client"

import { usePracticeSessionEngine } from "@/features/practice/hooks/use-practice-session-engine"
import {
  getWritingPractice,
  submitWritingPracticeAnswer,
  abandonWritingPractice,
} from "../api/practice-api"
import type { WritingPracticeDetail } from "../api/practice-schemas"

const api = {
  get: getWritingPractice,
  answer: submitWritingPracticeAnswer,
  abandon: abandonWritingPractice,
}

export function usePracticeSession(
  profileId: string,
  sessionId: string,
  creationSnapshot: WritingPracticeDetail | null
) {
  return usePracticeSessionEngine(profileId, sessionId, creationSnapshot, api)
}
