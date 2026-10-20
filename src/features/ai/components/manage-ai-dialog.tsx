"use client"

import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Pencil, RefreshCw, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
  deleteAiConnection,
  loadAiModels,
  updateAiConnection,
  verifyAiConnection,
} from "../api/ai-api"
import { normalizeAiError } from "../api/ai-errors"
import {
  manageAiFormSchema,
  type AiConnectionDto,
  type AiModelPage,
  type ManageAiForm,
  type UpdateAiConnection,
} from "../api/ai-schemas"
import { useAiFormRequest } from "../hooks/use-ai-form-request"
import { AiConnectionStatus } from "./ai-connection-status"
import { AiCredentialFields, AiRequestFeedback } from "./ai-form-fields"

export function ManageAiDialog({
  connection,
  onUpdated,
  onDeleted,
  onStale,
  onClose,
}: {
  connection: AiConnectionDto
  onUpdated: (connection: AiConnectionDto, action: "save" | "verify") => void
  onDeleted: () => void
  onStale: (missing: boolean) => Promise<void>
  onClose: () => void
}) {
  const form = useForm<ManageAiForm>({
    resolver: zodResolver(manageAiFormSchema),
    defaultValues: {
      displayName: connection.displayName,
      isEnabled: connection.isEnabled,
      apiKey: "",
      modelId: "",
    },
  })
  const {
    register,
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    reset,
    trigger,
    handleSubmit,
    formState: { errors, isDirty },
  } = form
  const modelId = useWatch({ control, name: "modelId" })
  const [editingCredentials, setEditingCredentials] = useState(false)
  const [catalog, setCatalog] = useState<AiModelPage | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [action, setAction] = useState<"models" | "save" | "verify" | "delete">(
    "save"
  )
  const request = useAiFormRequest()

  useEffect(() => () => reset(), [reset])

  function credentialsChanged() {
    setCatalog(null)
    setValue("modelId", "")
    clearErrors(["apiKey", "modelId"])
  }

  async function handleError(
    value: unknown,
    mutation: boolean,
    signal: AbortSignal
  ) {
    const error = normalizeAiError(value)
    if (!signal.aborted) {
      if (mutation && (error.status === 409 || error.status === 404)) {
        reset()
        await onStale(error.status === 404)
      } else {
        for (const field of ["apiKey", "modelId", "displayName"] as const) {
          const message = error.fieldErrors?.[field]
          if (message) setError(field, { message })
        }
      }
    }
    throw error
  }

  async function loadModels() {
    if (!getValues("apiKey")) {
      setError("apiKey", {
        message: "Enter your provider API key to load models.",
      })
      return
    }
    if (!(await trigger("apiKey"))) return
    await request.run(async (signal) => {
      setAction("models")
      setCatalog(null)
      setValue("modelId", "")
      clearErrors("modelId")
      try {
        const result = await loadAiModels(
          connection.provider,
          getValues("apiKey"),
          signal
        )
        if (!signal.aborted) setCatalog(result)
      } catch (value) {
        await handleError(value, false, signal)
      }
    })
  }

  async function save(values: ManageAiForm) {
    if (editingCredentials && !values.apiKey) {
      setError("apiKey", {
        message: "Enter a replacement API key, or cancel the key change.",
      })
      return
    }
    if (
      catalog &&
      !catalog.items.some((model) => model.id === values.modelId)
    ) {
      setError("modelId", {
        message: "Choose a model from the loaded catalog.",
      })
      return
    }
    const patch: UpdateAiConnection = { version: connection.version }
    if (values.displayName !== connection.displayName)
      patch.displayName = values.displayName
    if (values.isEnabled !== connection.isEnabled)
      patch.isEnabled = values.isEnabled
    if (editingCredentials) {
      patch.apiKey = values.apiKey
      if (catalog && values.modelId !== connection.modelId)
        patch.modelId = values.modelId
    }
    if (Object.keys(patch).length === 1) {
      onClose()
      return
    }
    await request.run(async (signal) => {
      setAction("save")
      try {
        const updated = await updateAiConnection(connection.id, patch, signal)
        reset()
        if (!signal.aborted) onUpdated(updated, "save")
      } catch (value) {
        await handleError(value, true, signal)
      }
    })
  }

  async function verify() {
    await request.run(async (signal) => {
      setAction("verify")
      try {
        const updated = await verifyAiConnection(
          connection.id,
          connection.version,
          signal
        )
        if (!signal.aborted) onUpdated(updated, "verify")
      } catch (value) {
        await handleError(value, true, signal)
      }
    })
  }

  async function remove() {
    await request.run(async (signal) => {
      setAction("delete")
      try {
        await deleteAiConnection(connection.id, connection.version, signal)
        reset()
        if (!signal.aborted) onDeleted()
      } catch (value) {
        await handleError(value, true, signal)
      }
    })
  }

  if (confirmDelete)
    return (
      <>
        <DialogTitle className="text-lg font-semibold">
          Delete AI connection?
        </DialogTitle>
        <DialogDescription className="text-sm leading-6 text-muted-foreground">
          This removes {connection.displayName} from Reality Loop. It does not
          revoke the API key at {connection.provider}.
        </DialogDescription>
        <AiRequestFeedback error={request.error} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            disabled={request.pending}
            onClick={() => setConfirmDelete(false)}
          >
            Keep connection
          </Button>
          <Button
            variant="destructive"
            disabled={request.pending || request.waiting}
            aria-busy={request.pending}
            onClick={() => void remove()}
          >
            <Trash2 aria-hidden="true" />
            {request.pending ? "Deleting..." : "Delete connection"}
          </Button>
        </div>
      </>
    )

  return (
    <>
      <div>
        <DialogTitle className="text-lg font-semibold">
          Manage connection
        </DialogTitle>
        <DialogDescription className="mt-1 break-words text-sm leading-6 text-muted-foreground">
          {connection.provider} / {connection.modelId}
        </DialogDescription>
      </div>
      <AiConnectionStatus connection={connection} />
      <form className="space-y-5" onSubmit={handleSubmit(save)}>
        <div className="space-y-2">
          <label htmlFor="manage-name" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="manage-name"
            className="text-base sm:text-sm"
            maxLength={150}
            {...register("displayName")}
            disabled={request.pending}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={
              errors.displayName ? "manage-name-error" : undefined
            }
          />
          {errors.displayName ? (
            <p id="manage-name-error" className="text-sm text-destructive">
              {errors.displayName.message}
            </p>
          ) : null}
        </div>
        <Controller
          name="isEnabled"
          control={control}
          render={({ field }) => (
            <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium">
              <Checkbox
                id="manage-enabled"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={request.pending}
              />
              Enabled
            </label>
          )}
        />
        <section
          className="space-y-3 border-t border-border pt-4"
          aria-label="Key and model"
        >
          <p className="break-all text-sm text-muted-foreground">
            Saved API key: **** {connection.apiKeyLast4}
          </p>
          {!editingCredentials ? (
            <Button
              type="button"
              variant="outline"
              disabled={request.pending}
              onClick={() => setEditingCredentials(true)}
              className="h-auto min-h-10 whitespace-normal py-2"
            >
              <Pencil aria-hidden="true" />
              Replace key or change model
            </Button>
          ) : (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                The key you enter will replace the saved key when you save. Load
                models to also choose a different model, or keep the current
                model.
              </p>
              <AiCredentialFields
                prefix="manage"
                keyRegistration={register("apiKey", {
                  onChange: credentialsChanged,
                })}
                modelValue={modelId ?? ""}
                onModelChange={(val) => {
                  setValue("modelId", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }}
                keyError={errors.apiKey?.message}
                modelError={errors.modelId?.message}
                catalog={catalog}
                disabled={request.pending}
                loading={request.pending && action === "models"}
                waiting={request.waiting}
                onLoad={() => void loadModels()}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={request.pending}
                onClick={() => {
                  setValue("apiKey", "")
                  setValue("modelId", "")
                  setCatalog(null)
                  clearErrors(["apiKey", "modelId"])
                  setEditingCredentials(false)
                }}
              >
                Cancel key change
              </Button>
            </>
          )}
        </section>
        <AiRequestFeedback error={request.error} />
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              request.pending ||
              request.waiting ||
              Boolean(catalog && !catalog.items.length)
            }
            aria-busy={request.pending && action === "save"}
          >
            <Save aria-hidden="true" />
            {request.pending && action === "save"
              ? "Saving..."
              : "Save changes"}
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Button
          variant="outline"
          disabled={
            request.pending || request.waiting || isDirty || editingCredentials
          }
          aria-busy={request.pending && action === "verify"}
          onClick={() => void verify()}
        >
          {request.pending && action === "verify" ? (
            <RefreshCw aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {request.pending && action === "verify"
            ? "Verifying..."
            : "Verify connection"}
        </Button>
        <Button
          variant="destructive"
          disabled={request.pending || request.waiting}
          onClick={() => {
            reset()
            setCatalog(null)
            setEditingCredentials(false)
            setConfirmDelete(true)
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </div>
      {isDirty || editingCredentials ? (
        <p className="text-xs text-muted-foreground">
          Save or cancel your changes before verifying.
        </p>
      ) : null}
    </>
  )
}
