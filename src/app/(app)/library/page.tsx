import { PageHeader } from "@/components/shared/page-header"

export default function LibraryPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Library</PageHeader.Title>
        <PageHeader.Description>
          Saved phrases and patterns will collect here as missions reveal useful language.
        </PageHeader.Description>
      </PageHeader>
      <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted-foreground">
        No saved items yet.
      </div>
    </div>
  )
}
