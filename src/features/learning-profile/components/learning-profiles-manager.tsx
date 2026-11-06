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
          toast.success(`Đang học ${languageLabel(profile.targetLanguage)}`)
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
    toast.success("Đã tạo hồ sơ học")
  }

  async function removed(missing = false) {
    setDialog(null)
    await Promise.allSettled([reload(), refreshCurrent()])
    toast(
      missing
        ? "Hồ sơ học này hiện không có."
        : "Đã xóa hồ sơ học"
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
        Đang mở Reality Loop…
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
            Đang kiểm tra hồ sơ hiện tại…
          </p>
        ) : null}
        {current.status === "error" ? (
          <LearningFeedback
            error={current.error}
            onRetry={() => void refreshCurrent().catch(() => undefined)}
            retryLabel="Tải lại hồ sơ hiện tại"
          />
        ) : null}
        {!onboarding && current.status === "ready" && !current.current ? (
          <p role="status" className="text-sm leading-6 text-muted-foreground">
            Chọn một hồ sơ hoặc thêm ngôn ngữ để bắt đầu.
          </p>
        ) : null}
        {options.status === "loading" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Đang tải tùy chọn học…
          </p>
        ) : null}
        {options.status === "error" ? (
          <LearningFeedback
            error={options.error}
            onRetry={() => void reloadOptions()}
            retryLabel="Tải lại tùy chọn"
          />
        ) : null}
        {options.status === "ready" &&
        options.data &&
        (!options.data.learningGoals.length ||
          !options.data.proficiencyLevels.length) ? (
          <p className="text-sm text-muted-foreground">
            Chưa tải được tùy chọn học. Hãy thử lại sau.
          </p>
        ) : null}
        {profiles.status === "loading" ? (
          <div
            role="status"
            className="space-y-3 border-y border-border py-5 animate-pulse"
          >
            <span className="sr-only">Đang tải hồ sơ học…</span>
            <div className="h-4 w-1/3 rounded-sm bg-muted" />
            <div className="h-3 w-1/2 rounded-sm bg-muted" />
          </div>
        ) : null}
        {profiles.status === "error" ? (
          <LearningFeedback
            error={profiles.error}
            onRetry={() => void reload()}
            retryLabel="Tải lại hồ sơ"
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
                    Giải thích bằng {languageLabel(profile.explanationLanguage)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedId === profile.id ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                      Đang dùng
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
                      aria-label={`Dùng ${languageLabel(profile.targetLanguage)} profile`}
                      onClick={() => void activate(profile)}
                    >
                      {selectingId === profile.id ? "Đang chọn…" : "Dùng hồ sơ này"}
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
                          aria-label={`Sửa ${languageLabel(profile.targetLanguage)} profile`}
                        />
                      }
                      onClick={() => setDialog({ kind: "edit", profile })}
                    >
                      <Pencil aria-hidden="true" />
                      Sửa
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
            {loadingMore ? "Đang tải thêm…" : "Xem thêm"}
          </Button>
        ) : null}

        {!onboarding &&
        profiles.status === "ready" &&
        !profiles.data.items.length ? (
          <p className="text-sm text-muted-foreground">
            Thêm một ngôn ngữ để tạo hồ sơ học đầu tiên.
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
            Thêm ngôn ngữ
          </DialogTrigger>
        )}
      </div>

      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto p-5 sm:p-6">
        <div>
          <DialogTitle className="text-lg font-semibold">
            {dialog?.kind === "edit"
              ? "Sửa hồ sơ học"
              : "Thêm ngôn ngữ"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
            {dialog?.kind === "edit"
              ? "Chỉnh tùy chọn cho hồ sơ này."
              : "Chọn ngôn ngữ và cách bạn muốn học."}
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
              toast.success("Đã lưu tùy chọn học")
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
