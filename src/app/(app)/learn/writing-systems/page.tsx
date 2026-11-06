import { WritingSystemViewer } from "@/features/language-foundations/components/writing-system-viewer"

export const metadata = { title: "Bảng chữ" }

export default function WritingSystemsPage() {
  return (
    <div className="min-w-0 max-w-5xl">
      <WritingSystemViewer />
    </div>
  )
}
