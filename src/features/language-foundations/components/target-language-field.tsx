"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { listLanguages } from "../api/language-foundations-api"
import { useCatalogPage } from "../hooks/use-catalog"
import { LanguageField } from "@/features/learning-profile/components/language-field"
import { CatalogFeedback } from "./catalog-feedback"

export function TargetLanguageField({
  locale,
  ...props
}: Omit<React.ComponentProps<typeof LanguageField>, "options"> & {
  locale: string
}) {
  const loader = useCallback(
    (after: string | null, signal: AbortSignal) =>
      listLanguages(locale, after, signal),
    [locale]
  )
  const catalog = useCatalogPage(`target-languages:${locale}`, loader)
  const options =
    catalog.data?.items.map((language) => ({
      value: language.code,
      label: language.name,
    })) ?? []
  return (
    <div className="space-y-2">
      <LanguageField {...props} options={options} />
      {catalog.status === "loading" ? (
        <p role="status" className="text-xs text-muted-foreground">
          Loading available languages...
        </p>
      ) : null}
      <CatalogFeedback
        error={catalog.error}
        onRetry={() =>
          void (catalog.data ? catalog.loadMore() : catalog.reload())
        }
      />
      {catalog.status === "ready" && !options.length ? (
        <p className="text-xs leading-5 text-muted-foreground">
          No languages have published foundations yet. You can still set up a
          profile using a language tag.
        </p>
      ) : null}
      {catalog.data?.nextCursor && !catalog.error ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={catalog.loadingMore}
          onClick={() => void catalog.loadMore()}
        >
          {catalog.loadingMore ? "Loading languages..." : "More languages"}
        </Button>
      ) : null}
    </div>
  )
}
