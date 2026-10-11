import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { CapabilityBar } from "@/components/reality/capability-bar"
import { Button } from "@/components/ui/button"

export function MissionCard({
  title,
  context,
  bugs,
  progress,
  href,
}: {
  title: string
  context: string
  bugs: number
  progress: number
  href: string
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-semibold leading-6">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {context} · {bugs} language bugs
            </p>
          </div>
          <CapabilityBar label="Mission progress" value={progress} />
        </div>
        <Button render={<Link href={href} />} nativeButton={false}>
          Continue
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}
