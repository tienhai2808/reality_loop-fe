import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function CommandInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3">
      <Search className="size-4 text-muted-foreground" aria-hidden="true" />
      <Input
        className={cn(
          "h-12 border-0 bg-transparent px-0 focus-visible:ring-0",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="listbox"
      className={cn("max-h-[22rem] overflow-y-auto p-2", className)}
      {...props}
    />
  )
}

function CommandGroup({
  heading,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { heading: string }) {
  return (
    <div className={cn("py-1", className)} {...props}>
      <div className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
        {heading}
      </div>
      {children}
    </div>
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      role="option"
      aria-selected="false"
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-sm px-2 text-sm text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { CommandGroup, CommandInput, CommandItem, CommandList }
