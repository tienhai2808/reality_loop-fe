import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Cài đặt</PageHeader.Title>
        <PageHeader.Description>
          Quản lý hồ sơ học, kết nối và tài khoản.
        </PageHeader.Description>
      </PageHeader>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        <Link
          href="/settings/learning"
          className="flex items-center justify-between gap-4 px-5 py-4 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="text-sm font-medium">Đang học</span>
          <ChevronRight
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>
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
        {["Âm thanh và micrô", "Hiển thị ngôn ngữ", "Giao diện"].map(
          (section) => (
            <div key={section} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium">{section}</span>
              <span className="text-sm text-muted-foreground">Sắp có</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
