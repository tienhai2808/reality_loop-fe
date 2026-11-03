import type { WritingSystemProgressSummary } from "../api/learning-progress-schemas"

export function WritingSystemProgressSummaryView({
  summary,
}: {
  summary: WritingSystemProgressSummary
}) {
  return (
    <div className="space-y-2" lang="en">
      <p className="text-xs font-normal text-muted-foreground">
        {summary.completedItems} of {summary.totalItems} learned through ·{" "}
        {summary.completionPercentage}%
      </p>
      <div
        role="progressbar"
        aria-label="Characters learned through"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.completionPercentage}
        aria-valuetext={`${summary.completedItems} of ${summary.totalItems} characters learned through`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${summary.completionPercentage}%` }}
        />
      </div>
    </div>
  )
}
