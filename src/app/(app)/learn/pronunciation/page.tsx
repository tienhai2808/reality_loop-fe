import { PronunciationView } from "@/features/language-foundations/components/pronunciation/pronunciation-view"

export const metadata = { title: "Pronunciation" }

export default function PronunciationPage() {
  return (
    <div className="min-w-0 max-w-5xl">
      <PronunciationView />
    </div>
  )
}
