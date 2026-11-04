import { notFound } from "next/navigation"
import { HandwritingAttemptDetailView } from "@/features/handwriting/components/handwriting-attempt-detail"

export const metadata = { title: "Saved handwriting attempt" }
export default async function HandwritingAttemptPage({
  params,
}: {
  params: Promise<{ profileId: string; attemptId: string }>
}) {
  const { profileId, attemptId } = await params
  if (!/^[1-9]\d*$/.test(profileId) || !/^[1-9]\d*$/.test(attemptId)) notFound()
  return (
    <HandwritingAttemptDetailView profileId={profileId} attemptId={attemptId} />
  )
}
