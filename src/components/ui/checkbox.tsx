import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  children,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group/checkbox inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input bg-surface text-primary-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:not-disabled:not-data-checked:border-border-strong hover:not-disabled:data-checked:border-primary-hover hover:not-disabled:data-checked:bg-primary-hover focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 data-checked:border-primary data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current data-unchecked:hidden">
        <Check className="size-3 stroke-[2.5]" aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
      {children}
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
