import * as React from "react"
import { cn } from "@/lib/utils"

// ─── DetailRow ────────────────────────────────────────────────────────────────

interface DetailRowProps {
  /** Field label */
  label: string
  /** The value to display. Accepts any renderable node. */
  value?: React.ReactNode
  /** Rendered when value is falsy — defaults to an em dash */
  empty?: React.ReactNode
  /** Optional icon rendered before the label */
  icon?: React.ComponentType<{ className?: string }>
  /** Render label and value stacked instead of side-by-side */
  stacked?: boolean
  className?: string
}

/**
 * DetailRow — a single label + value row used in read-only detail panels,
 * profile pages, order summaries, and settings review sections.
 *
 * @example
 * ```tsx
 * <DetailRow label="Full Name"  value="Jane Doe" />
 * <DetailRow label="Email"      value="jane@example.com" icon={Mail} />
 * <DetailRow label="Phone"      value={user.phone} empty="Not provided" />
 * <DetailRow label="Bio"        value={user.bio} stacked />
 * ```
 */
export function DetailRow({
  label,
  value,
  empty = "—",
  icon: Icon,
  stacked = false,
  className,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        "py-3",
        stacked ? "space-y-1" : "flex items-start gap-4",
        className,
      )}
    >
      {/* Label */}
      <dt
        className={cn(
          "flex items-center gap-1.5 text-sm text-muted-foreground shrink-0",
          !stacked && "min-w-[140px]",
        )}
      >
        {Icon && <Icon className="size-3.5" />}
        {label}
      </dt>

      {/* Value */}
      <dd className="text-sm font-medium break-words">
        {value ?? <span className="text-muted-foreground font-normal italic">{empty}</span>}
      </dd>
    </div>
  )
}

// ─── DetailList ───────────────────────────────────────────────────────────────

interface DetailListProps {
  children: React.ReactNode
  /** Optional section heading */
  title?: string
  className?: string
  /** Show dividers between rows */
  divided?: boolean
}

/**
 * DetailList — wraps multiple `DetailRow` components with an optional heading
 * and dividers. Uses a `<dl>` semantically.
 *
 * @example
 * ```tsx
 * <DetailList title="Contact" divided>
 *   <DetailRow label="Email"  value="jane@example.com" />
 *   <DetailRow label="Phone"  value="+1 555 0100" />
 * </DetailList>
 * ```
 */
export function DetailList({ children, title, className, divided = false }: DetailListProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 px-0">
          {title}
        </p>
      )}
      <dl className={cn(divided && "divide-y")}>
        {children}
      </dl>
    </div>
  )
}
