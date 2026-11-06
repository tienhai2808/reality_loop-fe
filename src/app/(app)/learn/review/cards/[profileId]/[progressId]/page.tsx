import { notFound } from "next/navigation"
import { VocabularyReviewHistory } from "@/features/vocabulary-learning/components/vocabulary-review-history"
export const metadata = { title: "Lịch sử ôn từ vựng" }
export default async function VocabularyCardPage({
  params,
}: {
  params: Promise<{ profileId: string; progressId: string }>
}) {
  const { profileId, progressId } = await params
  if (!/^[1-9]\d*$/.test(profileId) || !/^[1-9]\d*$/.test(progressId))
    notFound()
  return (
    <VocabularyReviewHistory profileId={profileId} progressId={progressId} />
  )
}
