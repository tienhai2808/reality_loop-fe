"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BookOpenText,
  Bug,
  CornerDownLeft,
  LineChart,
  ListChecks,
  Target,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const commands = [
  {
    href: "/missions/new?intent=Order%20ramen",
    label: "Order ramen",
    description: "Start a restaurant mission",
    icon: Target,
    group: "Suggested",
  },
  {
    href: "/missions/new?intent=Ask%20for%20directions",
    label: "Ask for directions",
    description: "Practice transportation Japanese",
    icon: Target,
    group: "Suggested",
  },
  {
    href: "/missions",
    label: "Start a mission",
    description: "Review mission options",
    icon: ListChecks,
    group: "Navigate",
  },
  {
    href: "/bugs",
    label: "Review Language Bugs",
    description: "Open unresolved friction",
    icon: Bug,
    group: "Navigate",
  },
  {
    href: "/progress",
    label: "View progress",
    description: "See capability by context",
    icon: LineChart,
    group: "Navigate",
  },
  {
    href: "/library",
    label: "Open library",
    description: "Browse saved phrases",
    icon: BookOpenText,
    group: "Navigate",
  },
] as const

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return commands
    }

    return commands.filter((command) =>
      `${command.label} ${command.description} ${command.group}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [query])

  const groups = ["Suggested", "Navigate"] as const

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 min-w-32 justify-between gap-4 px-3 text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <span>Search</span>
        <span className="text-xs">⌘K</span>
      </Button>
      <Button
        aria-label="Open command palette"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <CornerDownLeft aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <CommandInput
            autoFocus
            aria-label="Search or start something"
            placeholder="Search or start something..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {groups.map((group) => {
              const groupCommands = filteredCommands.filter(
                (command) => command.group === group
              )

              if (groupCommands.length === 0) {
                return null
              }

              return (
                <CommandGroup key={group} heading={group}>
                  {groupCommands.map((command) => {
                    const Icon = command.icon

                    return (
                      <CommandItem
                        key={command.href}
                        href={command.href}
                        onClick={() => setOpen(false)}
                      >
                        <Icon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="flex flex-col">
                          <span>{command.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {command.description}
                          </span>
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )
            })}
            {filteredCommands.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                No matching command.
              </div>
            ) : null}
          </CommandList>
        </DialogContent>
      </Dialog>
    </>
  )
}
