import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { JapaneseText } from "@/components/reality/japanese-text"
import { Button } from "@/components/ui/button"

export default async function MissionFocusPage({
  params,
}: {
  params: Promise<{ missionId: string }>
}) {
  const { missionId } = await params
  const title = missionId.replaceAll("-", " ").toUpperCase()

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-5 text-foreground">
      <div className="flex min-h-[calc(100dvh-2.5rem)] w-full max-w-5xl flex-col">
        <header className="grid grid-cols-3 items-center text-sm">
          <Button render={<Link href="/" />} variant="ghost" nativeButton={false}>
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Thoát
          </Button>
          <div className="text-center font-medium tracking-normal">{title}</div>
          <div className="justify-self-end text-xs font-medium text-success">LIVE</div>
        </header>
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="space-y-6">
            <JapaneseText className="block text-3xl font-semibold">ラーメン屋</JapaneseText>
            <JapaneseText className="block text-[1.65rem] leading-[1.65]">
              ご注文はお決まりですか？
            </JapaneseText>
            <p className="text-sm text-muted-foreground">Bạn có thể bắt đầu.</p>
          </div>
          <div className="space-y-3">
            <div className="mx-auto size-16 rounded-full border border-primary bg-surface" />
            <p className="text-sm font-medium">Đang nghe</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline">Mình chưa hiểu</Button>
            <Button variant="ghost">Cho mình gợi ý</Button>
          </div>
        </section>
      </div>
    </main>
  )
}
