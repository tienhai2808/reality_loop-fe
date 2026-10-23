"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createLearningProfile } from "../api/learning-profile-api"
import {
  isUnknownProfileCreation,
  normalizeLearningProfileError,
  type LearningProfileError,
} from "../api/learning-profile-errors"
import type {
  LearningProfile,
  LearningProfileFormValues,
  LearningProfileOptions,
} from "../api/learning-profile-schemas"
import { useCurrentLearningProfile } from "../hooks/use-current-learning-profile"
import { useLearningRequest } from "../hooks/use-learning-request"
import {
  languageLabel,
  learningGoalLabels,
  proficiencyLabels,
} from "../lib/language-options"
import { LearningProfileForm } from "./learning-profile-form"
import { LearningFeedback } from "./learning-feedback"

type Phase =
  | { kind: "editing" }
  | { kind: "saved"; profile: LearningProfile; recovered: boolean }
  | { kind: "review"; language: string; error: LearningProfileError }

export function CreateLearningProfile({
  options,
  onboarding,
  onCreated,
  onRecover,
  onCancel,
}: {
  options: LearningProfileOptions
  onboarding: boolean
  onCreated: (profile: LearningProfile) => void
  onRecover: (
    language: string,
    signal: AbortSignal
  ) => Promise<LearningProfile | null>
  onCancel?: () => void
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "editing" })
  const [notice, setNotice] = useState<string | null>(null)
  const { selectCurrent } = useCurrentLearningProfile()
  const request = useLearningRequest()

  async function activate(profile: LearningProfile) {
    await request.run(async (signal) => {
      try {
        await selectCurrent(profile.id, signal)
      } catch (value) {
        if (signal.aborted) return
        if (normalizeLearningProfileError(value).status !== 404) throw value
        const existing = await onRecover(profile.targetLanguage, signal)
        if (signal.aborted) return
        if (existing)
          setPhase({ kind: "saved", profile: existing, recovered: true })
        else {
          setNotice(
            "This learning profile is no longer available. Choose a language to create a new one."
          )
          setPhase({ kind: "editing" })
        }
      }
    })
  }

  async function create(
    values: LearningProfileFormValues,
    signal: AbortSignal
  ) {
    let profile: LearningProfile
    try {
      profile = await createLearningProfile(
        { ...values, goalNote: values.goalNote || null },
        signal
      )
    } catch (value) {
      if (signal.aborted) return
      const error = normalizeLearningProfileError(value)
      if (!isUnknownProfileCreation(error) && error.status !== 409) throw error
      // Creation has no idempotency key: reconcile server pages before enabling a new POST.
      try {
        const existing = await onRecover(values.targetLanguage, signal)
        if (signal.aborted) return
        if (existing)
          setPhase({ kind: "saved", profile: existing, recovered: true })
        else {
          setNotice(
            "Your profiles have been refreshed. No profile for this language was found; you can try creating it again."
          )
          throw error
        }
      } catch (recoveryError) {
        if (signal.aborted) return
        if (recoveryError === error) throw error
        setPhase({
          kind: "review",
          language: values.targetLanguage,
          error: normalizeLearningProfileError(recoveryError),
        })
      }
      return
    }
    if (signal.aborted) return
    if (!onboarding) {
      onCreated(profile)
      return
    }
    // Keep the created DTO even if the independent selection request fails.
    setPhase({ kind: "saved", profile, recovered: false })
    await activate(profile)
  }

  async function reconcile(language: string) {
    await request.run(async (signal) => {
      const existing = await onRecover(language, signal)
      if (signal.aborted) return
      if (existing)
        setPhase({ kind: "saved", profile: existing, recovered: true })
      else {
        setNotice(
          "Your profiles have been refreshed. You can try creating a profile again."
        )
        setPhase({ kind: "editing" })
      }
    })
  }

  if (phase.kind === "review")
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6">
          The create result is unknown. Refresh your profiles before creating
          another profile for {languageLabel(phase.language)}.
        </p>
        <LearningFeedback
          error={request.error ?? phase.error}
          onRetry={() => void reconcile(phase.language)}
          pending={request.pending}
          retryLabel="Refresh profiles"
        />
        <div className="flex flex-wrap justify-end gap-2">
          {onCancel ? (
            <Button
              variant="ghost"
              disabled={request.pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    )

  if (phase.kind === "saved")
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm leading-6">
          {phase.recovered
            ? "A profile for this language is already saved. Review it before continuing."
            : "Your learning profile is saved. Select it to continue."}
        </p>
        <div className="space-y-1 border-y border-border py-4">
          <h2 className="text-base font-semibold">
            {languageLabel(phase.profile.targetLanguage)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {proficiencyLabels[phase.profile.proficiencyLevel]} ·{" "}
            {learningGoalLabels[phase.profile.primaryGoal]}
          </p>
          <p className="text-sm text-muted-foreground">
            Explanations in {languageLabel(phase.profile.explanationLanguage)}
          </p>
          {phase.profile.goalNote ? (
            <p className="break-words text-sm">{phase.profile.goalNote}</p>
          ) : null}
        </div>
        <LearningFeedback error={request.error} />
        <div className="flex flex-wrap justify-end gap-2">
          {onboarding ? (
            <Button
              disabled={request.pending || request.waiting}
              aria-busy={request.pending}
              onClick={() => void activate(phase.profile)}
            >
              <Check aria-hidden="true" />
              {request.pending ? "Selecting profile..." : "Use this profile"}
            </Button>
          ) : (
            <Button onClick={onCancel}>Back to profiles</Button>
          )}
        </div>
      </div>
    )

  return (
    <div className="space-y-4">
      {notice ? (
        <p role="status" className="text-sm leading-6 text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <LearningProfileForm
        options={options}
        submitLabel={
          onboarding ? "Create profile & continue" : "Create learning profile"
        }
        onSubmit={create}
        onCancel={onCancel}
      />
    </div>
  )
}
