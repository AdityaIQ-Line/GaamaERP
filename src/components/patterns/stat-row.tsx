import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatItem {
  label: string
  value: string | number
  /** Optional comparison value shown as secondary text (e.g. "vs last month") */
  secondary?: string
  trend?: "up" | "down" | "neutral"
  /** Optional icon */
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

interface StatRowProps {
  stats: StatItem[]
  /** Number of columns. Defaults to auto based on item count. */
  columns?: 2 | 3 | 4 | 5
  className?: string
  /** Render a border around each stat */
  bordered?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  up:      { icon: TrendingUp,   color: "text-emerald-600 dark:text-emerald-400" },
  down:    { icon: TrendingDown, color: "text-destructive" },
  neutral: { icon: Minus,        color: "text-muted-foreground" },
} as const

/**
 * StatRow — a horizontal row of summary statistics (KPI tiles).
 *
 * Lighter than `MetricCard` — use this when you need a compact inline
 * strip of numbers without full card chrome, e.g. at the top of a detail
 * page or inside a panel.
 *
 * @example
 * ```tsx
 * <StatRow
 *   stats={[
 *     { label: "Total Sales",   value: "$24,500", trend: "up",      secondary: "+12% vs last month" },
 *     { label: "Active Users",  value: "1,204",   trend: "up" },
 *     { label: "Churn Rate",    value: "2.4%",    trend: "down",    secondary: "-0.3%" },
 *     { label: "Tickets Open",  value: "18",      trend: "neutral" },
 *   ]}
 * />
 * ```
 */
export function StatRow({ stats, columns, className, bordered = true }: StatRowProps) {
  const count = stats.length
  const cols = columns ?? (count <= 2 ? 2 : count === 3 ? 3 : count === 5 ? 5 : 4)

  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-5",
  }[cols]

  return (
    <div className={cn("grid gap-0", gridClass, className)}>
      {stats.map((stat, i) => {
        const trend = stat.trend
        const TrendIcon = trend ? TREND_CONFIG[trend].icon : null
        const trendColor = trend ? TREND_CONFIG[trend].color : ""
        const Icon = stat.icon

        return (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-1 px-4 py-3",
              bordered && "border rounded-lg",
              // Remove double borders between cells when not bordered (divider pattern)
              !bordered && i > 0 && "border-l",
            )}
          >
            {/* Label + icon */}
            <div className="flex items-center gap-1.5">
              {Icon && (
                <Icon strokeWidth={ICON_STROKE_WIDTH} className="size-3.5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
            </div>

            {/* Value */}
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </span>

            {/* Trend + secondary */}
            {(trend || stat.secondary) && (
              <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
                {TrendIcon && (
                  <TrendIcon strokeWidth={ICON_STROKE_WIDTH} className="size-3.5 shrink-0" />
                )}
                {stat.secondary && <span>{stat.secondary}</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
