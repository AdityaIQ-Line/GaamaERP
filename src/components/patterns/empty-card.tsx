import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlusCircle } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

interface EmptyCardProps {
  /** Primary heading */
  title: string
  /** Supporting description */
  description?: string
  /** Icon displayed above the heading */
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  /** Primary CTA label */
  actionLabel?: string
  /** Primary CTA handler */
  onAction?: () => void
  /** Secondary CTA (e.g. "Learn more") */
  secondaryLabel?: string
  onSecondaryAction?: () => void
  className?: string
  /** Compact variant — less vertical padding, smaller text */
  compact?: boolean
}

/**
 * EmptyCard — a card-framed empty state for use inside panels, list areas,
 * or dashboard widgets.
 *
 * Use this instead of the full-page `EmptyState` block when the empty state
 * lives inside a bounded container (a card, a tab panel, a data grid area).
 *
 * @example
 * ```tsx
 * <EmptyCard
 *   icon={FolderOpen}
 *   title="No projects yet"
 *   description="Create your first project to get started."
 *   actionLabel="New Project"
 *   onAction={() => setCreateOpen(true)}
 * />
 * ```
 */
export function EmptyCard({
  title,
  description,
  icon: Icon = PlusCircle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  className,
  compact = false,
}: EmptyCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-lg border border-dashed bg-muted/20",
        compact ? "gap-2 py-8 px-6" : "gap-3 py-16 px-8",
        className,
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          compact ? "size-10" : "size-14",
        )}
      >
        <Icon
          strokeWidth={ICON_STROKE_WIDTH}
          className={cn("text-muted-foreground", compact ? "size-4" : "size-6")}
        />
      </div>

      {/* Text */}
      <div className="space-y-1 max-w-xs">
        <p className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{title}</p>
        {description && (
          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {actionLabel && (
            <Button
              size={compact ? "sm" : "default"}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={onSecondaryAction}
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
