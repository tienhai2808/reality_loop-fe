import { CapabilityBar } from "@/components/reality/capability-bar"
import { PageHeader } from "@/components/shared/page-header"

export default function ProgressPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Progress</PageHeader.Title>
        <PageHeader.Description>
          Capability by real-world situation, not points or streaks.
        </PageHeader.Description>
      </PageHeader>
      <section className="space-y-5 rounded-lg border border-border bg-surface p-5">
        <CapabilityBar label="Restaurant" value={81} />
        <CapabilityBar label="Shopping" value={64} />
        <CapabilityBar label="Transportation" value={53} />
        <CapabilityBar label="Conversation recovery" value={44} />
      </section>
    </div>
  )
}
