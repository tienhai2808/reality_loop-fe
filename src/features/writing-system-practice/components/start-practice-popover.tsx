"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Play } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover } from "@base-ui/react/popover"
import { CatalogFeedback } from "@/features/language-foundations/components/catalog-feedback"
import {
  FoundationsError,
  normalizeFoundationsError,
} from "@/features/language-foundations/api/language-foundations-errors"
import { listWritingPractice, startWritingPractice } from "../api/practice-api"
import {
  startWritingPracticeRequestSchema,
  type WritingPracticeSession,
} from "../api/practice-schemas"
import {
  practiceHistoryHref,
  practiceSessionHref,
  usePracticeHandoff,
} from "../model/practice-handoff"

export function StartPracticePopover({
  profileId,
  systemCode,
  systemName,
  label = "Luyện nhận diện",
}: {
  profileId: string
  systemCode: string
  systemName: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  return (
    <Popover.Root
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value)
      }}
    >
      <Popover.Trigger
        render={<Button className="min-h-11 gap-1.5 sm:min-h-9" />}
      >
        <Play className="size-3.5 fill-current" aria-hidden="true" />
        {label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={6} className="z-50">
          <Popover.Popup className="grid max-h-[min(32rem,var(--available-height))] w-[min(22rem,calc(100vw-2rem))] gap-3 overflow-y-auto rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
            <Popover.Title className="text-lg font-semibold">
              Luyện nhận diện {systemName}
            </Popover.Title>
            <Popover.Description className="text-sm leading-6 text-muted-foreground">
              Chọn cách đọc của từng chữ. Câu trả lời được lưu sau mỗi câu.
            </Popover.Description>
            {open ? (
              <StartPracticeForm
                profileId={profileId}
                systemCode={systemCode}
                onPending={setPending}
                onClose={() => setOpen(false)}
              />
            ) : null}
            <Popover.Close
              render={<Button variant="ghost" disabled={pending} />}
            >
              Hủy
            </Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

const QUESTION_COUNT_OPTIONS = Array.from({ length: 20 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1} câu`,
}))

function StartPracticeForm({
  profileId,
  systemCode,
  onPending,
  onClose,
}: {
  profileId: string
  systemCode: string
  onPending: (value: boolean) => void
  onClose: () => void
}) {
  const [questionCount, setQuestionCount] = useState(10)
  const [phase, setPhase] = useState<
    "idle" | "starting" | "recovering" | "uncertain"
  >("idle")
  const [error, setError] = useState<FoundationsError | null>(null)
  const [history, setHistory] = useState<WritingPracticeSession[] | null>(null)
  const [historyError, setHistoryError] = useState<FoundationsError | null>(
    null
  )
  const active = useRef<AbortController | null>(null)
  const router = useRouter()
  const search = useSearchParams()
  const character = search.get("character")
  const { remember } = usePracticeHandoff()
  useEffect(
    () => () => {
      active.current?.abort()
    },
    []
  )

  async function recoverHistory(controller: AbortController) {
    setPhase("recovering")
    setHistoryError(null)
    try {
      const page = await listWritingPractice(
        profileId,
        { systemCode },
        null,
        controller.signal
      )
      if (!controller.signal.aborted) setHistory(page.items)
    } catch (value) {
      if (!controller.signal.aborted)
        setHistoryError(normalizeFoundationsError(value))
    } finally {
      if (!controller.signal.aborted) setPhase("uncertain")
    }
  }
  async function reloadHistory() {
    if (
      active.current ||
      (historyError?.retryAt && historyError.retryAt > Date.now())
    )
      return
    const controller = new AbortController()
    active.current = controller
    await recoverHistory(controller)
    if (active.current === controller) active.current = null
  }
  async function start() {
    if (active.current || error || phase !== "idle") return
    const parsed = startWritingPracticeRequestSchema.safeParse({
      questionCount,
    })
    if (!parsed.success) return
    const controller = new AbortController()
    active.current = controller
    setPhase("starting")
    onPending(true)
    try {
      const detail = await startWritingPractice(
        profileId,
        systemCode,
        parsed.data,
        controller.signal
      )
      if (controller.signal.aborted) return
      remember(detail)
      onClose()
      router.push(practiceSessionHref(profileId, detail.session.id, character))
    } catch (value) {
      if (controller.signal.aborted) return
      const problem = normalizeFoundationsError(value)
      if (problem.status === null || problem.status >= 500) {
        setError(
          new FoundationsError(
            "Chưa xác nhận được bài đã tạo. Hãy kiểm tra lịch sử trước khi bắt đầu bài mới.",
            problem.status,
            problem.retryAt,
            problem.traceId
          )
        )
        await recoverHistory(controller)
      } else {
        setError(problem)
        setPhase("idle")
      }
    } finally {
      if (active.current === controller) active.current = null
      if (!controller.signal.aborted) onPending(false)
    }
  }

  const uncertain = phase === "uncertain" || phase === "recovering"
  if (uncertain)
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm leading-6 text-muted-foreground">
          {error?.message}
        </p>
        {phase === "recovering" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Đang kiểm tra các bài đã lưu…
          </p>
        ) : null}
        <CatalogFeedback
          error={historyError}
          onRetry={() => void reloadHistory()}
        />
        {history ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Bài luyện gần đây</p>
            {!history.length ? (
              <p className="text-sm text-muted-foreground">
                Chưa thấy bài vừa tạo. Bạn có thể kiểm tra lại lịch sử hoặc chọn
                bắt đầu bài mới.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {history.map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {session.questionCount} câu
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <time dateTime={session.createdAt}>
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(session.createdAt))}
                        </time>
                      </p>
                    </div>
                    <Link
                      className={buttonVariants({
                        variant:
                          session.status === "InProgress"
                            ? "default"
                            : "outline",
                        size: "sm",
                      })}
                      href={practiceSessionHref(profileId, session.id)}
                    >
                      {session.status === "InProgress"
                        ? "Tiếp tục"
                        : "Xem kết quả"}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {!historyError ? (
            <Button
              variant="outline"
              disabled={phase === "recovering"}
              onClick={() => void reloadHistory()}
            >
              Kiểm tra lại lịch sử
            </Button>
          ) : null}
          <Link
            href={practiceHistoryHref(systemCode)}
            className={buttonVariants({ variant: "ghost" })}
          >
            Toàn bộ lịch sử
          </Link>
          {history ? (
            <Button
              variant="ghost"
              disabled={phase === "recovering"}
              onClick={() => {
                setError(null)
                setHistory(null)
                setPhase("idle")
              }}
            >
              Bắt đầu bài mới
            </Button>
          ) : null}
        </div>
      </div>
    )

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void start()
      }}
    >
      <div className="space-y-2">
        <label
          htmlFor="practice-question-count"
          className="text-sm font-medium"
        >
          Số câu
        </label>
        <Select
          items={QUESTION_COUNT_OPTIONS}
          value={String(questionCount)}
          onValueChange={(val) => {
            if (val) setQuestionCount(Number(val))
          }}
          disabled={phase === "starting"}
        >
          <SelectTrigger id="practice-question-count">
            <SelectValue placeholder="Chọn số câu" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_COUNT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CatalogFeedback error={error} onRetry={() => setError(null)} />
      <Button
        type="submit"
        className="w-full"
        disabled={phase === "starting" || !!error}
        aria-busy={phase === "starting"}
      >
        {phase === "starting" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Đang tạo bài…
          </>
        ) : (
          "Bắt đầu luyện"
        )}
      </Button>
    </form>
  )
}
