import { cn } from "@/lib/utils"

export function CapabilityBar({
  label,
  value,
  className,
}: {
  label: string
  value: number
  className?: string
}) {
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{normalizedValue}%</span>
      </div>
      <div
        className="h-2 rounded-full bg-muted"
        role="progressbar"
        aria-label={`${label}: ${normalizedValue} percent`}
        aria-valuenow={normalizedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}
