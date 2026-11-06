import { LearnNavigation } from "@/features/learn/components/learn-navigation"
import { PracticeHandoffProvider } from "@/features/writing-system-practice/model/practice-handoff"
import { VocabularyLearningProvider } from "@/features/vocabulary-learning/model/vocabulary-learning-context"

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PracticeHandoffProvider>
      <VocabularyLearningProvider>
        <div className="min-w-0 space-y-4">
          <LearnNavigation />
          {children}
        </div>
      </VocabularyLearningProvider>
    </PracticeHandoffProvider>
  )
}
