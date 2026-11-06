"use client"

import { useCallback, type ReactNode } from "react"
import { getLanguage } from "../api/language-foundations-api"
import { useCatalogResource } from "../hooks/use-catalog"
import {
  CatalogFeedback,
  CatalogLoading,
  ContentUnavailable,
} from "./catalog-feedback"

export function FoundationsLanguageShell({
  languageCode,
  locale,
  browsingCatalog,
  children,
}: {
  languageCode: string
  locale: string
  browsingCatalog: boolean
  children: ReactNode
}) {
  const loader = useCallback(
    (signal: AbortSignal) => getLanguage(languageCode, locale, signal),
    [languageCode, locale]
  )
  const language = useCatalogResource(
    `language:${languageCode}:${locale}`,
    loader
  )
  if (language.error?.status === 404) {
    return (
      <ContentUnavailable title="Ngôn ngữ này chưa có nội dung học">
        Chọn một ngôn ngữ khác để tiếp tục.
      </ContentUnavailable>
    )
  }
  return (
    <div className="min-w-0 space-y-3">
      {browsingCatalog && language.data ? (
        <p className="text-sm text-muted-foreground">
          Đang xem{" "}
          <span lang={language.data.translationLocale ?? languageCode}>
            {language.data.name}
          </span>
        </p>
      ) : null}
      {browsingCatalog && language.status === "loading" ? (
        <CatalogLoading label="Đang tải ngôn ngữ…" />
      ) : null}
      <CatalogFeedback
        error={language.error}
        onRetry={() => void language.reload()}
      />
      {children}
    </div>
  )
}
