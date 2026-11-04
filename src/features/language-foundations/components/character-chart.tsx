"use client"

import { Circle, CircleDot, CircleCheck } from "lucide-react"
import type { WritingSystemItemProgress } from "@/features/learning-progress/api/learning-progress-schemas"
import type { ItemOperation } from "@/features/learning-progress/hooks/use-writing-progress"
import { DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { WritingSystemItemDto } from "../api/language-foundations-schemas"
import { PronunciationAudioButton } from "./audio/pronunciation-audio-button"

export function CharacterChart({
  items,
  languageCode,
  selectedId,
  onSelect,
  progress,
  operations,
}: {
  items: WritingSystemItemDto[]
  languageCode: string
  selectedId: string | null
  onSelect: (item: WritingSystemItemDto) => void
  progress?: ReadonlyMap<string, WritingSystemItemProgress>
  operations?: ReadonlyMap<string, ItemOperation>
}) {
  const cells = new Map<
    string,
    { row: number; column: number; items: WritingSystemItemDto[] }
  >()
  const unpositioned: WritingSystemItemDto[] = []
  let columns = 0
  for (const item of items) {
    if (item.rowIndex === null || item.columnIndex === null) {
      unpositioned.push(item)
      continue
    }
    columns = Math.max(columns, item.columnIndex + 1)
    const coordinate = `${item.rowIndex}:${item.columnIndex}`
    const cell = cells.get(coordinate)
    if (cell) cell.items.push(item)
    else
      cells.set(coordinate, {
        row: item.rowIndex,
        column: item.columnIndex,
        items: [item],
      })
  }
  const positioned = [...cells.values()].sort(
    (a, b) => a.row - b.row || a.column - b.column
  )

  function character(item: WritingSystemItemDto) {
    return (
      <CharacterCell
        key={item.id}
        item={item}
        languageCode={languageCode}
        selected={selectedId === item.id}
        playbackScope={selectedId ?? "chart"}
        onSelect={() => onSelect(item)}
        progress={progress?.get(item.id)}
        tracking={progress !== undefined}
        uncertain={operations?.get(item.id)?.requiresRead === true}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      {positioned.length ? (
        <div
          className="max-w-full overflow-x-auto rounded-sm pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          role="region"
          aria-label="Character chart"
          tabIndex={0}
        >
          <div
            className="grid w-max gap-2 p-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, 5rem)`,
              gridAutoRows: "minmax(5.5rem, auto)",
            }}
          >
            {positioned.map((cell) => (
              <div
                key={cell.items[0].id}
                className="flex min-w-0 flex-col gap-2"
                style={{ gridRow: cell.row + 1, gridColumn: cell.column + 1 }}
              >
                {cell.items.map(character)}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {unpositioned.length ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2"
          aria-label={
            positioned.length ? "Additional characters" : "Characters"
          }
        >
          {unpositioned.map(character)}
        </div>
      ) : null}
    </div>
  )
}

function CharacterCell({
  item,
  languageCode,
  selected,
  playbackScope,
  onSelect,
  progress,
  tracking,
  uncertain,
}: {
  item: WritingSystemItemDto
  languageCode: string
  selected: boolean
  playbackScope: string
  onSelect: () => void
  progress: WritingSystemItemProgress | undefined
  tracking: boolean
  uncertain: boolean
}) {
  const progressLabel = uncertain
    ? "Progress needs refreshing"
    : progress?.status === "Completed"
      ? "Learned through"
      : progress?.status === "Learning"
        ? "Learning"
        : progress?.status === "NotStarted"
          ? "Not started"
          : "Progress not loaded"
  const StatusIcon =
    progress?.status === "Completed"
      ? CircleCheck
      : progress?.status === "Learning"
        ? CircleDot
        : Circle
  const statusColor =
    progress?.status === "Completed"
      ? "text-success"
      : progress?.status === "Learning"
        ? "text-primary"
        : "text-muted-foreground/50"
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <DialogTrigger
        render={<button type="button" />}
        onClick={onSelect}
        aria-label={`${item.symbol}${item.primaryReading ? `, ${item.primaryReading.transcription}` : ""}${tracking ? `, ${progressLabel}` : ""}`}
        aria-pressed={selected}
        className={cn(
          "relative flex min-h-22 w-full flex-1 flex-col items-center justify-center gap-1.5 rounded-sm border border-border bg-surface p-2 text-foreground outline-none transition-colors hover:border-border-strong hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
          selected && "border-primary bg-muted ring-1 ring-primary"
        )}
      >
        {tracking ? (
          <span
            className={cn("absolute left-1.5 top-1.5 transition-colors", statusColor)}
            title={progressLabel}
          >
            {progress && !uncertain ? (
              <StatusIcon className="size-3.5" aria-hidden="true" />
            ) : (
              <span className="text-xs text-muted-foreground" aria-hidden="true">
                …
              </span>
            )}
            <span className="sr-only">{progressLabel}</span>
          </span>
        ) : null}
        <span
          lang={languageCode}
          className="font-ja w-full break-all text-center text-3xl font-medium leading-none tracking-normal"
        >
          {item.symbol}
        </span>
        {item.primaryReading ? (
          <span className="w-full truncate text-center text-xs text-muted-foreground">
            {item.primaryReading.transcription}
          </span>
        ) : null}
      </DialogTrigger>
      {item.primaryReading ? (
        <PronunciationAudioButton
          url={item.primaryReading.audioUrl}
          label={item.primaryReading.transcription}
          scope={playbackScope}
          compact
        />
      ) : null}
    </div>
  )
}
