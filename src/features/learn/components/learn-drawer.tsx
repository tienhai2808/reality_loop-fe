import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"

export function LearnDrawerContent({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <DialogContent className="top-auto right-0 bottom-0 left-0 flex max-h-[85dvh] w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none p-0 lg:top-0 lg:left-auto lg:max-h-none lg:w-[min(36rem,45vw)] lg:rounded-l-xl lg:rounded-r-none">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-2">
        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-11 sm:size-9"
              aria-label={`Đóng ${title.toLowerCase()}`}
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </header>
      {children}
    </DialogContent>
  )
}

export function LearnDrawerBody({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  )
}
