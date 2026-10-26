"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BookOpenText,
  BookOpen,
  Bug,
  LineChart,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
} from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const primaryNavigation = [
  { href: "/", label: "Today", icon: Target },
  { href: "/missions", label: "Missions", icon: ListChecks },
  { href: "/bugs", label: "Bugs", icon: Bug, badge: "12" },
  { href: "/progress", label: "Progress", icon: LineChart },
] as const

const secondaryNavigation = [
  { href: "/learn", label: "Language Foundations", icon: BookOpen },
  { href: "/library", label: "Library", icon: BookOpenText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function AppNavigation({
  collapsed,
  onCollapsedChange,
}: {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}) {
  const pathname = usePathname()
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar py-5 transition-[width,padding] duration-150 ease-out lg:flex lg:flex-col",
          collapsed ? "w-16 px-2" : "w-60 px-3"
        )}
      >
        <div
          className={cn(
            "mb-8 flex items-center",
            collapsed ? "flex-col gap-3" : "justify-between gap-3 px-2"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex min-w-0 items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              collapsed && "justify-center"
            )}
            aria-label="Reality Loop"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 rounded-[4px]"
              priority
            />
            <span
              className={cn(
                "text-sm font-semibold tracking-normal",
                collapsed && "sr-only"
              )}
            >
              Reality
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={() => onCollapsedChange(!collapsed)}
                  className="grid size-8 place-items-center rounded-sm text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
                >
                  <ToggleIcon className="size-4" aria-hidden="true" />
                </button>
              }
            />
            <TooltipContent>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
        <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-6">
          <div className="space-y-1">
            {primaryNavigation.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
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
  collapsed,
}: {
  item: NavigationItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-sm px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center gap-0 px-0"
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
      <span className={cn("flex-1", collapsed && "sr-only")}>
        {item.label}
      </span>
      {"badge" in item && !collapsed ? (
        <span className="text-xs text-muted-foreground">{item.badge}</span>
      ) : null}
    </Link>
  )

  if (!collapsed) {
    return link
  }

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent>{item.label}</TooltipContent>
    </Tooltip>
  )
}
