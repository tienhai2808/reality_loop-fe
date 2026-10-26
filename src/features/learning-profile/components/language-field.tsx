"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { languageOptions } from "../lib/language-options"

export function LanguageField({
  id,
  label,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  options = languageOptions,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef?: unknown
  disabled: boolean
  error?: string
  options?: readonly { value: string; label: string }[]
}) {
  const [custom, setCustom] = useState(() =>
    Boolean(value && !options.some((option) => option.value === value))
  )
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={custom ? "custom" : value || null}
        onValueChange={(next) => {
          const selectedValue = next ?? ""
          setCustom(selectedValue === "custom")
          onChange(selectedValue === "custom" ? "" : selectedValue)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onBlur={onBlur}
        >
          <SelectValue placeholder="Choose a language" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Another language or region...</SelectItem>
        </SelectContent>
      </Select>
      {custom ? (
        <>
          <label htmlFor={`${id}-tag`} className="text-sm">
            Language tag
          </label>
          <Input
            id={`${id}-tag`}
            value={value}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(event) => onChange(event.currentTarget.value)}
            maxLength={35}
            placeholder="e.g. en-gb"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          />
          <p
            id={`${id}-hint`}
            className="text-xs leading-5 text-muted-foreground"
          >
            Use a language tag with hyphens, such as en-gb or zh-hant.
          </p>
        </>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
