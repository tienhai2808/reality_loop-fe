import { GrammarPracticeSession } from "@/features/grammar-practice/components/grammar-practice-session"
export const metadata = { title: "Bài luyện ngữ pháp" }
export default async function Page({
  params,
}: {
  params: Promise<{ profileId: string; sessionId: string }>
}) {
  return <GrammarPracticeSession {...await params} />
}
