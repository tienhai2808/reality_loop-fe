"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Loader2, Square, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Playback = { audio: HTMLAudioElement; stop: () => void }
// Only the current public pronunciation clip is coordinated; no tokens or media cache.
let activePlayback: Playback | null = null

function disposePlayback(playback: Playback) {
  if (activePlayback === playback) activePlayback = null
  const { audio } = playback
  audio.onplaying = null
  audio.onwaiting = null
  audio.onended = null
  audio.onerror = null
  audio.pause()
  audio.removeAttribute("src")
  audio.load()
}

export function PronunciationAudioButton({
  url,
  label,
  compact = false,
  scope = "",
}: {
  url: string | null
  label: string
  compact?: boolean
  scope?: string
}) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" || parsed.username || parsed.password)
      return null
  } catch {
    return null
  }
  return (
    <AudioPlaybackButton
      key={`${scope}:${url}`}
      url={url}
      label={label}
      compact={compact}
    />
  )
}

function AudioPlaybackButton({
  url,
  label,
  compact,
}: {
  url: string
  label: string
  compact: boolean
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">(
    "idle"
  )
  const playbackRef = useRef<Playback | null>(null)
  const errorId = useId()

  useEffect(
    () => () => {
      const playback = playbackRef.current
      playbackRef.current = null
      if (playback) disposePlayback(playback)
    },
    []
  )

  function stop() {
    const playback = playbackRef.current
    playbackRef.current = null
    if (playback) disposePlayback(playback)
    setState("idle")
  }

  function toggle() {
    if (playbackRef.current) {
      stop()
      return
    }
    activePlayback?.stop()
    // Create and load media only in this user action, using the exact public URL.
    const audio = new Audio()
    const playback: Playback = { audio, stop }
    playbackRef.current = playback
    activePlayback = playback
    setState("loading")
    function fail() {
      if (playbackRef.current !== playback) return
      playbackRef.current = null
      disposePlayback(playback)
      setState("error")
    }
    audio.preload = "none"
    audio.crossOrigin = "anonymous"
    audio.onplaying = () => {
      if (playbackRef.current === playback) setState("playing")
    }
    audio.onwaiting = () => {
      if (playbackRef.current === playback) setState("loading")
    }
    audio.onended = () => {
      if (playbackRef.current === playback) stop()
    }
    audio.onerror = fail
    try {
      audio.src = url
      void audio.play().catch(fail)
    } catch {
      fail()
    }
  }

  const running = state === "loading" || state === "playing"
  const title = `${running ? "Stop pronunciation" : "Play pronunciation"}: ${label}`
  return (
    <div className={cn("min-w-0", compact ? "self-center" : "space-y-2")}>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "default"}
        onClick={toggle}
        aria-label={title}
        title={compact ? title : undefined}
        aria-pressed={running}
        aria-describedby={state === "error" ? errorId : undefined}
        className={cn(
          compact ? "size-9" : "h-auto min-h-10 whitespace-normal py-2",
          running && "border-primary text-primary"
        )}
      >
        {state === "loading" ? (
          <Loader2
            className="size-4 motion-safe:animate-spin"
            aria-hidden="true"
          />
        ) : running ? (
          <Square className="size-3.5 fill-current" aria-hidden="true" />
        ) : (
          <Volume2 className="size-4" aria-hidden="true" />
        )}
        {!compact ? (
          <span>
            {state === "loading"
              ? "Stop loading"
              : state === "playing"
                ? "Stop pronunciation"
                : state === "error"
                  ? "Retry audio"
                  : "Play pronunciation"}
          </span>
        ) : null}
      </Button>
      <span role="status" className="sr-only">
        {state === "loading"
          ? `Loading pronunciation of ${label}. Activate again to stop.`
          : state === "playing"
            ? `Playing pronunciation of ${label}.`
            : ""}
      </span>
      {state === "error" ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1 break-words text-xs leading-5 text-destructive"
        >
          Audio couldn&apos;t be played.
          {compact ? " Try again." : " Check your connection and try again."}
        </p>
      ) : null}
    </div>
  )
}
