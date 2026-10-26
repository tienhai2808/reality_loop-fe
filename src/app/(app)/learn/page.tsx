import { PageHeader } from "@/components/shared/page-header"
import { LanguageCatalog } from "@/features/language-foundations/components/language-catalog"

export const metadata = { title: "Language Foundations" }

export default function LearnPage() {
  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader>
        <PageHeader.Title>Language Foundations</PageHeader.Title>
        <PageHeader.Description>
          Explore the characters and sounds behind a language.
        </PageHeader.Description>
      </PageHeader>
      <LanguageCatalog />
    </div>
  )
}
