export function AuthBootstrap({ label = "Checking your session" }: { label?: string }) {
  return (
    <div className="flex min-h-[18rem] items-center justify-center">
      <div className="space-y-3 text-center" role="status" aria-live="polite">
        <div className="mx-auto h-1.5 w-36 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-primary/70 motion-safe:animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

