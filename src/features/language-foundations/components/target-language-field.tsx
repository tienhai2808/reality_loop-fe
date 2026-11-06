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
          Đang tải ngôn ngữ…
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
          Chưa có nội dung học được xuất bản. Bạn có thể tạo hồ sơ bằng mã ngôn
          ngữ.
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
          {catalog.loadingMore ? "Đang tải ngôn ngữ…" : "Xem thêm ngôn ngữ"}
        </Button>
      ) : null}
    </div>
  )
}
