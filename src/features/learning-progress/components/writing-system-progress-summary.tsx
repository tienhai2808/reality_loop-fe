import type { WritingSystemProgressSummary } from "../api/learning-progress-schemas"

export function WritingSystemProgressSummaryView({
  summary,
}: {
  summary: WritingSystemProgressSummary
}) {
  return (
    <div className="flex max-w-sm items-center gap-2">
      <p className="text-xs font-normal text-muted-foreground">
        {summary.completedItems}/{summary.totalItems} chữ đã học
      </p>
      <div
        role="progressbar"
        aria-label="Số chữ đã học"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.completionPercentage}
        aria-valuetext={`Đã học ${summary.completedItems}/${summary.totalItems} chữ`}
        className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${summary.completionPercentage}%` }}
        />
      </div>
    </div>
  )
}
