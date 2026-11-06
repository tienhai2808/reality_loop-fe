import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

export default async function NewMissionPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>
}) {
  const { intent } = await searchParams
  const missionIntent = intent?.trim() || "Luyện một tình huống thực tế bằng tiếng Nhật."

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Chuẩn bị luyện tình huống</PageHeader.Title>
        <PageHeader.Description>{missionIntent}</PageHeader.Description>
      </PageHeader>
      <section className="space-y-5 rounded-lg border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold">Bối cảnh thường ngày ở Tokyo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bài hội thoại ngắn sẽ dựa trên tình huống bạn đã nhập.
          </p>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <span className="rounded-sm bg-muted px-3 py-2">Có gợi ý</span>
          <span className="rounded-sm bg-muted px-3 py-2">Luyện nói</span>
          <span className="rounded-sm bg-muted px-3 py-2">Có thể nhập chữ</span>
        </div>
        <Button>Bắt đầu luyện</Button>
      </section>
    </div>
  )
}
