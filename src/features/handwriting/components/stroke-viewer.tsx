"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { InkDrawing } from "../api/handwriting-schemas"
import { cn } from "@/lib/utils"

export function StrokeViewer({
  strokes,
  label,
  reference = false,
  highlight,
  replay = false,
  overlay = false,
}: {
  strokes: InkDrawing
  label: string
  reference?: boolean
  highlight?: number
  replay?: boolean
  overlay?: boolean
}) {
  const marker = useId()
  const [visible, setVisible] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const frame = useRef<number | null>(null)
  const total = strokes.reduce((sum, stroke) => sum + stroke.length, 0)
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    []
  )
  function play() {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
      setVisible(null)
      return
    }
    if (!total) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setNotice(
        "All saved strokes are shown. Animated replay is disabled by your reduced motion preference."
      )
      return
    }
    setNotice(null)
    setVisible(1)
    let start: number | null = null
    const duration = Math.max(700, Math.min(5000, total * 12))
    function tick(now: number) {
      start ??= now
      const count = Math.min(
        total,
        Math.max(1, Math.floor(((now - start) / duration) * total))
      )
      setVisible(count)
      if (count < total) frame.current = requestAnimationFrame(tick)
      else {
        frame.current = null
        setVisible(null)
      }
    }
    frame.current = requestAnimationFrame(tick)
  }
  return (
    <div
      className={cn(
        overlay
          ? "pointer-events-none absolute inset-0 opacity-25"
          : "space-y-2"
      )}
    >
      <svg
        viewBox="0 0 1 1"
        role={overlay ? undefined : "img"}
        aria-label={overlay ? undefined : label}
        aria-hidden={overlay ? true : undefined}
        className={cn(
          "aspect-square w-full text-foreground",
          !overlay && "rounded-md border border-border bg-surface"
        )}
      >
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        {!overlay ? (
          <path
            d="M .5 0 V 1 M 0 .5 H 1"
            fill="none"
            className="stroke-border"
            strokeWidth=".003"
            strokeDasharray=".015 .015"
          />
        ) : null}
        {strokes.map((stroke, index) => {
          const offset = strokes
            .slice(0, index)
            .reduce((sum, previous) => sum + previous.length, 0)
          const points =
            visible === null
              ? stroke
              : stroke.slice(0, Math.max(0, visible - offset))
          if (!points.length) return null
          return (
            <g
              key={index}
              className={cn(
                highlight !== undefined && highlight !== index && "opacity-20",
                highlight === index && "text-primary"
              )}
            >
              {points.length === 1 ? (
                <circle
                  cx={points[0].x}
                  cy={points[0].y}
                  r=".006"
                  fill="currentColor"
                />
              ) : (
                <polyline
                  points={points
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth=".012"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={reference ? `url(#${marker})` : undefined}
                />
              )}
              {reference ? (
                <text
                  x={Math.max(0.035, Math.min(0.95, points[0].x))}
                  y={Math.max(0.045, points[0].y - 0.018)}
                  fontSize=".045"
                  className="fill-primary"
                  stroke="var(--surface)"
                  strokeWidth=".008"
                  paintOrder="stroke"
                >
                  {index + 1}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      {replay ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!total}
          onClick={play}
        >
          {visible === null ? "Replay drawing" : "Stop replay"}
        </Button>
      ) : null}
      {notice ? (
        <p role="status" className="text-xs leading-5 text-muted-foreground">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
