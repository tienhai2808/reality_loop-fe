"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { ArrowUpRight, Mic } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const examples = ["Order ramen", "Ask for directions", "Buy clothes"] as const

export function IntentComposer() {
  const router = useRouter()
  const [intent, setIntent] = useState("")
  const [error, setError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  function submitIntent(formData: FormData) {
    const value = String(formData.get("intent") ?? "").trim()

    if (!value) {
      setError("Describe one real situation you want to handle.")
      return
    }

    setError("")
    router.push(`/missions/new?intent=${encodeURIComponent(value)}`)
  }

  return (
    <section aria-labelledby="intent-heading" className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Good evening.</p>
        <h1
          id="intent-heading"
          className="max-w-2xl text-[2.5rem] font-semibold leading-[2.75rem] text-balance md:text-[3rem] md:leading-[3.25rem]"
        >
          What do you want to do in Japanese today?
        </h1>
      </div>

      <form action={submitIntent} ref={formRef} className="space-y-3">
        <label className="sr-only" htmlFor="mission-intent">
          Mission intent
        </label>
        <div
          className={cn(
            "flex items-end gap-2 rounded-lg border border-border bg-surface p-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15",
            error && "border-destructive ring-3 ring-destructive/10"
          )}
        >
          <textarea
            id="mission-intent"
            name="intent"
            rows={1}
            value={intent}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "intent-error" : undefined}
            onChange={(event) => {
              setIntent(event.currentTarget.value)
              if (error) {
                setError("")
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
            placeholder="I want to order ramen."
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button type="button" aria-label="Use voice input" variant="ghost" size="icon">
            <Mic aria-hidden="true" />
          </Button>
          <Button type="submit" aria-label="Start mission from intent" size="icon">
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </div>
        {error ? (
          <p id="intent-error" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2" aria-label="Suggested intents">
        {examples.map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIntent(`I want to ${example.toLowerCase()}.`)}
          >
            {example}
          </Button>
        ))}
      </div>
    </section>
  )
}
