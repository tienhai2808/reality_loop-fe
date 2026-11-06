"use client"

import { useEffect, useRef, type ReactNode } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LearnDetailPane({
  label,
  selection,
  closeHref,
  triggerId,
  children,
}: {
  label: string
  selection: string
  closeHref?: string
  triggerId?: string
  children: ReactNode
}) {
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (selection && window.matchMedia("(max-width: 1023px)").matches) {
      panel.current?.focus({ preventScroll: true })
      panel.current?.scrollIntoView({ block: "nearest" })
    }
  }, [selection])

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label={label}
      className="min-w-0 scroll-mt-16 rounded-sm border-y border-border bg-surface px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:sticky lg:top-16 lg:rounded-none lg:border-y-0 lg:border-l lg:bg-transparent lg:py-1 lg:pl-5"
    >
      {closeHref ? (
        <Link
          href={closeHref}
          scroll={false}
          aria-label={`Đóng ${label.toLowerCase()}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "float-right min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
          )}
          onClick={() => {
            if (triggerId) document.getElementById(triggerId)?.focus()
          }}
        >
          <X aria-hidden="true" />
        </Link>
      ) : null}
      {children}
    </section>
  )
}
