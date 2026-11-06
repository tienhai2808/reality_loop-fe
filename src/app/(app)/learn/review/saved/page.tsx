import { redirect } from "next/navigation"

export default async function SavedVocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  redirect(
    `/learn/vocabulary?${new URLSearchParams({ mode: "saved", ...(typeof status === "string" && status ? { status } : {}) })}`
  )
}
