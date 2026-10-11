import { SidebarShell } from "@/components/shared/sidebar-shell"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <SidebarShell>{children}</SidebarShell>
      </div>
    </TooltipProvider>
  )
}
