import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

const Menu = MenuPrimitive.Root
const MenuTrigger = MenuPrimitive.Trigger
const MenuSeparator = MenuPrimitive.Separator

function MenuContent({
  className,
  sideOffset = 8,
  align = "end",
  children,
  ...props
}: MenuPrimitive.Popup.Props & {
  sideOffset?: number
  align?: MenuPrimitive.Positioner.Props["align"]
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner sideOffset={sideOffset} align={align}>
        <MenuPrimitive.Popup
          className={cn(
            "z-40 min-w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-foreground/10 outline-none transition-[transform,opacity] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function MenuItem({
  className,
  ...props
}: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "flex min-h-9 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none transition-colors data-highlighted:bg-muted data-highlighted:text-foreground data-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function MenuLinkItem({
  className,
  ...props
}: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-sm px-2 text-sm outline-none transition-colors data-highlighted:bg-muted data-highlighted:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger }

