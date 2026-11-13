import { redirect } from "next/navigation"
import { grammarHistoryHref } from "@/features/grammar-practice/model/grammar-history-url"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; status?: string; point?: string }>
}) {
  const { profile, status, point } = await searchParams
  const query = new URLSearchParams()
  if (typeof status === "string") query.set("status", status)
  if (typeof point === "string") query.set("historyPoint", point)
  redirect(
    grammarHistoryHref(typeof profile === "string" ? profile : undefined, query)
  )
}
