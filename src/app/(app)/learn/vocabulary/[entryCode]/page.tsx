import { redirect } from "next/navigation"
import { partOfSpeechSchema } from "@/features/vocabulary/api/vocabulary-schemas"
import { vocabularyListHref } from "@/features/vocabulary/lib/vocabulary-labels"

export default async function VocabularyEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryCode: string }>
  searchParams: Promise<{ partOfSpeech?: string }>
}) {
  const [{ entryCode }, { partOfSpeech }] = await Promise.all([
    params,
    searchParams,
  ])
  const filter = partOfSpeechSchema.safeParse(partOfSpeech)
  redirect(
    vocabularyListHref(filter.success ? filter.data : undefined, entryCode)
  )
}
