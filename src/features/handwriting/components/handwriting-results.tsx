"use client"

import Link from "next/link"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  HandwritingAttemptCharacter,
  HandwritingAttemptDetail,
  HandwritingTemplateDetail,
} from "../api/handwriting-schemas"
import {
  handwritingAttemptHref,
  handwritingIssueLabels,
} from "../lib/handwriting-labels"
import { HandwritingSourceCredit } from "./handwriting-source"
import { StrokeViewer } from "./stroke-viewer"

export function HandwritingCharacterResult({
  character,
  reference,
  languageCode,
}: {
  character: HandwritingAttemptCharacter
  reference?: HandwritingTemplateDetail
  languageCode?: string
}) {
  const [highlight, setHighlight] = useState<number>()
  return (
    <section
      className="space-y-4 border-t border-border pt-5"
      aria-label={`Character ${character.position + 1}: ${character.template.symbol}`}
    >
      <h3
        lang={languageCode}
        className="font-ja break-all text-3xl leading-relaxed"
      >
        {character.template.symbol}
      </h3>
      {character.drawingFormatVersion === 1 ? (
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          {reference?.drawingFormatVersion === 1 &&
          reference.template.reference.revision ===
            character.template.revision &&
          reference.template.reference.id === character.template.id ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Reference</p>
              <StrokeViewer
                strokes={reference.strokes}
                label={`Reference for ${character.template.symbol}`}
                reference
                highlight={highlight}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <p className="text-sm font-medium">Your drawing</p>
            <StrokeViewer
              key={character.id}
              strokes={character.strokes}
              label={`Submitted drawing of ${character.template.symbol}`}
              highlight={highlight}
              replay
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This saved drawing uses a format this version of the app cannot replay
          yet.
        </p>
      )}
      {character.feedbackFormatVersion === 1 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                character.feedback.passed
                  ? "bg-success-subtle text-success"
                  : "bg-warning-subtle text-warning"
              )}
            >
              {character.feedback.passed ? "Passed" : "Needs improvement"}
            </span>
            <span className="text-sm text-muted-foreground">
              Shape match {character.feedback.matchScore} / 100
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {character.feedback.actualStrokeCount} strokes drawn ·{" "}
            {character.feedback.expectedStrokeCount} expected
          </p>
          {character.feedback.issues.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
              {character.feedback.issues.map((issue, index) => (
                <li key={`${issue}:${index}`}>
                  {handwritingIssueLabels[issue]}
                </li>
              ))}
            </ul>
          ) : null}
          {character.feedback.strokes.length ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Select a stroke to highlight the same index in each drawing.
              </p>
              <ul className="divide-y divide-border">
                {[...character.feedback.strokes]
                  .sort((a, b) => a.index - b.index)
                  .map((stroke) => (
                    <li key={stroke.index}>
                      <button
                        type="button"
                        aria-pressed={highlight === stroke.index}
                        onClick={() =>
                          setHighlight(
                            highlight === stroke.index
                              ? undefined
                              : stroke.index
                          )
                        }
                        className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-sm py-3 text-left text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="font-medium">
                          Stroke {stroke.index + 1}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                            stroke.passed
                              ? "bg-success-subtle text-success"
                              : "bg-warning-subtle text-warning"
                          )}
                        >
                          {stroke.passed
                            ? "Good"
                            : stroke.issues
                                .map((issue) => handwritingIssueLabels[issue])
                                .join(", ") || "Needs improvement"}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Detailed feedback uses a newer format. The saved result summary is
          still available.
        </p>
      )}
      <HandwritingSourceCredit source={character.template.source} />
    </section>
  )
}

export function HandwritingResults({
  detail,
  references = [],
  onPracticeAgain,
  languageCode,
}: {
  detail: HandwritingAttemptDetail
  references?: HandwritingTemplateDetail[]
  onPracticeAgain?: () => void
  languageCode?: string
}) {
  return (
    <section className="space-y-5" aria-label="Handwriting result">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">Handwriting result</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
              detail.attempt.passed
                ? "bg-success-subtle text-success"
                : "bg-warning-subtle text-warning"
            )}
          >
            {detail.attempt.passed ? "Passed" : "Needs improvement"}
          </span>
          <span className="text-sm text-muted-foreground">
            Shape match {detail.attempt.matchScore} / 100
          </span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          This measures drawing similarity. Stroke order and direction can still
          need work even with a high match score.
        </p>
      </header>
      {[...detail.characters]
        .sort((a, b) => a.position - b.position)
        .map((character) => (
          <HandwritingCharacterResult
            key={character.id}
            character={character}
            languageCode={languageCode}
            reference={references.find(
              (reference) =>
                reference.template.reference.id === character.template.id &&
                reference.template.reference.revision ===
                  character.template.revision
            )}
          />
        ))}
      <div className="flex flex-wrap items-center gap-3">
        {onPracticeAgain ? (
          <Button variant="outline" onClick={onPracticeAgain}>
            Practice again
          </Button>
        ) : null}
        <Link
          href={handwritingAttemptHref(
            detail.attempt.learningProfileId,
            detail.attempt.id
          )}
          className={buttonVariants({ variant: "outline" })}
        >
          Open saved attempt
        </Link>
        <Link
          href={`/learn/handwriting/${encodeURIComponent(detail.attempt.learningProfileId)}/history`}
          className={buttonVariants({ variant: "ghost" })}
        >
          View handwriting history
        </Link>
      </div>
    </section>
  )
}
