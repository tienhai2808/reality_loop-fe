"use client"

import Link from "next/link"
import Image from "next/image"
import { LogOut, MonitorSmartphone, Settings } from "lucide-react"
import { useState } from "react"

import {
  getDisplayName,
  getUserInitials,
} from "@/features/auth/api/auth-api"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"

export function UserMenu() {
  const { state, signOut } = useAuth()
  const [avatarFailed, setAvatarFailed] = useState(false)

  if (state.status !== "authenticated") {
    return (
      <div
        className="grid size-8 place-items-center rounded-full border border-border bg-surface text-xs font-medium"
        aria-hidden="true"
      >
        RL
      </div>
    )
  }

  const name = getDisplayName(state.user)
  const initials = getUserInitials(state.user)
  const avatarUrl = avatarFailed ? null : state.user.avatarUrl

  return (
    <Menu>
      <MenuTrigger className="grid size-9 place-items-center rounded-full border border-border bg-surface text-xs font-medium outline-none transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="sr-only">Open user menu</span>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={36}
            height={36}
            referrerPolicy="no-referrer"
            className="size-full rounded-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </MenuTrigger>
      <MenuContent>
        <div className="px-2 py-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {state.user.email ? (
            <p className="truncate text-xs text-muted-foreground">{state.user.email}</p>
          ) : null}
        </div>
        <MenuSeparator className="my-1 h-px bg-border" />
        <MenuLinkItem render={<Link href="/settings" />}>
          <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
          Settings
        </MenuLinkItem>
        <MenuLinkItem render={<Link href="/settings/sessions" />}>
          <MonitorSmartphone
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          Active sessions
        </MenuLinkItem>
        <MenuSeparator className="my-1 h-px bg-border" />
        <MenuItem onClick={() => void signOut()}>
          <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

