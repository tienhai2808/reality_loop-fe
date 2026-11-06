import { redirect } from "next/navigation"
import { grammarHref } from "@/features/grammar/components/grammar-content"

export default async function GrammarPointPage({
  params,
  searchParams,
}: {
  params: Promise<{ pointCode: string }>
  searchParams: Promise<{ language?: string }>
}) {
  const [{ pointCode }, { language }] = await Promise.all([
    params,
    searchParams,
  ])
  redirect(
    grammarHref(typeof language === "string" ? language : undefined, pointCode)
  )
}
