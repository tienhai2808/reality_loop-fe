import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { LearningProfilesManager } from "@/features/learning-profile/components/learning-profiles-manager"

export const metadata = { title: "Hồ sơ học" }

export default function LearningSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Cài đặt
      </Link>
      <PageHeader>
        <PageHeader.Title>Hồ sơ học</PageHeader.Title>
        <PageHeader.Description>
          Chọn hồ sơ đang dùng hoặc chỉnh ngôn ngữ và mục tiêu học.
        </PageHeader.Description>
      </PageHeader>
      <LearningProfilesManager />
    </div>
  )
}
