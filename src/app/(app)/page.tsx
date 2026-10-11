import { CapabilityBar } from "@/components/reality/capability-bar"
import { IntentComposer } from "@/components/reality/intent-composer"
import { LanguageBugRow } from "@/components/reality/language-bug-row"
import { MissionCard } from "@/components/reality/mission-card"

const attentionBugs = [
  {
    id: "BUG-021",
    pattern: "〜てもらえますか",
    category: "Polite requests",
    context: "Restaurant",
    encounters: 3,
    status: "open",
  },
  {
    id: "BUG-019",
    pattern: "〜抜き",
    category: "Excluding something",
    context: "Shopping",
    encounters: 2,
    status: "practicing",
  },
] as const

export default function TodayPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-10">
        <IntentComposer />

        <section aria-labelledby="continue-heading" className="space-y-3">
          <h2 id="continue-heading" className="text-sm font-semibold">
            Continue
          </h2>
          <MissionCard
            title="Buy clothes"
            context="Shopping"
            bugs={3}
            progress={76}
            href="/mission/buy-clothes"
          />
        </section>

        <section aria-labelledby="attention-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 id="attention-heading" className="text-sm font-semibold">
              Needs attention
            </h2>
            <a href="/bugs" className="text-sm font-medium text-primary">
              View all
            </a>
          </div>
          <div className="border-b border-border">
            {attentionBugs.map((bug) => (
              <LanguageBugRow key={bug.id} {...bug} />
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-20">
        <section aria-labelledby="capability-heading" className="space-y-4">
          <div>
            <h2 id="capability-heading" className="text-sm font-semibold">
              Current capability
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Real-world contexts you can handle with less hesitation.
            </p>
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
            <CapabilityBar label="Restaurant" value={81} />
            <CapabilityBar label="Shopping" value={64} />
            <CapabilityBar label="Conversation recovery" value={44} />
          </div>
        </section>
      </aside>
    </div>
  )
}
