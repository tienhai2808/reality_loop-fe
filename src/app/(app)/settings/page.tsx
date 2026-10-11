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
