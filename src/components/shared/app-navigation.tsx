"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BookOpenText,
  Bug,
  LineChart,
  ListChecks,
  Settings,
  Target,
} from "lucide-react"

import { cn } from "@/lib/utils"

const primaryNavigation = [
  { href: "/", label: "Today", icon: Target },
  { href: "/missions", label: "Missions", icon: ListChecks },
  { href: "/bugs", label: "Bugs", icon: Bug, badge: "12" },
  { href: "/progress", label: "Progress", icon: LineChart },
] as const

const secondaryNavigation = [
  { href: "/library", label: "Library", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function AppNavigation() {
  const pathname = usePathname()

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex lg:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-1 px-2">
          <Image
            src="/logo.svg"
            alt="Reality Loop"
            width={24}
            height={24}
            className="size-6 shrink-0 rounded-[4px]"
            priority
          />
          <span className="text-sm font-semibold tracking-normal">Reality</span>
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-6">
          <div className="space-y-1">
            {primaryNavigation.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        </nav>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {primaryNavigation.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-sm px-1 text-[0.75rem] font-medium text-muted-foreground transition-colors",
                  active && "bg-muted text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label === "Progress" ? "Prog." : item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

type NavigationItem =
  | (typeof primaryNavigation)[number]
  | (typeof secondaryNavigation)[number]

function NavigationLink({
  item,
  active,
}: {
  item: NavigationItem
  active: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-sm px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "absolute left-0 h-4 w-0.5 rounded-full bg-primary opacity-0 transition-opacity",
          active && "opacity-100"
        )}
        aria-hidden="true"
      />
      <Icon className="size-4" aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {"badge" in item ? (
        <span className="text-xs text-muted-foreground">{item.badge}</span>
      ) : null}
    </Link>
  )
}
