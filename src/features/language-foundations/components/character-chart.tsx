"use client"

import { Fragment, type ReactNode } from "react"
import { Circle, CircleDot, CircleCheck } from "lucide-react"
import type { WritingSystemItemProgress } from "@/features/learning-progress/api/learning-progress-schemas"
import type { ItemOperation } from "@/features/learning-progress/hooks/use-writing-progress"
import { cn } from "@/lib/utils"
import type { WritingSystemItemDto } from "../api/language-foundations-schemas"

export function CharacterChart({
  items,
  languageCode,
  selectedId,
  onSelect,
  progress,
  operations,
  inlineDetail,
}: {
  items: WritingSystemItemDto[]
  languageCode: string
  selectedId: string | null
  onSelect: (item: WritingSystemItemDto) => void
  progress?: ReadonlyMap<string, WritingSystemItemProgress>
  operations?: ReadonlyMap<string, ItemOperation>
  inlineDetail?: ReactNode
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

  const selectedRow = inlineDetail
    ? positioned.find((cell) =>
        cell.items.some((item) => item.id === selectedId)
      )?.row
    : undefined

  function character(item: WritingSystemItemDto) {
    return (
      <CharacterCell
        key={item.id}
        item={item}
        languageCode={languageCode}
        selected={selectedId === item.id}
        onSelect={() => onSelect(item)}
        progress={progress?.get(item.id)}
        tracking={progress !== undefined}
        uncertain={operations?.get(item.id)?.requiresRead === true}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-3">
      {positioned.length ? (
        <div
          className="max-w-full overflow-x-auto rounded-sm pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          role="region"
          aria-label="Lưới chữ"
          tabIndex={0}
        >
          <div
            className="grid w-full gap-1.5 p-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(2.75rem, 1fr))`,
              gridAutoRows: "minmax(3.5rem, auto)",
            }}
          >
            {positioned.map((cell) => (
              <div
                key={cell.items[0].id}
                className="flex min-w-0 flex-col gap-2"
                style={{
                  gridRow:
                    cell.row +
                    1 +
                    (selectedRow !== undefined && cell.row > selectedRow
                      ? 1
                      : 0),
                  gridColumn: cell.column + 1,
                }}
              >
                {cell.items.map(character)}
              </div>
            ))}
            {selectedRow !== undefined ? (
              <div
                className="col-span-full min-w-0"
                style={{ gridRow: selectedRow + 2 }}
              >
                {inlineDetail}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {unpositioned.length ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2"
          aria-label={positioned.length ? "Chữ bổ sung" : "Chữ"}
        >
          {unpositioned.map((item) => (
            <Fragment key={item.id}>
              {character(item)}
              {item.id === selectedId && inlineDetail ? (
                <div className="col-span-full">{inlineDetail}</div>
              ) : null}
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CharacterCell({
  item,
  languageCode,
  selected,
  onSelect,
  progress,
  tracking,
  uncertain,
}: {
  item: WritingSystemItemDto
  languageCode: string
  selected: boolean
  onSelect: () => void
  progress: WritingSystemItemProgress | undefined
  tracking: boolean
  uncertain: boolean
}) {
  const progressLabel = uncertain
    ? "Cần tải lại tiến độ"
    : progress?.status === "Completed"
      ? "Đã học"
      : progress?.status === "Learning"
        ? "Đang học"
        : progress?.status === "NotStarted"
          ? "Chưa học"
          : "Chưa tải tiến độ"
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
      <button
        id={`character-${item.id}`}
        type="button"
        onClick={onSelect}
        aria-label={`${item.symbol}${item.primaryReading ? `, ${item.primaryReading.transcription}` : ""}${tracking ? `, ${progressLabel}` : ""}`}
        aria-pressed={selected}
        className={cn(
          "relative flex min-h-14 w-full flex-1 flex-col items-center justify-center gap-1 rounded-sm border border-border bg-surface p-2 text-foreground outline-none transition-colors hover:border-border-strong hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
          selected && "border-primary bg-muted ring-1 ring-primary"
        )}
      >
        {tracking ? (
          <span
            className={cn(
              "absolute left-1.5 top-1.5 transition-colors",
              statusColor
            )}
            title={progressLabel}
          >
            {progress && !uncertain ? (
              <StatusIcon className="size-3.5" aria-hidden="true" />
            ) : (
              <span
                className="text-xs text-muted-foreground"
                aria-hidden="true"
              >
                …
              </span>
            )}
            <span className="sr-only">{progressLabel}</span>
          </span>
        ) : null}
        <span
          lang={languageCode}
          className="font-ja w-full break-all text-center text-[1.625rem] font-medium leading-none tracking-normal"
        >
          {item.symbol}
        </span>
        {item.primaryReading ? (
          <span className="w-full truncate text-center text-xs text-muted-foreground">
            {item.primaryReading.transcription}
          </span>
        ) : null}
      </button>
    </div>
  )
}
