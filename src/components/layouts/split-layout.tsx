import * as React from "react"
import { cn } from "@/lib/utils"

type SplitRatio = "50/50" | "60/40" | "70/30" | "75/25" | "40/60" | "30/70" | "25/75"

interface SplitLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
  /**
   * Predefined split ratio — left/right.
   * @default "70/30"
   */
  ratio?: SplitRatio
  /** Stack panels vertically on small screens */
  responsive?: boolean
  className?: string
}

const LEFT_CLASS: Record<SplitRatio, string> = {
  "50/50": "basis-1/2",
  "60/40": "basis-3/5",
  "70/30": "basis-[70%]",
  "75/25": "basis-3/4",
  "40/60": "basis-2/5",
  "30/70": "basis-[30%]",
  "25/75": "basis-1/4",
}

const RIGHT_CLASS: Record<SplitRatio, string> = {
  "50/50": "basis-1/2",
  "60/40": "basis-2/5",
  "70/30": "basis-[30%]",
  "75/25": "basis-1/4",
  "40/60": "basis-3/5",
  "30/70": "basis-[70%]",
  "25/75": "basis-3/4",
}

/**
 * SplitLayout — a static two-panel layout with a fixed ratio.
 *
 * For a resizable version, use TwoColumnLayout instead.
 *
 * @example
 * ```tsx
 * <SplitLayout left={<Preview />} right={<Properties />} ratio="70/30" />
 * <SplitLayout left={<Nav />} right={<Content />} ratio="25/75" responsive />
 * ```
 */
export function SplitLayout({
  left,
  right,
  ratio = "70/30",
  responsive = false,
  className,
}: SplitLayoutProps) {
  return (
    <div
      className={cn(
        "flex h-full",
        responsive ? "flex-col sm:flex-row" : "flex-row",
        className,
      )}
    >
      <div className={cn("shrink-0 border-r overflow-auto", LEFT_CLASS[ratio])}>
        {left}
      </div>
      <div className={cn("min-w-0 flex-1 overflow-auto", RIGHT_CLASS[ratio])}>
        {right}
      </div>
    </div>
  )
}
