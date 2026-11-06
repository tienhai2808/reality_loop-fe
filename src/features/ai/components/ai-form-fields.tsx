"use client"

import type { UseFormRegisterReturn } from "react-hook-form"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AiModelPage } from "../api/ai-schemas"
import type { AiRequestError } from "../api/ai-errors"
import { formatAiTime } from "./ai-connection-status"

export function AiRequestFeedback({ error }: { error: AiRequestError | null }) {
  if (!error) return null
  return (
    <div role="alert" className="space-y-1 text-sm leading-6 text-destructive">
      <p>{error.message}</p>
      {error.retryAt ? (
        <p>Thử lại sau {formatAiTime(error.retryAt)}.</p>
      ) : null}
    </div>
  )
}

export function AiCredentialFields({
  prefix,
  keyRegistration,
  modelValue,
  onModelChange,
  keyError,
  modelError,
  catalog,
  disabled,
  loading,
  waiting,
  onLoad,
}: {
  prefix: string
  keyRegistration: UseFormRegisterReturn<"apiKey">
  modelValue: string
  onModelChange: (value: string) => void
  keyError?: string
  modelError?: string
  catalog: AiModelPage | null
  disabled: boolean
  loading: boolean
  waiting: boolean
  onLoad: () => void
}) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor={`${prefix}-key`} className="text-sm font-medium">
          Khóa API
        </label>
        <Input
          id={`${prefix}-key`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          className="text-base sm:text-sm"
          {...keyRegistration}
          disabled={disabled}
          aria-invalid={Boolean(keyError)}
          aria-describedby={keyError ? `${prefix}-key-error` : undefined}
        />
        {keyError ? (
          <p id={`${prefix}-key-error`} className="text-sm text-destructive">
            {keyError}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          disabled={disabled || waiting}
          aria-busy={loading}
          onClick={onLoad}
          className="h-auto min-h-10 whitespace-normal py-2"
        >
          <KeyRound aria-hidden="true" />
          {loading ? "Đang tải mô hình…" : "Kiểm tra khóa và tải mô hình"}
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          Kiểm tra mô hình và kết nối có thể dùng hạn mức của nhà cung cấp.
        </p>
      </div>
      {catalog ? (
        <div className="space-y-2" aria-live="polite">
          {catalog.items.length ? (
            <>
              <label
                htmlFor={`${prefix}-model`}
                className="text-sm font-medium"
              >
                Mô hình
              </label>
              <Select
                value={modelValue || null}
                onValueChange={(val) => onModelChange(val ?? "")}
                disabled={disabled}
              >
                <SelectTrigger
                  id={`${prefix}-model`}
                  aria-invalid={Boolean(modelError)}
                  aria-describedby={
                    modelError ? `${prefix}-model-error` : undefined
                  }
                >
                  <SelectValue placeholder="Chọn mô hình" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.items.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name === model.id
                        ? model.id
                        : `${model.name} (${model.id})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Không có mô hình tương thích. Hãy kiểm tra khóa và quyền sử dụng mô hình.
            </p>
          )}
          {modelError ? (
            <p
              id={`${prefix}-model-error`}
              className="text-sm text-destructive"
            >
              {modelError}
            </p>
          ) : null}
          {catalog.isFallback ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Chưa xác nhận được mô hình từ danh mục. Mô hình sẽ được kiểm tra khi lưu.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
