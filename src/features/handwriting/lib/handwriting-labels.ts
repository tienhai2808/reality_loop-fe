import type { HandwritingIssue } from "../api/handwriting-schemas"

export const handwritingIssueLabels: Record<HandwritingIssue, string> = {
  MissingDrawing: "No drawing was submitted.",
  WrongStrokeCount: "Use the reference number of strokes.",
  DrawingTooSmall: "Write a little larger in the drawing area.",
  WrongStrokeOrder: "Follow the reference stroke order.",
  WrongDirection: "Check the direction of the stroke.",
  StrokeTooShort: "The stroke is too short.",
  StrokeTooLong: "The stroke is too long.",
  WrongShape: "The stroke shape needs another look.",
}
export const handwritingWorkspaceHref = (systemCode: string) =>
  `/learn/handwriting?${new URLSearchParams({ system: systemCode })}`
export const handwritingAttemptHref = (profileId: string, attemptId: string) =>
  `/learn/handwriting/${encodeURIComponent(profileId)}/attempts/${encodeURIComponent(attemptId)}`
