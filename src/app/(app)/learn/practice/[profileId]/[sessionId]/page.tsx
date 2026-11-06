import { notFound } from "next/navigation"
import { PracticeSessionView } from "@/features/writing-system-practice/components/practice-session-view"

export const metadata = { title: "Luyện nhận diện chữ" }

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ profileId: string; sessionId: string }>
}) {
  const { profileId, sessionId } = await params
  if (!/^[1-9]\d*$/.test(profileId) || !/^[1-9]\d*$/.test(sessionId)) notFound()
  return <PracticeSessionView profileId={profileId} sessionId={sessionId} />
}
