import { PageHeader } from "@/components/shared/page-header"

export default function LibraryPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Thư viện</PageHeader.Title>
        <PageHeader.Description>
          Cụm từ và mẫu câu đã lưu sẽ xuất hiện tại đây.
        </PageHeader.Description>
      </PageHeader>
      <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted-foreground">
        Chưa có mục đã lưu.
      </div>
    </div>
  )
}
