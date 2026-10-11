import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

export default function MissionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader>
        <PageHeader.Title>Missions</PageHeader.Title>
        <PageHeader.Description>
          Choose a real situation, enter the simulation, and turn friction into review.
        </PageHeader.Description>
      </PageHeader>
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Start from intent</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Mission creation will expand here after the Today composer establishes the goal.
        </p>
        <Button className="mt-4">Start mission</Button>
      </div>
    </div>
  )
}
