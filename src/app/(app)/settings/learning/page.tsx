import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LearningProfilesManager } from "@/features/learning-profile/components/learning-profiles-manager"

export const metadata = { title: "Learning profiles" }

export default function LearningSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Settings
      </Link>
      <PageHeader>
        <PageHeader.Title>Learning profiles</PageHeader.Title>
        <PageHeader.Description>
          Your languages, goals, and learning preferences. Choose one current
          profile.
        </PageHeader.Description>
      </PageHeader>
      <LearningProfilesManager />
    </div>
  )
}
