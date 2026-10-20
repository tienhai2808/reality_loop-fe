"use client"

import { useEffect, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plug } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAiConnection, loadAiModels } from "../api/ai-api"
import { isUncertainCreation, normalizeAiError } from "../api/ai-errors"
import {
  connectAiFormSchema,
  type AiModelPage,
  type AiProviderDto,
  type ConnectAiForm,
  type CreateAiConnection,
} from "../api/ai-schemas"
import { useAiFormRequest } from "../hooks/use-ai-form-request"
import { AiCredentialFields, AiRequestFeedback } from "./ai-form-fields"

type CreateOperation = { id: string; payload: Readonly<CreateAiConnection> }

export function ConnectAiDialog({
  providers,
  onCreated,
  onClose,
}: {
  providers: AiProviderDto[]
  onCreated: () => void
  onClose: () => void
}) {
  const form = useForm<ConnectAiForm>({
    resolver: zodResolver(connectAiFormSchema),
    defaultValues: {
      provider: providers[0]?.id,
      apiKey: "",
      modelId: "",
      displayName: "",
    },
  })
  const {
    register,
    control,
    getValues,
    setValue,
    reset,
    clearErrors,
    setError,
    trigger,
    handleSubmit,
    formState: { errors },
  } = form
  const modelId = useWatch({ control, name: "modelId" })
  const [catalog, setCatalog] = useState<AiModelPage | null>(null)
  const [action, setAction] = useState<"models" | "create">("models")
  const [recoverable, setRecoverable] = useState(false)
  const operation = useRef<CreateOperation | null>(null)
  const request = useAiFormRequest()

  useEffect(
    () => () => {
      operation.current = null
      reset()
    },
    [reset]
  )

  function changed() {
    operation.current = null
    setRecoverable(false)
  }

  function credentialsChanged() {
    changed()
    setCatalog(null)
    setValue("modelId", "")
    clearErrors(["modelId", "apiKey", "provider"])
  }

  function fieldErrors(value: unknown) {
    const error = normalizeAiError(value)
    for (const field of [
      "apiKey",
      "modelId",
      "displayName",
      "provider",
    ] as const) {
      const message = error.fieldErrors?.[field]
      if (message) setError(field, { message })
    }
    return error
  }

  async function loadModels() {
    if (!(await trigger(["provider", "apiKey"]))) return
    await request.run(async (signal) => {
      setAction("models")
      setCatalog(null)
      setValue("modelId", "")
      clearErrors("modelId")
      try {
        const result = await loadAiModels(
          getValues("provider"),
          getValues("apiKey"),
          signal
        )
        if (!signal.aborted) setCatalog(result)
      } catch (value) {
        if (signal.aborted) return
        throw fieldErrors(value)
      }
    })
  }

  async function connect(values: ConnectAiForm) {
    if (!catalog?.items.some((model) => model.id === values.modelId)) {
      setError("modelId", {
        message: "Load models with this key and choose one.",
      })
      return
    }
    await request.run(async (signal) => {
      setAction("create")
      // Retain the exact payload and UUID across unknown outcomes; never persist either.
      const current = operation.current ?? {
        id: crypto.randomUUID(),
        payload: Object.freeze({
          provider: values.provider,
          apiKey: values.apiKey,
          modelId: values.modelId,
          ...(values.displayName ? { displayName: values.displayName } : {}),
        }),
      }
      operation.current = current
      try {
        await createAiConnection(current.payload, current.id, signal)
        operation.current = null
        reset()
        if (!signal.aborted) onCreated()
      } catch (value) {
        if (signal.aborted) return
        const error = fieldErrors(value)
        if (!isUncertainCreation(error)) operation.current = null
        if (!signal.aborted) setRecoverable(isUncertainCreation(error))
        throw error
      }
    })
  }

  return (
    <>
      <div>
        <DialogTitle className="text-lg font-semibold">Connect AI</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
          Choose a provider and one model for this connection.
        </DialogDescription>
      </div>
      <form
        className="space-y-5"
        onSubmit={(event) => void handleSubmit(connect)(event)}
        onChange={(event) => {
          const target = event.target
          if (target instanceof HTMLInputElement) {
            if (target.name === "apiKey") credentialsChanged()
            else changed()
          }
        }}
      >
        <div className="space-y-2">
          <label htmlFor="connect-provider" className="text-sm font-medium">
            Provider
          </label>
          <Controller
            name="provider"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || null}
                onValueChange={(val) => {
                  if (val) {
                    field.onChange(val)
                    credentialsChanged()
                  }
                }}
                disabled={request.pending}
              >
                <SelectTrigger
                  id="connect-provider"
                  aria-invalid={Boolean(errors.provider)}
                  aria-describedby={
                    errors.provider ? "connect-provider-error" : undefined
                  }
                >
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.provider ? (
            <p id="connect-provider-error" className="text-sm text-destructive">
              {errors.provider.message}
            </p>
          ) : null}
        </div>
        <AiCredentialFields
          prefix="connect"
          keyRegistration={register("apiKey")}
          modelValue={modelId ?? ""}
          onModelChange={(val) => {
            setValue("modelId", val, {
              shouldValidate: true,
              shouldDirty: true,
            })
            changed()
          }}
          keyError={errors.apiKey?.message}
          modelError={errors.modelId?.message}
          catalog={catalog}
          disabled={request.pending}
          loading={request.pending && action === "models"}
          waiting={request.waiting}
          onLoad={() => void loadModels()}
        />
        {catalog?.items.length ? (
          <div className="space-y-2">
            <label htmlFor="connect-name" className="text-sm font-medium">
              Display name{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="connect-name"
              className="text-base sm:text-sm"
              maxLength={150}
              {...register("displayName")}
              disabled={request.pending}
              aria-invalid={Boolean(errors.displayName)}
              aria-describedby={
                errors.displayName ? "connect-name-error" : undefined
              }
            />
            {errors.displayName ? (
              <p id="connect-name-error" className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            ) : null}
          </div>
        ) : null}
        <AiRequestFeedback error={request.error} />
        {recoverable ? (
          <p className="text-sm leading-6 text-muted-foreground">
            The save hasn&apos;t been confirmed. Retry to check the same
            connection. Editing the details starts a new connection request.
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              request.pending || request.waiting || !catalog?.items.length
            }
            aria-busy={request.pending && action === "create"}
          >
            <Plug aria-hidden="true" />
            {request.pending && action === "create"
              ? "Connecting..."
              : recoverable
                ? "Retry connection"
                : "Connect"}
          </Button>
        </div>
      </form>
    </>
  )
}
