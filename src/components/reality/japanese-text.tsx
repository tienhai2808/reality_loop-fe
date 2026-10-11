import { cn } from "@/lib/utils"

export function JapaneseText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return <span lang="ja" className={cn("font-ja", className)} {...props} />
}
