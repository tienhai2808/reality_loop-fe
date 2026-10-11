"use client"

import { useSyncExternalStore } from "react"

import { AppNavigation } from "@/components/shared/app-navigation"
import { CommandPalette } from "@/components/shared/command-palette"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { UserMenu } from "@/features/auth/components/user-menu"
import { cn } from "@/lib/utils"

const SIDEBAR_COLLAPSED_STORAGE_KEY = "reality-loop-sidebar-collapsed"
const SIDEBAR_COLLAPSED_CHANGE_EVENT = "reality-loop-sidebar-collapsed-change"

function subscribeToSidebarPreference(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(SIDEBAR_COLLAPSED_CHANGE_EVENT, onChange)

  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(SIDEBAR_COLLAPSED_CHANGE_EVENT, onChange)
  }
}

function getSidebarPreferenceSnapshot() {
  return (
    window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
  )
}

function getServerSidebarPreferenceSnapshot() {
  return false
}

export function SidebarShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreferenceSnapshot,
    getServerSidebarPreferenceSnapshot
  )

  function updateCollapsed(nextCollapsed: boolean) {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(nextCollapsed)
    )
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_CHANGE_EVENT))
  }

  return (
    <>
      <AppNavigation
        collapsed={isCollapsed}
        onCollapsedChange={updateCollapsed}
      />
      <div
        className={cn(
          "transition-[padding] duration-150 ease-out lg:pl-60",
          isCollapsed && "lg:pl-16"
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/92 px-4 backdrop-blur md:px-6 lg:px-8">
          <div className="text-sm font-medium text-muted-foreground">
            Reality Loop
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-8 md:px-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>
    </>
  )
}
