import { redirect } from "next/navigation"
import { handwritingWorkspaceHref } from "@/features/handwriting/lib/handwriting-labels"

export default async function HandwritingPage({
  searchParams,
}: {
  searchParams: Promise<{ system?: string }>
}) {
  const { system } = await searchParams
  redirect(
    typeof system === "string" && system
      ? handwritingWorkspaceHref(system)
      : "/learn/writing-systems"
  )
}
