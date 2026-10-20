import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { AiSettings } from "@/features/ai/components/ai-settings"

export const metadata = { title: "AI settings" }

export default function AiSettingsPage() {
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
        <PageHeader.Title>AI</PageHeader.Title>
        <PageHeader.Description>
          Connect your own AI provider. Reality Loop uses the model you choose
          for each connection.
        </PageHeader.Description>
      </PageHeader>
      <AiSettings />
    </div>
  )
}
