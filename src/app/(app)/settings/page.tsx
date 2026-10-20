import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Settings</PageHeader.Title>
        <PageHeader.Description>
          Learning, audio, language display, appearance, privacy, and account settings.
        </PageHeader.Description>
      </PageHeader>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        <Link
          href="/settings/ai"
          className="flex items-center justify-between gap-4 px-5 py-4 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="text-sm font-medium">AI</span>
          <ChevronRight
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>
        {["Learning", "Audio & microphone", "Language display", "Appearance"].map(
          (section) => (
            <div key={section} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium">{section}</span>
              <span className="text-sm text-muted-foreground">Coming soon</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
