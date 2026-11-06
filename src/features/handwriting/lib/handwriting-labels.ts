import type { HandwritingIssue } from "../api/handwriting-schemas"

export const handwritingIssueLabels: Record<HandwritingIssue, string> = {
  MissingDrawing: "Chưa có nét viết.",
  WrongStrokeCount: "Viết đủ số nét theo mẫu.",
  DrawingTooSmall: "Viết lớn hơn trong ô.",
  WrongStrokeOrder: "Viết theo thứ tự nét mẫu.",
  WrongDirection: "Sửa hướng nét.",
  StrokeTooShort: "Nét quá ngắn.",
  StrokeTooLong: "Nét quá dài.",
  WrongShape: "Xem lại hình dáng nét.",
}
export const handwritingWorkspaceHref = (systemCode: string, character?: string | null) =>
  `/learn/writing-systems?${new URLSearchParams({ system: systemCode, mode: "write", ...(character ? { character } : {}) })}`
export const handwritingAttemptHref = (profileId: string, attemptId: string) =>
  `/learn/handwriting/${encodeURIComponent(profileId)}/attempts/${encodeURIComponent(attemptId)}`
