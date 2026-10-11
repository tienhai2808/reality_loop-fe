"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label="Toggle theme"
            size="icon"
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Use light theme" : "Use dark theme"}</TooltipContent>
    </Tooltip>
  )
}
