import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Home, BarChart3, FileText, Settings, TrendingUp, CreditCard,
  File, Calendar, BookOpen, User, Search, Layout, Palette, AlertTriangle, Grid3x3,
} from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

const COMMAND_GROUPS = [
  {
    heading: "Navigation",
    items: [
      { label: "Home", icon: Home, href: "/" },
      { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
      { label: "Search", icon: Search, href: "/search" },
    ],
  },
  {
    heading: "Data & Content",
    items: [
      { label: "Analytics", icon: TrendingUp, href: "/charts" },
      { label: "Data Table", icon: File, href: "/table" },
      { label: "Cards", icon: CreditCard, href: "/cards" },
      { label: "Calendar", icon: Calendar, href: "/calendar" },
    ],
  },
  {
    heading: "Forms & Layouts",
    items: [
      { label: "Forms", icon: FileText, href: "/forms" },
      { label: "Layouts", icon: Layout, href: "/layouts" },
      { label: "Trays", icon: Grid3x3, href: "/trays" },
    ],
  },
  {
    heading: "Design System",
    items: [
      { label: "Components", icon: Palette, href: "/components" },
      { label: "Documentation", icon: BookOpen, href: "/docs" },
      { label: "Edge Cases", icon: AlertTriangle, href: "/edge-cases" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Profile", icon: User, href: "/profile" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
]

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * CommandPalette — Global Cmd+K / Ctrl+K command launcher.
 *
 * Provides keyboard-first navigation across all app pages.
 * Renders once at the AppShell level.
 *
 * @example
 * ```tsx
 * <CommandPalette />
 * ```
 */
export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const navigate = useNavigate()

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  // Cmd+K on Mac, Ctrl+K on Windows/Linux
  useKeyboardShortcut({
    key: "k",
    modifiers: ["ctrl"],
    callback: (e) => { e.preventDefault(); setOpen(!open) },
  })

  const handleSelect = (href: string) => {
    navigate(href)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {open ? (
        <Command className="rounded-lg border-0 shadow-none">
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {COMMAND_GROUPS.map((group, i) => (
              <React.Fragment key={group.heading}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem
                        key={item.href}
                        value={item.label}
                        onSelect={() => handleSelect(item.href)}
                        className="gap-2"
                      >
                        <Icon strokeWidth={ICON_STROKE_WIDTH} className="size-4 text-muted-foreground" />
                        {item.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      ) : null}
    </CommandDialog>
  )
}

/**
 * CommandPaletteTrigger — compact search control in header beside action icons.
 */
export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex items-center gap-1.5 rounded-md border border-input bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors w-48"
    >
      <Search strokeWidth={ICON_STROKE_WIDTH} className="size-3 shrink-0" />
      <span className="flex-1 truncate text-left">Search…</span>
      <kbd className="pointer-events-none inline-flex items-center rounded border bg-background px-1 font-mono text-[9px] font-medium shrink-0">
        ⌘K
      </kbd>
    </button>
  )
}
