import { LanguageBugRow } from "@/components/reality/language-bug-row"
import { PageHeader } from "@/components/shared/page-header"

const bugs = [
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
  {
    id: "BUG-009",
    pattern: "どこですか",
    category: "Location questions",
    context: "Station",
    encounters: 4,
    status: "recovered",
  },
] as const

export default function BugsPage() {
  return (
    <div className="space-y-8">
      <PageHeader>
        <PageHeader.Title>Language Bugs</PageHeader.Title>
        <PageHeader.Description>12 open · 7 recovered this month</PageHeader.Description>
      </PageHeader>
      <section className="border-b border-border" aria-label="Language bug list">
        {bugs.map((bug) => (
          <LanguageBugRow key={bug.id} {...bug} />
        ))}
      </section>
    </div>
  )
}
