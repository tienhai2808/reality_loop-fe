import { SessionsPageClient } from "@/features/auth/components/sessions-page-client"
import { PageHeader } from "@/components/shared/page-header"

export default function SessionsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Active sessions</PageHeader.Title>
        <PageHeader.Description>
          Manage the browsers and devices that can access your account.
        </PageHeader.Description>
      </PageHeader>
      <SessionsPageClient />
    </div>
  )
}

