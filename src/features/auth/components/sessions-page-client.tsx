"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  revokeAllSessions,
  revokeOtherSessions,
  revokeSelectedSessions,
} from "@/features/auth/api/session-api"
import { SessionRow } from "@/features/auth/components/session-row"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useSessions } from "@/features/auth/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmationAction = "others" | "all" | null

export function SessionsPageClient() {
  const { state: authState, signOut } = useAuth()
  const { state, reload, loadMore } = useSessions()
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())
  const [mutationPending, setMutationPending] = useState(false)
  const [confirmationAction, setConfirmationAction] =
    useState<ConfirmationAction>(null)

  const currentSessionId =
    authState.status === "authenticated" ? authState.sessionId : null
  const selectedIds = useMemo(
    () => [...selectedSessionIds],
    [selectedSessionIds]
  )
  const selectedIncludesCurrent = currentSessionId
    ? selectedSessionIds.has(currentSessionId)
    : false

  function setSelected(id: string, selected: boolean) {
    setSelectedSessionIds((current) => {
      const next = new Set(current)

      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }

      return next
    })
  }

  async function revokeSelected(ids: string[]) {
    if (ids.length === 0) {
      return
    }

    setMutationPending(true)

    try {
      await revokeSelectedSessions(ids)

      if (selectedIncludesCurrent || ids.includes(currentSessionId ?? "")) {
        await signOut()
        return
      }

      setSelectedSessionIds(new Set())
      await reload()
      toast.success("Sessions signed out")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Session sign out failed")
    } finally {
      setMutationPending(false)
    }
  }

  async function confirmBulkAction() {
    const action = confirmationAction
    setConfirmationAction(null)

    if (!action) {
      return
    }

    setMutationPending(true)

    try {
      if (action === "others") {
        await revokeOtherSessions()
        await reload()
        toast.success("Other sessions signed out")
      } else {
        await revokeAllSessions()
        await signOut()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Session sign out failed")
    } finally {
      setMutationPending(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-labelledby="sessions-list-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="sessions-list-heading" className="text-sm font-semibold">
              Signed-in devices
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Review where your Reality Loop account is currently signed in.
            </p>
          </div>
          {selectedIds.length > 0 ? (
            <Button
              variant={selectedIncludesCurrent ? "destructive" : "outline"}
              disabled={mutationPending}
              onClick={() => void revokeSelected(selectedIds)}
            >
              Sign out selected
            </Button>
          ) : null}
        </div>

        {state.status === "loading" ? (
          <div className="space-y-3 border-y border-border py-4" role="status">
            <div className="h-4 w-1/2 rounded-sm bg-muted" />
            <div className="h-4 w-2/3 rounded-sm bg-muted" />
            <div className="h-4 w-5/12 rounded-sm bg-muted" />
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-destructive">{state.error}</p>
            <Button className="mt-3" variant="outline" onClick={() => void reload()}>
              Try again
            </Button>
          </div>
        ) : null}

        {state.status === "loaded" && state.items.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
            No active sessions were returned by the backend.
          </div>
        ) : null}

        {state.items.length > 0 ? (
          <div className="border-b border-border">
            {state.items.map((session) => (
              <SessionRow
                key={session.id}
                session={{
                  ...session,
                  isCurrent: session.isCurrent || session.id === currentSessionId,
                }}
                selected={selectedSessionIds.has(session.id)}
                disabled={mutationPending}
                onSelectedChange={(selected) => setSelected(session.id, selected)}
                onSignOut={() => void revokeSelected([session.id])}
              />
            ))}
          </div>
        ) : null}

        {state.nextCursor ? (
          <Button
            variant="outline"
            disabled={state.loadingMore || mutationPending}
            onClick={() => void loadMore()}
          >
            {state.loadingMore ? "Loading..." : "Load more"}
          </Button>
        ) : null}
      </section>

      <section className="space-y-3" aria-labelledby="bulk-sessions-heading">
        <h2 id="bulk-sessions-heading" className="text-sm font-semibold">
          Session controls
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            disabled={mutationPending}
            onClick={() => setConfirmationAction("others")}
          >
            Sign out other sessions
          </Button>
          <Button
            variant="destructive"
            disabled={mutationPending}
            onClick={() => setConfirmationAction("all")}
          >
            Sign out of all sessions
          </Button>
        </div>
      </section>

      <Dialog
        open={confirmationAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmationAction(null)
          }
        }}
      >
        <DialogContent>
          <DialogTitle>
            {confirmationAction === "all"
              ? "Sign out of all sessions?"
              : "Sign out other sessions?"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {confirmationAction === "all"
              ? "This will revoke every active session, including this device. You will need to sign in again."
              : "You'll stay signed in on this device. All other active sessions will be revoked."}
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button
              variant={confirmationAction === "all" ? "destructive" : "default"}
              onClick={() => void confirmBulkAction()}
            >
              {confirmationAction === "all" ? "Sign out everywhere" : "Sign out others"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

