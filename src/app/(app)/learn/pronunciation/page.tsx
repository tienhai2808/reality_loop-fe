import { PronunciationView } from "@/features/language-foundations/components/pronunciation/pronunciation-view"

export const metadata = { title: "Phát âm" }

export default function PronunciationPage() {
  return (
    <div className="min-w-0 max-w-5xl">
      <PronunciationView />
    </div>
  )
}
