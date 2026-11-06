"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BookOpenText,
  BookOpen,
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
    href: "/learn",
    label: "Học",
    description: "Mở bảng chữ, phát âm, từ vựng và ngữ pháp",
    icon: BookOpen,
    group: "Điều hướng",
  },
  {
    href: "/missions/new?intent=Order%20ramen",
    label: "Gọi mì ramen",
    description: "Luyện tình huống nhà hàng",
    icon: Target,
    group: "Gợi ý",
  },
  {
    href: "/missions/new?intent=Ask%20for%20directions",
    label: "Hỏi đường",
    description: "Luyện tiếng Nhật khi di chuyển",
    icon: Target,
    group: "Gợi ý",
  },
  {
    href: "/missions",
    label: "Bắt đầu tình huống",
    description: "Xem tình huống có thể luyện",
    icon: ListChecks,
    group: "Điều hướng",
  },
  {
    href: "/bugs",
    label: "Xem lỗi ngôn ngữ",
    description: "Xem những chỗ còn vướng",
    icon: Bug,
    group: "Điều hướng",
  },
  {
    href: "/progress",
    label: "Xem tiến độ",
    description: "Xem khả năng theo tình huống",
    icon: LineChart,
    group: "Điều hướng",
  },
  {
    href: "/library",
    label: "Mở thư viện",
    description: "Xem cụm từ đã lưu",
    icon: BookOpenText,
    group: "Điều hướng",
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

  const groups = ["Gợi ý", "Điều hướng"] as const

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-9 min-w-32 justify-between gap-4 px-3 text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <span>Tìm</span>
        <span className="text-xs">⌘K</span>
      </Button>
      <Button
        aria-label="Mở tìm nhanh"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <CornerDownLeft aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Tìm nhanh</DialogTitle>
          <CommandInput
            autoFocus
            aria-label="Tìm trang hoặc thao tác"
            placeholder="Tìm trang hoặc thao tác…"
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
                Không tìm thấy kết quả.
              </div>
            ) : null}
          </CommandList>
        </DialogContent>
      </Dialog>
    </>
  )
}
