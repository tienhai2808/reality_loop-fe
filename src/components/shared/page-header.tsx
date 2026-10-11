import { cn } from "@/lib/utils"

function PageHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header className={cn("flex flex-col gap-2", className)} {...props}>
      {children}
    </header>
  )
}

function PageHeaderTitle({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "max-w-3xl text-[2rem] font-semibold leading-[2.25rem] text-balance text-foreground md:text-[2.5rem] md:leading-[2.75rem]",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "max-w-2xl text-[0.9375rem] leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function PageHeaderActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props} />
  )
}

PageHeader.Title = PageHeaderTitle
PageHeader.Description = PageHeaderDescription
PageHeader.Actions = PageHeaderActions

export { PageHeader }
