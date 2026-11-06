"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  HandwritingPolicy,
  HandwritingTemplateDetail,
  HandwritingTemplateSummary,
  InkDrawing,
} from "../api/handwriting-schemas"
import { useHandwritingDrawing } from "../hooks/use-handwriting-drawing"
import { StrokeViewer } from "./stroke-viewer"
import { HandwritingSourceCredit } from "./handwriting-source"

export function HandwritingCharacterEditor({
  detail,
  languageCode,
  drawing,
  position,
  policy,
  templates,
  pointBudget,
  disabled,
  editingStroke,
  confirmed,
  onConfirm,
  onSelect,
  onChange,
  onStart,
  onActive,
  onRemove,
}: {
  detail: HandwritingTemplateDetail
  languageCode: string
  drawing: InkDrawing
  position: number
  policy: HandwritingPolicy
  templates: HandwritingTemplateSummary[]
  pointBudget: number
  disabled: boolean
  editingStroke: boolean
  confirmed: boolean
  onConfirm: () => void
  onSelect: (id: string) => void
  onChange: (drawing: InkDrawing) => void
  onStart: () => void
  onActive: (value: boolean) => void
  onRemove: () => void
}) {
  const [guide, setGuide] = useState(false)
  const id = useId()
  const { canvasRef, message, handlers } = useHandwritingDrawing({
    drawing,
    policy,
    pointBudget,
    disabled,
    onChange,
    onStart,
    onActive,
  })
  const controlsDisabled = disabled || editingStroke
  return (
    <section
      className="min-w-0 space-y-3"
      aria-label={`Ô viết ${position + 1}: ${detail.template.reference.symbol}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3
            lang={languageCode}
            className="font-ja break-all text-2xl leading-relaxed"
          >
            {detail.template.reference.symbol}
          </h3>
          <p className="text-xs text-muted-foreground">
            {drawing.length}/{detail.strokeCount} nét
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={guide}
            disabled={controlsDisabled}
            onClick={() => setGuide(!guide)}
            className="min-h-11 sm:min-h-8"
          >
            {guide ? "Ẩn nét mẫu" : "Hiện nét mẫu"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={controlsDisabled}
            onClick={onRemove}
            className="min-h-11 sm:min-h-8"
          >
            Bỏ chữ
          </Button>
        </div>
      </header>
      {!confirmed ? (
        <div className="space-y-2 border-y border-border py-3">
          <p className="text-sm text-muted-foreground">
            Kiểm tra lại mẫu trước khi gửi. Bài viết của bạn vẫn còn.
          </p>
          <label
            className="block text-sm font-medium"
            htmlFor={`${id}-template`}
          >
            Chọn mẫu hiện có
          </label>
          {(() => {
            const templateOptions = [
              ...(!templates.some(
                (template) =>
                  template.reference.id === detail.template.reference.id
              )
                ? [
                    {
                      value: detail.template.reference.id,
                      label: "Mẫu cũ · chọn lại",
                    },
                  ]
                : []),
              ...templates.map((template) => ({
                value: template.reference.id,
                label: template.reference.symbol,
              })),
            ]
            return (
              <Select
                items={templateOptions}
                value={detail.template.reference.id}
                onValueChange={(val) => {
                  if (val) onSelect(val)
                }}
                disabled={controlsDisabled}
              >
                <SelectTrigger id={`${id}-template`} className="font-ja">
                  <SelectValue placeholder="Chọn mẫu" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="font-ja"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          })()}
          <Button
            variant="outline"
            disabled={controlsDisabled}
            onClick={onConfirm}
          >
            Xác nhận mẫu
          </Button>
        </div>
      ) : null}
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-md border border-border bg-surface">
        <svg
          className="pointer-events-none absolute inset-0 size-full stroke-border"
          viewBox="0 0 1 1"
          aria-hidden="true"
        >
          <path
            d="M .5 0 V 1 M 0 .5 H 1"
            fill="none"
            strokeWidth=".003"
            strokeDasharray=".015 .015"
          />
        </svg>
        {guide ? (
          <StrokeViewer
            strokes={detail.strokes}
            label="Hướng dẫn nét"
            reference
            overlay
          />
        ) : null}
        <canvas
          ref={canvasRef}
          {...handlers}
          className="absolute inset-0 block size-full touch-none text-foreground"
          aria-label={`Viết chữ ${detail.template.reference.symbol}, ô ${position + 1}`}
          aria-describedby={`${id}-instructions`}
          aria-disabled={disabled}
        />
      </div>
      <p id={`${id}-instructions`} className="sr-only">
        Viết bằng chuột, cảm ứng hoặc bút. Số chỉ điểm bắt đầu, mũi tên chỉ
        hướng nét.
      </p>
      {message ? (
        <p role="alert" className="text-sm leading-6 text-muted-foreground">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={controlsDisabled || !drawing.length}
          onClick={() => onChange(drawing.slice(0, -1))}
        >
          Hoàn tác nét
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={controlsDisabled || !drawing.length}
          onClick={() => onChange([])}
        >
          Xóa nét
        </Button>
      </div>
      <HandwritingSourceCredit source={detail.template.reference.source} />
    </section>
  )
}
