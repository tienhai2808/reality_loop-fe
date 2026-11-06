"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { History, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HandwritingHistory } from "@/features/handwriting/components/handwriting-history"
import { PracticeHistory } from "@/features/writing-system-practice/components/practice-history"
import { cn } from "@/lib/utils"

export function WritingHistoryPanel({
  profileId,
  defaultKind = "recognition",
}: {
  profileId: string
  defaultKind?: "recognition" | "writing"
}) {
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()
  const history = search.get("history")

  function historyHref(value?: "recognition" | "writing") {
    const query = new URLSearchParams(search)
    if (value) query.set("history", value)
    else {
      query.delete("history")
      query.delete("historySystem")
      query.delete("status")
      query.delete("passed")
    }
    return `${pathname}${query.size ? `?${query}` : ""}`
  }

  return (
    <Dialog
      open={history === "recognition" || history === "writing"}
      onOpenChange={(open) =>
        router.replace(historyHref(open ? defaultKind : undefined), {
          scroll: false,
        })
      }
    >
      <DialogTrigger
        render={<Button variant="ghost" className="min-h-11 sm:min-h-9" />}
      >
        <History aria-hidden="true" />
        Lịch sử
      </DialogTrigger>
      <DialogContent className="top-auto right-0 bottom-0 left-0 flex max-h-[85dvh] w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none p-0 lg:top-0 lg:left-auto lg:max-h-none lg:w-[min(36rem,45vw)] lg:rounded-l-xl lg:rounded-r-none">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-2">
          <DialogTitle className="text-base font-semibold">
            Lịch sử luyện chữ
          </DialogTitle>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11 sm:size-9"
                aria-label="Đóng lịch sử"
              />
            }
          >
            <X aria-hidden="true" />
          </DialogClose>
        </header>
        <nav
          aria-label="Loại bài luyện"
          className="flex shrink-0 gap-2 border-b border-border px-4"
        >
          {(
            [
              ["recognition", "Nhận diện"],
              ["writing", "Luyện viết"],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              href={historyHref(value)}
              replace
              scroll={false}
              aria-current={history === value ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center border-b-2 border-transparent px-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:min-h-10",
                history === value && "border-primary text-primary"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div
          key={history}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {history === "writing" ? (
            <HandwritingHistory profileId={profileId} embedded />
          ) : (
            <PracticeHistory embedded />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
