"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      toastOptions={{
        classNames: {
          toast:
            "border-border bg-popover text-popover-foreground shadow-lg shadow-foreground/10",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
