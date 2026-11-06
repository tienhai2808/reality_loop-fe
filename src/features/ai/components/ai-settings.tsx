"use client"

import { useState } from "react"
import { Plug, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import type { AiConnectionDto } from "../api/ai-schemas"
import { useAiSettings } from "../hooks/use-ai-settings"
import { useAiRetryWait } from "../hooks/use-ai-form-request"
import { AiRequestFeedback } from "./ai-form-fields"
import { AiConnectionStatus } from "./ai-connection-status"
import { ConnectAiDialog } from "./connect-ai-dialog"
import { ManageAiDialog } from "./manage-ai-dialog"

type OpenDialog = { kind: "connect" } | { kind: "manage"; id: string } | null

export function AiSettings() {
  const {
    providers,
    connections,
    loadingMore,
    reload,
    reloadProviders,
    loadMore,
    replace,
  } = useAiSettings()
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const waitingProviders = useAiRetryWait(providers.error?.retryAt)
  const waitingConnections = useAiRetryWait(connections.error?.retryAt)
  const selected =
    dialog?.kind === "manage"
      ? connections.data.items.find((connection) => connection.id === dialog.id)
      : null

  function updated(connection: AiConnectionDto, action: "save" | "verify") {
    replace(connection)
    if (action === "save") {
      setDialog(null)
      toast.success("Đã cập nhật kết nối")
    } else if (connection.status === "Ready") {
      toast.success("Verification complete: Ready")
    } else {
      toast(
        connection.status === "CoolingDown"
          ? "Verification complete: Temporarily unavailable"
          : "Verification complete: Needs attention"
      )
    }
  }

  async function stale(missing: boolean) {
    setDialog(null)
    const refreshed = await reload()
    toast(
      missing
        ? "Kết nối AI này hiện không có."
        : refreshed
          ? "Kết nối đã thay đổi ở phiên khác. Danh sách đã được cập nhật."
          : "Kết nối đã thay đổi ở phiên khác. Hãy tải lại danh sách trước khi thử lại."
    )
  }

  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) setDialog(null)
      }}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          {providers.status === "loading" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Đang tải nhà cung cấp…
            </p>
          ) : null}
          {providers.status === "error" ? (
            <div className="space-y-2">
              <AiRequestFeedback error={providers.error} />
              <Button
                variant="outline"
                disabled={waitingProviders}
                onClick={() => void reloadProviders()}
              >
                Tải lại nhà cung cấp
              </Button>
            </div>
          ) : null}
          {providers.status === "loaded" && !providers.data.length ? (
            <p className="text-sm text-muted-foreground">
              Hiện chưa có nhà cung cấp AI.
            </p>
          ) : null}
          <DialogTrigger
            render={
              <Button
                disabled={
                  providers.status !== "loaded" ||
                  !providers.data.length ||
                  waitingConnections
                }
              />
            }
            onClick={() => setDialog({ kind: "connect" })}
          >
            <Plug aria-hidden="true" />
            Kết nối AI
          </DialogTrigger>
        </div>

        <section aria-labelledby="ai-connections-heading" className="space-y-3">
          <h2 id="ai-connections-heading" className="text-sm font-semibold">
            Kết nối
          </h2>
          {connections.status === "loading" ? (
            <div
              role="status"
              className="space-y-3 border-y border-border py-5"
            >
              <span className="sr-only">Đang tải kết nối…</span>
              <div className="h-4 w-1/3 rounded-sm bg-muted" />
              <div className="h-3 w-2/3 rounded-sm bg-muted" />
              <div className="h-3 w-1/4 rounded-sm bg-muted" />
            </div>
          ) : null}
          {connections.status === "error" ? (
            <div className="space-y-3 border-y border-border py-4">
              <AiRequestFeedback error={connections.error} />
              <Button
                variant="outline"
                disabled={waitingConnections}
                onClick={() => void reload()}
              >
                Tải lại kết nối
              </Button>
            </div>
          ) : null}
          {connections.status === "loaded" && !connections.data.items.length ? (
            <div className="space-y-2 border-y border-border py-6">
              <p className="text-sm font-medium">
                Kết nối nhà cung cấp để dùng tính năng AI.
              </p>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Khóa API được lưu trên máy chủ và được ẩn sau khi thiết lập.
              </p>
            </div>
          ) : null}
          {connections.status !== "loading" && connections.data.items.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {connections.data.items.map((connection) => (
                <li
                  key={connection.id}
                  className="flex flex-wrap items-start justify-between gap-4 py-5 sm:flex-nowrap sm:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h3 className="break-words text-sm font-medium">
                        {connection.displayName}
                      </h3>
                      <p className="mt-1 break-words text-sm text-muted-foreground">
                        {providers.data.find(
                          (provider) => provider.id === connection.provider
                        )?.name ?? connection.provider}
                      </p>
                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {connection.modelId}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="sr-only">Đuôi khóa API </span>
                        <span aria-hidden="true">**** </span>
                        {connection.apiKeyLast4}
                      </p>
                    </div>
                    <AiConnectionStatus connection={connection} />
                  </div>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          loadingMore || connections.status !== "loaded"
                        }
                        aria-label={`Quản lý ${connection.displayName}`}
                      />
                    }
                    onClick={() =>
                      setDialog({ kind: "manage", id: connection.id })
                    }
                  >
                    <Settings2 aria-hidden="true" />
                    Quản lý
                  </DialogTrigger>
                </li>
              ))}
            </ul>
          ) : null}
          {connections.data.nextCursor && connections.status === "loaded" ? (
            <Button
              variant="outline"
              disabled={loadingMore || dialog !== null}
              aria-busy={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? "Đang tải thêm…" : "Xem thêm"}
            </Button>
          ) : null}
        </section>
      </div>

      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto p-5 sm:p-6">
        {dialog?.kind === "connect" ? (
          <ConnectAiDialog
            providers={providers.data}
            onClose={() => setDialog(null)}
            onCreated={() => {
              setDialog(null)
              toast.success("Đã kết nối AI")
              void reload()
            }}
          />
        ) : null}
        {selected ? (
          <ManageAiDialog
            key={`${selected.id}:${selected.version}`}
            connection={selected}
            onClose={() => setDialog(null)}
            onUpdated={updated}
            onStale={stale}
            onDeleted={() => {
              setDialog(null)
              toast.success("Đã xóa kết nối")
              void reload()
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
