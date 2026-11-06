"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenText, Languages, Speech, TextQuote } from "lucide-react"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import { useCurrentLearningProfile } from "@/features/learning-profile/hooks/use-current-learning-profile"
import { cn } from "@/lib/utils"

const sections = [
  {
    label: "Bảng chữ",
    href: "/learn/writing-systems",
    aliases: ["/learn/handwriting", "/learn/practice"],
    icon: Languages,
  },
  { label: "Phát âm", href: "/learn/pronunciation", aliases: [], icon: Speech },
  {
    label: "Từ vựng",
    href: "/learn/vocabulary",
    aliases: ["/learn/review"],
    icon: BookOpenText,
  },
  { label: "Ngữ pháp", href: "/learn/grammar", aliases: [], icon: TextQuote },
]

export function LearnNavigation() {
  const pathname = usePathname()
  const { state } = useCurrentLearningProfile()
  const profile = state.current?.profile

  return (
    <header className="space-y-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Học
          </h1>
          {profile ? (
            <span className="text-sm text-muted-foreground">
              {languageLabel(profile.targetLanguage)}
            </span>
          ) : null}
        </div>
        <Link
          href="/learn?view=languages"
          className="inline-flex min-h-11 items-center rounded-sm text-xs font-medium text-muted-foreground hover:text-primary sm:min-h-8"
        >
          Khám phá ngôn ngữ
        </Link>
      </div>
      <nav
        aria-label="Nội dung học"
        className="grid grid-cols-4 border-b border-border sm:flex sm:gap-4"
      >
        {sections.map(({ label, href, aliases, icon: Icon }) => {
          const active = [href, ...aliases].some(
            (route) => pathname === route || pathname.startsWith(route + "/")
          )
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center gap-1.5 border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground hover:text-foreground sm:min-h-10 sm:px-3",
                active && "border-primary text-primary"
              )}
            >
              <Icon aria-hidden="true" className="hidden size-4 sm:block" />
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
