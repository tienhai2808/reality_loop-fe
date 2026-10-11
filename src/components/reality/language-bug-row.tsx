import Link from "next/link"

import { JapaneseText } from "@/components/reality/japanese-text"
import { cn } from "@/lib/utils"

type LanguageBugStatus = "open" | "practicing" | "recovered" | "regressed"

export function LanguageBugRow({
  id,
  pattern,
  category,
  context,
  encounters,
  status,
}: {
  id: string
  pattern: string
  category: string
  context: string
  encounters: number
  status: LanguageBugStatus
}) {
  const recovered = status === "recovered"

  return (
    <Link
      href={`/bugs/${id.toLowerCase()}`}
      className={cn(
        "grid gap-2 border-t border-border py-3 outline-none transition-colors hover:bg-muted/55 focus-visible:bg-muted md:grid-cols-[5.5rem_minmax(0,1fr)_8rem_7rem] md:items-center md:px-2",
        recovered && "text-muted-foreground"
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{id}</span>
      <span className="min-w-0">
        <JapaneseText className="block text-[1rem] font-medium text-foreground">
          {pattern}
        </JapaneseText>
        <span className="text-sm text-muted-foreground">{category}</span>
      </span>
      <span className="text-sm text-muted-foreground">{context}</span>
      <span className="text-sm text-muted-foreground">
        {recovered ? "Recovered" : `${encounters} encounters`}
      </span>
    </Link>
  )
}
