"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  deleteLearningProfile,
  getLearningProfile,
  updateLearningPreferences,
} from "../api/learning-profile-api"
import {
  normalizeLearningProfileError,
  type LearningProfileError,
} from "../api/learning-profile-errors"
import type {
  LearningProfile,
  LearningProfileFormValues,
  LearningProfileOptions,
} from "../api/learning-profile-schemas"
import { useLearningRequest } from "../hooks/use-learning-request"
import { languageLabel } from "../lib/language-options"
import { LearningFeedback } from "./learning-feedback"
import { LearningProfileForm } from "./learning-profile-form"

export function EditLearningProfile({
  profile: initialProfile,
  options,
  isCurrent,
  onReplaced,
  onSaved,
  onRemoved,
  onMissing,
  onCancel,
}: {
  profile: LearningProfile
  options: LearningProfileOptions
  isCurrent: boolean
  onReplaced: (profile: LearningProfile) => void
  onSaved: (profile: LearningProfile) => void
  onRemoved: () => Promise<void>
  onMissing: () => Promise<void>
  onCancel: () => void
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [blockedError, setBlockedError] = useState<LearningProfileError | null>(
    null
  )
  const request = useLearningRequest()

  async function loadLatest(signal: AbortSignal) {
    try {
      const latest = await getLearningProfile(profile.id, signal)
      if (signal.aborted) return
      setProfile(latest)
      onReplaced(latest)
      setBlocked(false)
      setConfirming(false)
      setNotice(
        "This learning profile changed in another session. We've loaded the latest version. Review your preferences before saving again."
      )
    } catch (value) {
      if (signal.aborted) return
      if (normalizeLearningProfileError(value).status === 404) await onMissing()
      throw value
    }
  }

  async function recover(value: unknown, signal: AbortSignal) {
    const error = normalizeLearningProfileError(value)
    if (signal.aborted) return
    if (error.status === 404) {
      await onMissing()
      return
    }
    if (error.status === 409) {
      try {
        await loadLatest(signal)
      } catch (refreshError) {
        if (!signal.aborted) {
          setBlockedError(normalizeLearningProfileError(refreshError))
          setBlocked(true)
        }
        throw refreshError
      }
      return
    }
    throw error
  }

  async function save(values: LearningProfileFormValues, signal: AbortSignal) {
    try {
      const updated = await updateLearningPreferences(
        profile.id,
        {
          version: profile.version,
          nativeLanguage: values.nativeLanguage,
          explanationLanguage: values.explanationLanguage,
          proficiencyLevel: values.proficiencyLevel,
          primaryGoal: values.primaryGoal,
          goalNote: values.goalNote || null,
        },
        signal
      )
      if (!signal.aborted) onSaved(updated)
    } catch (value) {
      await recover(value, signal)
    }
  }

  async function remove() {
    await request.run(async (signal) => {
      try {
        await deleteLearningProfile(profile.id, profile.version, signal)
        if (!signal.aborted) await onRemoved()
      } catch (value) {
        await recover(value, signal)
      }
    })
  }

  if (blocked)
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6">
          This profile changed elsewhere. Load its latest preferences before
          making changes.
        </p>
        <LearningFeedback
          error={request.error ?? blockedError}
          onRetry={() => void request.run(loadLatest)}
          pending={request.pending}
          retryLabel="Load latest profile"
        />
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )

  if (confirming)
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6">
          Delete your {languageLabel(profile.targetLanguage)} learning profile?
          {isCurrent
            ? " This also removes your current selection. You'll need to select another profile or create one before continuing."
            : " Its learning preferences will be removed."}
        </p>
        <LearningFeedback error={request.error} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            disabled={request.pending}
            onClick={() => setConfirming(false)}
          >
            Keep profile
          </Button>
          <Button
            variant="destructive"
            disabled={request.pending || request.waiting}
            aria-busy={request.pending}
            onClick={() => void remove()}
          >
            <Trash2 aria-hidden="true" />
            {request.pending ? "Deleting..." : "Delete profile"}
          </Button>
        </div>
      </div>
    )

  return (
    <div className="space-y-5">
      {notice ? (
        <p role="status" className="text-sm leading-6 text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <LearningProfileForm
        key={`${profile.id}:${profile.version}`}
        options={options}
        profile={profile}
        submitLabel="Save preferences"
        onSubmit={save}
        onCancel={onCancel}
        footer={
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete profile
          </Button>
        }
      />
    </div>
  )
}
