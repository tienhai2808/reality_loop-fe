import { CommandPalette } from "@/components/shared/command-palette"
import { AppNavigation } from "@/components/shared/app-navigation"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { TooltipProvider } from "@/components/ui/tooltip"
import { UserMenu } from "@/features/auth/components/user-menu"

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <AppNavigation />
        <div className="lg:pl-60">
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
      </div>
    </TooltipProvider>
  )
}
