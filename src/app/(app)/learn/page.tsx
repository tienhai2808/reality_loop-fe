import { redirect } from "next/navigation"
import { LanguageCatalog } from "@/features/language-foundations/components/language-catalog"

export const metadata = { title: "Học" }

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  if ((await searchParams).view !== "languages")
    redirect("/learn/writing-systems")
  return <LanguageCatalog />
}
