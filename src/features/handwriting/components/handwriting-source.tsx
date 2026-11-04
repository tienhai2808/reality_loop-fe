import type { HandwritingSource } from "../api/handwriting-schemas"

function link(url: string) {
  try {
    const parsed = new URL(url)
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !parsed.username &&
      !parsed.password
      ? url
      : undefined
  } catch {
    return undefined
  }
}
export function HandwritingSourceCredit({
  source,
}: {
  source: HandwritingSource
}) {
  const sourceUrl = link(source.url),
    licenseUrl = link(source.licenseUrl)
  return (
    <div className="space-y-1 break-words text-xs leading-5 text-muted-foreground">
      <p>
        Stroke data:{" "}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {source.attribution}
          </a>
        ) : (
          source.attribution
        )}
      </p>
      <p>
        License:{" "}
        {licenseUrl ? (
          <a
            href={licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {source.license}
          </a>
        ) : (
          source.license
        )}
      </p>
      <details>
        <summary className="cursor-pointer rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          Source revision
        </summary>
        <p className="pt-1">{source.revision}</p>
      </details>
    </div>
  )
}
