import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import pageNotFoundImage from "@/assets/page_not_found.png"

/**
 * 404 Not Found Page Template
 * 
 * A reusable 404 error page template with customizable navigation options.
 * 
 * @example
 * ```tsx
 * <NotFoundPage 
 *   homeButton={{ label: "Go Home", href: "/" }}
 *   backButton={{ label: "Go Back", onClick: () => window.history.back() }}
 * />
 * ```
 */
interface NotFoundPageProps {
  title?: string
  description?: string
  homeButton?: {
    label?: string
    href?: string
    onClick?: () => void
  }
  backButton?: {
    label?: string
    onClick?: () => void
  }
  showBackButton?: boolean
  showHomeButton?: boolean
}

export function NotFoundPage({
  title = "Page Not Found",
  description = "Sorry, we couldn't find the page you're looking for. The page might have been moved or doesn't exist.",
  homeButton,
  backButton,
  showBackButton = true,
  showHomeButton = true,
}: NotFoundPageProps) {
  const handleBack = () => {
    if (backButton?.onClick) {
      backButton.onClick()
    } else {
      window.history.back()
    }
  }

  const handleHome = () => {
    if (homeButton?.onClick) {
      homeButton.onClick()
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Illustration */}
        <div className="flex justify-center">
          <img
            src={pageNotFoundImage}
            alt="Page not found"
            className="w-full max-w-md"
          />
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold">{title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        {(showHomeButton || showBackButton) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {showHomeButton && (
              <>
                {homeButton?.href ? (
                  <Button asChild>
                    <Link to={homeButton.href}>
                      <Home strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                      {homeButton.label || "Go Home"}
                    </Link>
                  </Button>
                ) : homeButton?.onClick ? (
                  <Button onClick={handleHome}>
                    <Home strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                    {homeButton.label || "Go Home"}
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/">
                      <Home strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                      Go Home
                    </Link>
                  </Button>
                )}
              </>
            )}
            {showBackButton && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                {backButton?.label || "Go Back"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

