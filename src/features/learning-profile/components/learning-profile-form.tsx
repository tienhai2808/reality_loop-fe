"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { normalizeLearningProfileError } from "../api/learning-profile-errors"
import {
  learningProfileFormSchema,
  type LearningProfile,
  type LearningProfileFormValues,
  type LearningProfileOptions,
} from "../api/learning-profile-schemas"
import {
  learningGoalLabels,
  languageLabel,
  proficiencyLabels,
} from "../lib/language-options"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLearningRequest } from "../hooks/use-learning-request"
import { LanguageField } from "./language-field"
import { TargetLanguageField } from "@/features/language-foundations/components/target-language-field"
import { LearningFeedback } from "./learning-feedback"

type Props = {
  options: LearningProfileOptions
  profile?: LearningProfile
  submitLabel: string
  onSubmit: (
    values: LearningProfileFormValues,
    signal: AbortSignal
  ) => Promise<void>
  onCancel?: () => void
  footer?: React.ReactNode
}

export function LearningProfileForm({
  options,
  profile,
  submitLabel,
  onSubmit,
  onCancel,
  footer,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LearningProfileFormValues>({
    resolver: zodResolver(learningProfileFormSchema),
    defaultValues: {
      targetLanguage: profile?.targetLanguage ?? "",
      nativeLanguage: profile?.nativeLanguage ?? "",
      explanationLanguage: profile?.explanationLanguage ?? "",
      proficiencyLevel:
        profile?.proficiencyLevel ?? options.proficiencyLevels[0],
      primaryGoal: profile?.primaryGoal ?? options.learningGoals[0],
      goalNote: profile?.goalNote ?? "",
    },
  })
  const request = useLearningRequest()
  const goal = useWatch({ control, name: "primaryGoal" })
  const explanationLanguage = useWatch({ control, name: "explanationLanguage" })
  async function submit(values: LearningProfileFormValues) {
    if (
      !options.proficiencyLevels.includes(values.proficiencyLevel) ||
      !options.learningGoals.includes(values.primaryGoal)
    )
      return
    await request.run(async (signal) => {
      try {
        await onSubmit(values, signal)
      } catch (value) {
        const error = normalizeLearningProfileError(value)
        if (!signal.aborted)
          for (const field of [
            "targetLanguage",
            "nativeLanguage",
            "explanationLanguage",
            "proficiencyLevel",
            "primaryGoal",
            "goalNote",
          ] as const) {
            const message = error.fieldErrors?.[field]
            if (message) setError(field, { message })
          }
        throw error
      }
    })
  }
  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)}>
      {profile ? (
        <p className="text-sm font-medium">
          {languageLabel(profile.targetLanguage)}
        </p>
      ) : (
        <Controller
          name="targetLanguage"
          control={control}
          render={({ field }) => (
            <TargetLanguageField
              locale={explanationLanguage || "en"}
              id="learning-target"
              label="Language to learn"
              {...field}
              inputRef={field.ref}
              disabled={request.pending}
              error={errors.targetLanguage?.message}
            />
          )}
        />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          name="nativeLanguage"
          control={control}
          render={({ field }) => (
            <LanguageField
              id="learning-native"
              label="Your native language"
              {...field}
              inputRef={field.ref}
              disabled={request.pending}
              error={errors.nativeLanguage?.message}
            />
          )}
        />
        <Controller
          name="explanationLanguage"
          control={control}
          render={({ field }) => (
            <LanguageField
              id="learning-explanation"
              label="Language for explanations"
              {...field}
              inputRef={field.ref}
              disabled={request.pending}
              error={errors.explanationLanguage?.message}
            />
          )}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="learning-level" className="text-sm font-medium">
          How comfortable are you right now?
        </label>
        <Controller
          name="proficiencyLevel"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || null}
              onValueChange={field.onChange}
              disabled={request.pending}
            >
              <SelectTrigger
                id="learning-level"
                aria-invalid={Boolean(errors.proficiencyLevel)}
                aria-describedby={
                  errors.proficiencyLevel ? "learning-level-error" : undefined
                }
              >
                <SelectValue placeholder="Select proficiency level" />
              </SelectTrigger>
              <SelectContent>
                {options.proficiencyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {proficiencyLabels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.proficiencyLevel ? (
          <p id="learning-level-error" className="text-sm text-destructive">
            {errors.proficiencyLevel.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="learning-goal" className="text-sm font-medium">
          What do you mainly want to use it for?
        </label>
        <Controller
          name="primaryGoal"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || null}
              onValueChange={field.onChange}
              disabled={request.pending}
            >
              <SelectTrigger
                id="learning-goal"
                aria-invalid={Boolean(errors.primaryGoal)}
                aria-describedby={
                  errors.primaryGoal ? "learning-goal-error" : undefined
                }
              >
                <SelectValue placeholder="Select primary goal" />
              </SelectTrigger>
              <SelectContent>
                {options.learningGoals.map((value) => (
                  <SelectItem key={value} value={value}>
                    {learningGoalLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.primaryGoal ? (
          <p id="learning-goal-error" className="text-sm text-destructive">
            {errors.primaryGoal.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="learning-note" className="text-sm font-medium">
          {goal === "Other" ? "Tell us about your goal" : "Anything specific?"}{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="learning-note"
          {...register("goalNote")}
          rows={3}
          maxLength={500}
          disabled={request.pending}
          aria-invalid={Boolean(errors.goalNote)}
          aria-describedby={errors.goalNote ? "learning-note-error" : undefined}
        />
        {errors.goalNote ? (
          <p id="learning-note-error" className="text-sm text-destructive">
            {errors.goalNote.message}
          </p>
        ) : null}
      </div>
      <LearningFeedback error={request.error} />
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            disabled={request.pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={
            request.pending ||
            request.waiting ||
            !options.learningGoals.length ||
            !options.proficiencyLevels.length
          }
          aria-busy={request.pending}
        >
          <Save aria-hidden="true" />
          {request.pending ? "Saving..." : submitLabel}
        </Button>
      </div>
      {footer ? (
        <fieldset
          disabled={request.pending}
          className="border-t border-border pt-4"
        >
          {footer}
        </fieldset>
      ) : null}
    </form>
  )
}
