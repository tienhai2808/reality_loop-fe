"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { normalizeLearningProfileError } from "../api/learning-profile-errors"
import type { LearningProfile } from "../api/learning-profile-schemas"
import { useCurrentLearningProfile } from "../hooks/use-current-learning-profile"
import { useLearningProfiles } from "../hooks/use-learning-profiles"
import {
  useLearningRequest,
  useLearningRetryWait,
} from "../hooks/use-learning-request"
import {
  languageLabel,
  learningGoalLabels,
  proficiencyLabels,
} from "../lib/language-options"
import { CreateLearningProfile } from "./create-learning-profile"
import { EditLearningProfile } from "./edit-learning-profile"
import { LearningFeedback } from "./learning-feedback"
import { learningReturnPath } from "./learning-profile-gate"

type OpenDialog =
  { kind: "create" } | { kind: "edit"; profile: LearningProfile } | null

export function LearningProfilesManager({
  onboarding = false,
}: {
  onboarding?: boolean
}) {
  const {
    state: current,
    selectingId,
    refreshCurrent,
    selectCurrent,
    replaceProfile: replaceCurrentProfile,
  } = useCurrentLearningProfile()
  const {
    options,
    profiles,
    loadingMore,
    reloadOptions,
    reload,
    loadMore,
    replaceProfile,
    recoverCreation,
  } = useLearningProfiles()
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const router = useRouter()
  const search = useSearchParams()
  const request = useLearningRequest()
  const currentWaiting = useLearningRetryWait(
    current.status === "error" ? current.error.retryAt : undefined
  )
  const listWaiting = useLearningRetryWait(profiles.error?.retryAt)
  const selectedId = current.current?.profile.id

  useEffect(() => {
    if (onboarding && current.status === "ready" && current.current)
      router.replace(learningReturnPath(search.get("next")))
  }, [onboarding, current, router, search])

  async function activate(profile: LearningProfile) {
    await request.run(async (signal) => {
      try {
        const selected = await selectCurrent(profile.id, signal)
        if (!signal.aborted) replaceProfile(selected.profile)
        if (!signal.aborted && !onboarding)
          toast.success(`Now learning ${languageLabel(profile.targetLanguage)}`)
      } catch (value) {
        if (
          !signal.aborted &&
          normalizeLearningProfileError(value).status === 404
        )
          await Promise.allSettled([reload(), refreshCurrent()])
        throw value
      }
    })
  }

  function replace(profile: LearningProfile) {
    replaceProfile(profile)
    replaceCurrentProfile(profile)
  }

  function closeDialog() {
    if (dialog?.kind === "create") void reload()
    setDialog(null)
  }

  function created() {
    setDialog(null)
    void reload()
    toast.success("Learning profile created")
  }

  async function removed(missing = false) {
    setDialog(null)
    await Promise.allSettled([reload(), refreshCurrent()])
    toast(
      missing
        ? "This learning profile is no longer available."
        : "Learning profile deleted"
    )
  }

  const canCreate =
    options.status === "ready" &&
    options.data &&
    profiles.status === "ready" &&
    !loadingMore
  const inlineCreate =
    onboarding && profiles.status === "ready" && !profiles.data.items.length

  if (onboarding && current.status === "ready" && current.current)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Opening Reality Loop...
      </p>
    )

  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
    >
      <div className="space-y-6">
        {current.status === "loading" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Checking your current learning profile...
          </p>
        ) : null}
        {current.status === "error" ? (
          <LearningFeedback
            error={current.error}
            onRetry={() => void refreshCurrent().catch(() => undefined)}
            retryLabel="Refresh current profile"
          />
        ) : null}
        {!onboarding && current.status === "ready" && !current.current ? (
          <p role="status" className="text-sm leading-6 text-muted-foreground">
            No current learning profile. Choose an existing profile or add a
            language to continue.
          </p>
        ) : null}
        {options.status === "loading" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading learning preferences...
          </p>
        ) : null}
        {options.status === "error" ? (
          <LearningFeedback
            error={options.error}
            onRetry={() => void reloadOptions()}
            retryLabel="Retry preferences"
          />
        ) : null}
        {options.status === "ready" &&
        options.data &&
        (!options.data.learningGoals.length ||
          !options.data.proficiencyLevels.length) ? (
          <p className="text-sm text-muted-foreground">
            Learning preferences are currently unavailable. Please try again
            later.
          </p>
        ) : null}
        {profiles.status === "loading" ? (
          <div role="status" className="space-y-3 border-y border-border py-5">
            <span className="sr-only">Loading learning profiles...</span>
            <div className="h-4 w-1/3 rounded-sm bg-muted" />
            <div className="h-3 w-1/2 rounded-sm bg-muted" />
          </div>
        ) : null}
        {profiles.status === "error" ? (
          <LearningFeedback
            error={profiles.error}
            onRetry={() => void reload()}
            retryLabel="Refresh profiles"
          />
        ) : null}

        {profiles.status !== "loading" && profiles.data.items.length > 0 ? (
          <ul className="divide-y divide-border border-y border-border">
            {profiles.data.items.map((profile) => (
              <li
                key={profile.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-sm font-medium">
                    {languageLabel(profile.targetLanguage)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {proficiencyLabels[profile.proficiencyLevel]} ·{" "}
                    {learningGoalLabels[profile.primaryGoal]}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Explanations in {languageLabel(profile.explanationLanguage)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedId === profile.id ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                      Current
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        selectingId !== null ||
                        request.pending ||
                        request.waiting ||
                        currentWaiting ||
                        listWaiting
                      }
                      aria-busy={selectingId === profile.id}
                      aria-label={`Use ${languageLabel(profile.targetLanguage)} profile`}
                      onClick={() => void activate(profile)}
                    >
                      {selectingId === profile.id ? "Selecting..." : "Use this"}
                    </Button>
                  )}
                  {!onboarding ? (
                    <DialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            options.status !== "ready" ||
                            profiles.status !== "ready" ||
                            loadingMore
                          }
                          aria-label={`Edit ${languageLabel(profile.targetLanguage)} profile`}
                        />
                      }
                      onClick={() => setDialog({ kind: "edit", profile })}
                    >
                      <Pencil aria-hidden="true" />
                      Edit
                    </DialogTrigger>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <LearningFeedback error={request.error} />
        {profiles.data.nextCursor && profiles.status === "ready" ? (
          <Button
            variant="outline"
            disabled={loadingMore || dialog !== null}
            aria-busy={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "Loading more..." : "Load more"}
          </Button>
        ) : null}

        {!onboarding &&
        profiles.status === "ready" &&
        !profiles.data.items.length ? (
          <p className="text-sm text-muted-foreground">
            No learning profiles yet. Add a language to get started.
          </p>
        ) : null}
        {inlineCreate && options.data ? (
          <CreateLearningProfile
            options={options.data}
            onboarding
            onCreated={created}
            onRecover={recoverCreation}
          />
        ) : (
          <DialogTrigger
            render={<Button disabled={!canCreate || listWaiting} />}
            onClick={() => setDialog({ kind: "create" })}
          >
            <Plus aria-hidden="true" />
            Add language
          </DialogTrigger>
        )}
      </div>

      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto p-5 sm:p-6">
        <div>
          <DialogTitle className="text-lg font-semibold">
            {dialog?.kind === "edit"
              ? "Edit learning profile"
              : "Add a language"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
            {dialog?.kind === "edit"
              ? "Update your preferences. The target language stays the same."
              : "Choose a language and how you want to learn it."}
          </DialogDescription>
        </div>
        {dialog?.kind === "create" && options.data ? (
          <CreateLearningProfile
            options={options.data}
            onboarding={onboarding}
            onCreated={created}
            onRecover={recoverCreation}
            onCancel={closeDialog}
          />
        ) : null}
        {dialog?.kind === "edit" && options.data ? (
          <EditLearningProfile
            profile={dialog.profile}
            options={options.data}
            isCurrent={selectedId === dialog.profile.id}
            onReplaced={replace}
            onSaved={(profile) => {
              replace(profile)
              setDialog(null)
              toast.success("Learning preferences saved")
            }}
            onRemoved={() => removed()}
            onMissing={() => removed(true)}
            onCancel={closeDialog}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
