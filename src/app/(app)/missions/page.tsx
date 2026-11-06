import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

export default function MissionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader>
        <PageHeader.Title>Tình huống</PageHeader.Title>
        <PageHeader.Description>
          Chọn một tình huống đời thực để luyện và xem lại chỗ còn vướng.
        </PageHeader.Description>
      </PageHeader>
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Chọn mục tiêu luyện</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Bắt đầu bằng cách nhập tình huống ở trang Hôm nay.
        </p>
        <Button className="mt-4">Bắt đầu luyện</Button>
      </div>
    </div>
  )
}
