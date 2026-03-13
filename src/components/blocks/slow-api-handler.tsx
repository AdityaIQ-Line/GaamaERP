import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { cn } from "@/lib/utils"

export interface SlowApiHandlerProps {
  delay?: number
  onSlowApi?: () => void
  children: React.ReactNode
  className?: string
}

/**
 * SlowApiHandler - Component for handling slow APIs
 * 
 * Shows a loading indicator and message after a delay threshold.
 * Useful for APIs that may take longer than usual (>3 seconds).
 * 
 * @example
 * ```tsx
 * <SlowApiHandler delay={3000} onSlowApi={() => showMessage()}>
 *   <DataComponent />
 * </SlowApiHandler>
 * ```
 */
export function SlowApiHandler({
  delay = 3000,
  onSlowApi,
  children,
  className,
}: SlowApiHandlerProps) {
  const [isSlow, setIsSlow] = React.useState(false)

  React.useEffect(() => {
    setIsSlow(false) // Reset when delay changes
    const timer = setTimeout(() => {
      setIsSlow(true)
      onSlowApi?.()
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, onSlowApi])

  return (
    <div className={cn("relative", className)}>
      {children}
      {isSlow && (
        <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
          <Clock className="h-4 w-4 text-amber-600" strokeWidth={ICON_STROKE_WIDTH} />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            This is taking longer than usual
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            The request is still processing. Please wait...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

