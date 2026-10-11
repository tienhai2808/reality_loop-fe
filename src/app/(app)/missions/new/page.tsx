import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

export default async function NewMissionPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>
}) {
  const { intent } = await searchParams
  const missionIntent = intent?.trim() || "Practice a real situation in Japanese."

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Mission briefing</PageHeader.Title>
        <PageHeader.Description>{missionIntent}</PageHeader.Description>
      </PageHeader>
      <section className="space-y-5 rounded-lg border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold">Tokyo everyday context</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A short speaking mission will be generated from this intent.
          </p>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <span className="rounded-sm bg-muted px-3 py-2">Hints available</span>
          <span className="rounded-sm bg-muted px-3 py-2">Voice first</span>
          <span className="rounded-sm bg-muted px-3 py-2">Text fallback</span>
        </div>
        <Button>Start mission</Button>
      </section>
    </div>
  )
}
