import { notFound } from "next/navigation"
import { HandwritingHistory } from "@/features/handwriting/components/handwriting-history"

export const metadata = { title: "Handwriting history" }
export default async function HandwritingHistoryPage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params
  if (!/^[1-9]\d*$/.test(profileId)) notFound()
  return <HandwritingHistory profileId={profileId} />
}
