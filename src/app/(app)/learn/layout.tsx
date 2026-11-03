import { PracticeHandoffProvider } from "@/features/writing-system-practice/model/practice-handoff"

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PracticeHandoffProvider>{children}</PracticeHandoffProvider>
}
