import { cn } from "@/lib/utils"
import { languageLabel } from "@/features/learning-profile/lib/language-options"
import type { GrammarPointSummary } from "../api/grammar-schemas"

export function GrammarHeading({ point }: { point: GrammarPointSummary }) {
  const contentLanguage = point.translationLocale ?? point.languageCode
  return (
    <header className="min-w-0 space-y-2">
      <h2
        lang={contentLanguage}
        className={cn(
          "break-words text-2xl font-semibold leading-relaxed tracking-tight",
          contentLanguage === "ja" && "font-ja"
        )}
      >
        {point.name}
      </h2>
      {point.nativeName !== point.name ? (
        <p
          lang={point.languageCode}
          className={cn(
            "break-words text-base leading-relaxed text-muted-foreground",
            point.languageCode === "ja" && "font-ja"
          )}
        >
          {point.nativeName}
        </p>
      ) : null}
      <GrammarTranslation point={point} />
    </header>
  )
}

export function GrammarTranslation({ point }: { point: GrammarPointSummary }) {
  if (!point.isTranslationFallback) return null
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {point.translationLocale === null
        ? "Hiển thị bằng ngôn ngữ gốc"
        : `Bản dịch: ${languageLabel(point.translationLocale)}`}
    </p>
  )
}

export function grammarHref(languageCode?: string, pointCode?: string) {
  const query = new URLSearchParams()
  if (languageCode) query.set("language", languageCode)
  if (pointCode) query.set("point", pointCode)
  return `/learn/grammar${query.size ? `?${query}` : ""}`
}
