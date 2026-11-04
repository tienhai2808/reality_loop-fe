"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import type {
  HandwritingPolicy,
  InkDrawing,
  InkPoint,
} from "../api/handwriting-schemas"

type Draft = {
  pointerId: number
  points: InkPoint[]
  rect: DOMRect
  failed: boolean
}

export function useHandwritingDrawing({
  drawing,
  policy,
  pointBudget,
  disabled,
  onChange,
  onStart,
  onActive,
}: {
  drawing: InkDrawing
  policy: HandwritingPolicy
  pointBudget: number
  disabled: boolean
  onChange: (drawing: InkDrawing) => void
  onStart: () => void
  onActive: (active: boolean) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const draft = useRef<Draft | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const ratio = window.devicePixelRatio || 1
    const width = Math.round(rect.width * ratio),
      height = Math.round(rect.height * ratio)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    const context = canvas.getContext("2d")
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, rect.width, rect.height)
    context.strokeStyle = getComputedStyle(canvas).color
    context.fillStyle = context.strokeStyle
    context.lineWidth = 2.5
    context.lineCap = "round"
    context.lineJoin = "round"
    const strokes =
      draft.current && !draft.current.failed
        ? [...drawing, draft.current.points]
        : drawing
    for (const stroke of strokes) {
      if (!stroke.length) continue
      context.beginPath()
      context.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height)
      if (stroke.length === 1) {
        context.arc(
          stroke[0].x * rect.width,
          stroke[0].y * rect.height,
          1.25,
          0,
          Math.PI * 2
        )
        context.fill()
      } else {
        for (const point of stroke.slice(1))
          context.lineTo(point.x * rect.width, point.y * rect.height)
        context.stroke()
      }
    }
  }, [drawing])

  useEffect(() => {
    paint()
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      if (
        draft.current &&
        (Math.abs(draft.current.rect.width - rect.width) > 0.25 ||
          Math.abs(draft.current.rect.height - rect.height) > 0.25)
      ) {
        draft.current.failed = true
        setMessage(
          "The drawing area resized. The unfinished stroke wasn't added; draw it again."
        )
      }
      paint()
    })
    resize.observe(canvas)
    const theme = new MutationObserver(paint)
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    window.addEventListener("resize", paint)
    return () => {
      resize.disconnect()
      theme.disconnect()
      window.removeEventListener("resize", paint)
    }
  }, [paint])
  useEffect(
    () => () => {
      draft.current = null
    },
    []
  )

  function append(event: PointerEvent, force = false) {
    const current = draft.current
    if (!current || current.failed) return
    const rect = canvasRef.current?.getBoundingClientRect() ?? current.rect
    if (
      !rect.width ||
      !rect.height ||
      Math.abs(rect.width - current.rect.width) > 0.25 ||
      Math.abs(rect.height - current.rect.height) > 0.25
    ) {
      current.failed = true
      setMessage(
        "The drawing area resized. The unfinished stroke wasn't added; draw it again."
      )
      return
    }
    const point = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    }
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return
    const last = current.points.at(-1)
    if (last && point.x === last.x && point.y === last.y) return
    // Capture roughly one CSS pixel of movement, always retaining the final endpoint.
    if (
      last &&
      !force &&
      Math.hypot(
        (point.x - last.x) * current.rect.width,
        (point.y - last.y) * current.rect.height
      ) < 1
    )
      return
    const used = drawing.reduce((total, stroke) => total + stroke.length, 0)
    if (
      current.points.length >= policy.maximumPointsPerStroke ||
      used + current.points.length >= pointBudget
    ) {
      current.failed = true
      current.points = []
      setMessage(
        "This stroke exceeded the drawing limits and wasn't added. Use a shorter stroke, or undo/clear and redraw."
      )
      return
    }
    current.points.push(point)
  }
  function down(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (disabled || draft.current || !event.isPrimary || event.button !== 0)
      return
    if (drawing.length >= policy.maximumStrokesPerCharacter) {
      setMessage(
        `This character allows at most ${policy.maximumStrokesPerCharacter} strokes. Undo or clear a stroke first.`
      )
      return
    }
    if (
      drawing.reduce((total, stroke) => total + stroke.length, 0) >= pointBudget
    ) {
      setMessage(
        "The attempt's point limit has been reached. Undo or clear strokes before drawing again."
      )
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    draft.current = {
      pointerId: event.pointerId,
      points: [],
      rect,
      failed: false,
    }
    setMessage(null)
    onStart()
    onActive(true)
    append(event.nativeEvent, true)
    paint()
  }
  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (draft.current?.pointerId !== event.pointerId) return
    event.preventDefault()
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? []
    for (const point of coalesced) append(point)
    append(event.nativeEvent)
    paint()
  }
  function finish(
    event: ReactPointerEvent<HTMLCanvasElement>,
    cancelled: boolean
  ) {
    const current = draft.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!cancelled) append(event.nativeEvent, true)
    if (!cancelled && !current.failed) paint()
    draft.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    if (!cancelled && !current.failed && current.points.length)
      onChange([...drawing, current.points])
    else if (cancelled)
      setMessage("The unfinished stroke wasn't added. You can draw it again.")
    onActive(false)
    if (cancelled || current.failed) paint()
  }
  return {
    canvasRef,
    message,
    handlers: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) =>
        finish(event, false),
      onPointerCancel: (event: ReactPointerEvent<HTMLCanvasElement>) =>
        finish(event, true),
      onLostPointerCapture: (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (draft.current?.pointerId === event.pointerId) finish(event, true)
      },
      onContextMenu: (event: React.MouseEvent<HTMLCanvasElement>) =>
        event.preventDefault(),
    },
  }
}
