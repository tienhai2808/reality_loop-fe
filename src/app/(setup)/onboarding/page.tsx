import Image from "next/image"
import { LearningProfilesManager } from "@/features/learning-profile/components/learning-profiles-manager"
import { UserMenu } from "@/features/auth/components/user-menu"

export const metadata = { title: "Hồ sơ học" }

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-[4px]"
          />
          <span className="text-sm font-semibold">Reality</span>
        </div>
        <UserMenu />
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Hồ sơ học
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Chọn ngôn ngữ và mục tiêu để bắt đầu. Bạn có thể chỉnh lại sau.
          </p>
        </div>
        <LearningProfilesManager onboarding />
      </main>
    </div>
  )
}
