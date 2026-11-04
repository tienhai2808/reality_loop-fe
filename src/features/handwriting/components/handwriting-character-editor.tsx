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
      aria-label={`Character position ${position + 1}: ${detail.template.reference.symbol}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Character {position + 1}
          </p>
          <h2
            lang={languageCode}
            className="font-ja break-all text-4xl leading-relaxed"
          >
            {detail.template.reference.symbol}
          </h2>
          <p className="text-xs text-muted-foreground">
            {detail.strokeCount} reference strokes · {drawing.length} drawn
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={controlsDisabled}
          onClick={onRemove}
        >
          Remove
        </Button>
      </header>
      {!confirmed ? (
        <div className="space-y-2 border-y border-border py-3">
          <p className="text-sm text-muted-foreground">
            Review this template before submitting. Your drawing has been kept.
          </p>
          <label
            className="block text-sm font-medium"
            htmlFor={`${id}-template`}
          >
            Choose a current template
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
                      label: "Previous template — choose again",
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
                  <SelectValue placeholder="Choose a template" />
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
            Confirm selected template
          </Button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={guide}
        disabled={controlsDisabled}
        onClick={() => setGuide(!guide)}
      >
        {guide ? "Hide guide" : "Show guide"}
      </Button>
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
            label="Stroke guide"
            reference
            overlay
          />
        ) : null}
        <canvas
          ref={canvasRef}
          {...handlers}
          className="absolute inset-0 block size-full touch-none text-foreground"
          aria-label={`Draw ${detail.template.reference.symbol}, character ${position + 1}`}
          aria-describedby={`${id}-instructions`}
          aria-disabled={disabled}
        />
      </div>
      <p
        id={`${id}-instructions`}
        className="text-xs leading-5 text-muted-foreground"
      >
        Use a mouse, touch, or stylus to draw. Freehand drawing requires a
        pointer input. Guide numbers show stroke starts; arrows show direction.
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
          Undo stroke
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={controlsDisabled || !drawing.length}
          onClick={() => onChange([])}
        >
          Clear
        </Button>
      </div>
      <HandwritingSourceCredit source={detail.template.reference.source} />
    </section>
  )
}
