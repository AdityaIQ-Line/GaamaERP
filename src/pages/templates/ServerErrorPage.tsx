import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, RefreshCw, AlertTriangle } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

/**
 * Server Error Page Template (500)
 * 
 * A reusable 500 error page template for server errors.
 * 
 * @example
 * ```tsx
 * <ServerErrorPage 
 *   onRetry={() => window.location.reload()}
 *   homeButton={{ label: "Go Home", href: "/" }}
 * />
 * ```
 */
interface ServerErrorPageProps {
  title?: string
  description?: string
  errorCode?: string | number
  homeButton?: {
    label?: string
    href?: string
    onClick?: () => void
  }
  showRetry?: boolean
  onRetry?: () => void
  showHomeButton?: boolean
}

export function ServerErrorPage({
  title = "Something went wrong",
  description = "We're experiencing technical difficulties. Our team has been notified and is working on a fix.",
  errorCode = "500",
  homeButton,
  showRetry = true,
  onRetry,
  showHomeButton = true,
}: ServerErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  const handleHome = () => {
    if (homeButton?.onClick) {
      homeButton.onClick()
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertTriangle strokeWidth={ICON_STROKE_WIDTH} className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Error Code */}
        <div className="text-7xl font-bold text-muted-foreground/30">
          {errorCode}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        {(showHomeButton || showRetry) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {showRetry && (
              <Button onClick={handleRetry} variant="default">
                <RefreshCw strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {showHomeButton && (
              <>
                {homeButton?.href ? (
                  <Button variant="outline" asChild>
                    <Link to={homeButton.href}>
                      <Home strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                      {homeButton.label || "Go Home"}
                    </Link>
                  </Button>
                ) : homeButton?.onClick ? (
                  <Button variant="outline" onClick={handleHome}>
                    <Home strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                    {homeButton.label || "Go Home"}
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link to="/">
                      <Home strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                      Go Home
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Support Info */}
        <p className="text-sm text-muted-foreground">
          If the problem persists, please contact{" "}
          <a href="mailto:support@example.com" className="text-primary hover:underline">
            support
          </a>
        </p>
      </div>
    </div>
  )
}
