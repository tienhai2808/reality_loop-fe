"use client"

import Link from "next/link"
import { Activity } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { VocabularyLearningList } from "@/features/vocabulary-learning/components/vocabulary-learning-list"
import { VocabularyReviewPage } from "@/features/vocabulary-learning/components/vocabulary-review-page"
import { VocabularyList } from "./vocabulary-list"

export function VocabularyWorkspace() {
  const search = useSearchParams()
  const mode = search.get("mode")
  const browsing = mode !== "review" && mode !== "saved"

  function modeHref(nextMode?: string) {
    const query = new URLSearchParams(search)
    if (nextMode) query.set("mode", nextMode)
    else query.delete("mode")
    if (nextMode !== "saved") {
      query.delete("status")
      query.delete("card")
    }
    return `/learn/vocabulary${query.size ? `?${query}` : ""}`
  }

  return (
    <section aria-label="Từ vựng" className="min-w-0 space-y-3">
      <nav
        aria-label="Chế độ từ vựng"
        className="flex flex-wrap gap-1 border-b border-border pb-2"
      >
        {[
          { label: "Tra từ", active: browsing, href: modeHref() },
          {
            label: "Ôn tập",
            active: mode === "review",
            href: modeHref("review"),
          },
          {
            label: "Thẻ đã lưu",
            active: mode === "saved",
            href: modeHref("saved"),
          },
        ].map(({ label, active, href }) => (
          <Link
            key={label}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:min-h-9",
              active && "bg-muted text-foreground"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Activity mode={browsing ? "visible" : "hidden"}>
        <VocabularyList />
      </Activity>
      {mode === "review" ? <VocabularyReviewPage /> : null}
      {mode === "saved" ? <VocabularyLearningList /> : null}
    </section>
  )
}
