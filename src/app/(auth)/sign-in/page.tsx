import type { Metadata } from "next"
import Image from "next/image"

import { getSafeInternalPath } from "@/features/auth/api/auth-api"
import { OAuthSignInButton } from "@/features/auth/components/oauth-sign-in-button"

export const metadata: Metadata = {
  title: "Đăng nhập",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const nextPath = getSafeInternalPath(next)

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12 text-foreground">
      <section className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-5">
          <div className="mx-auto flex items-center justify-center gap-1">
            <Image
              src="/logo.svg"
              alt="Reality Loop"
              width={24}
              height={24}
              className="size-6 shrink-0 rounded-[4px]"
              priority
            />
            <span className="text-sm font-semibold">Reality</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-[2rem] font-semibold leading-9 text-balance">
              Luyện ngôn ngữ cho đời sống
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Học chữ, nghe cách đọc và ôn từ theo nhịp của bạn.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <OAuthSignInButton provider="google" nextPath={nextPath} />
          <OAuthSignInButton provider="microsoft" nextPath={nextPath} />
          <OAuthSignInButton provider="facebook" nextPath={nextPath} />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Khi tiếp tục, bạn đồng ý dùng Reality Loop để luyện ngôn ngữ cá nhân.
        </p>
      </section>
    </main>
  )
}

