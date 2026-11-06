import { SessionsPageClient } from "@/features/auth/components/sessions-page-client"
import { PageHeader } from "@/components/shared/page-header"

export default function SessionsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Phiên đăng nhập</PageHeader.Title>
        <PageHeader.Description>
          Quản lý thiết bị và trình duyệt đang dùng tài khoản của bạn.
        </PageHeader.Description>
      </PageHeader>
      <SessionsPageClient />
    </div>
  )
}

