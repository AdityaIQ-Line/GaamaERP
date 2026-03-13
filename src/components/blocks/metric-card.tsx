import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  description?: string
  variant?: "default" | "compact"
  className?: string
}

/**
 * MetricCard Block
 *
 * Displays a KPI metric with trend indicator and optional description.
 * Uses semantic design tokens rather than hardcoded colors so it stays
 * consistent across light/dark themes.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Revenue"
 *   value="$124,580"
 *   change="+12.5%"
 *   trend="up"
 *   icon={DollarSign}
 *   description="Revenue for the last 30 days"
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description,
  variant = "default",
  className,
}: MetricCardProps) {
  // Semantic color classes that work in both light and dark mode
  const trendColorClass =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
      ? "text-destructive"
      : "text-muted-foreground"

  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp

  if (variant === "compact") {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && (
            <Icon
              strokeWidth={ICON_STROKE_WIDTH}
              className="size-4 text-muted-foreground"
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className={cn("flex items-center gap-1 text-xs mt-1", trendColorClass)}>
            <TrendIcon strokeWidth={ICON_STROKE_WIDTH} className="size-3" />
            <span className="font-medium">{change}</span>
            <span className="text-muted-foreground">from last month</span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("gap-1 font-medium", trendColorClass)}
          >
            <TrendIcon strokeWidth={ICON_STROKE_WIDTH} className="size-3" />
            {change}
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className={cn("flex items-center gap-1.5 font-medium", trendColorClass)}>
          <TrendIcon strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
          {trend === "up"
            ? "Trending up this month"
            : trend === "down"
            ? "Down this period"
            : "No change"}
        </div>
        {description && (
          <div className="text-muted-foreground">{description}</div>
        )}
      </CardFooter>
    </Card>
  )
}
