import { VocabularyDetail } from "@/features/vocabulary/components/vocabulary-detail"

export const metadata = { title: "Word details" }

export default async function VocabularyEntryPage({
  params,
}: {
  params: Promise<{ entryCode: string }>
}) {
  const { entryCode } = await params
  return <VocabularyDetail entryCode={entryCode} />
}
