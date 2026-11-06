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
            "Hồ sơ hiện không có. Chọn ngôn ngữ để tạo hồ sơ mới."
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
            "Đã tải lại hồ sơ. Chưa có hồ sơ cho ngôn ngữ này, bạn có thể tạo lại."
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
          "Đã tải lại hồ sơ. Bạn có thể tạo hồ sơ."
        )
        setPhase({ kind: "editing" })
      }
    })
  }

  if (phase.kind === "review")
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6">
          Chưa xác nhận được hồ sơ vừa tạo. Hãy tải lại danh sách trước khi tạo hồ sơ khác cho {languageLabel(phase.language)}.
        </p>
        <LearningFeedback
          error={request.error ?? phase.error}
          onRetry={() => void reconcile(phase.language)}
          pending={request.pending}
          retryLabel="Tải lại hồ sơ"
        />
        <div className="flex flex-wrap justify-end gap-2">
          {onCancel ? (
            <Button
              variant="ghost"
              disabled={request.pending}
              onClick={onCancel}
            >
              Hủy
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
            ? "Ngôn ngữ này đã có hồ sơ. Hãy xem lại trước khi tiếp tục."
            : "Đã lưu hồ sơ học. Chọn hồ sơ để tiếp tục."}
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
            Giải thích bằng {languageLabel(phase.profile.explanationLanguage)}
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
              {request.pending ? "Đang chọn hồ sơ…" : "Dùng hồ sơ này"}
            </Button>
          ) : (
            <Button onClick={onCancel}>Về danh sách hồ sơ</Button>
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
          onboarding ? "Tạo hồ sơ và bắt đầu" : "Tạo hồ sơ học"
        }
        onSubmit={create}
        onCancel={onCancel}
      />
    </div>
  )
}
