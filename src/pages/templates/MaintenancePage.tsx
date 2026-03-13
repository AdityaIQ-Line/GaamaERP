import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock, Mail, Twitter, ArrowRight, Sparkles } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

/**
 * Maintenance Page Template
 * 
 * A page to display during scheduled maintenance or updates.
 * 
 * @example
 * ```tsx
 * <MaintenancePage 
 *   estimatedTime="2 hours"
 *   statusPageUrl="https://status.example.com"
 * />
 * ```
 */
interface MaintenancePageProps {
  title?: string
  description?: string
  estimatedTime?: string
  statusPageUrl?: string
  supportEmail?: string
  twitterHandle?: string
  logo?: React.ReactNode
  companyName?: string
}

export function MaintenancePage({
  title = "We're under maintenance",
  description = "We're currently performing scheduled maintenance to improve your experience. We'll be back shortly.",
  estimatedTime,
  statusPageUrl,
  supportEmail = "support@example.com",
  twitterHandle,
  logo,
  companyName = "Your Product",
}: MaintenancePageProps) {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          {logo || (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Maintenance Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-8">
              <Wrench strokeWidth={ICON_STROKE_WIDTH} className="h-16 w-16 text-amber-600 dark:text-amber-400" />
            </div>
            <Badge 
              className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-500"
            >
              <Clock strokeWidth={ICON_STROKE_WIDTH} className="mr-1 h-3 w-3" />
              In Progress
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Estimated Time */}
        {estimatedTime && (
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm">
            <Clock strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-muted-foreground" />
            <span>Estimated time: <strong>{estimatedTime}</strong></span>
          </div>
        )}

        {/* Status Page */}
        {statusPageUrl && (
          <div>
            <Button asChild>
              <a href={statusPageUrl} target="_blank" rel="noopener noreferrer">
                Check Status Page
                <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Contact Options */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Need help? Get in touch with us.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {supportEmail && (
              <Button variant="outline" asChild>
                <a href={`mailto:${supportEmail}`}>
                  <Mail strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                  Email Support
                </a>
              </Button>
            )}
            {twitterHandle && (
              <Button variant="outline" asChild>
                <a 
                  href={`https://twitter.com/${twitterHandle}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Twitter strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                  @{twitterHandle}
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Thank you for your patience. — The {companyName} Team
        </p>
      </div>
    </div>
  )
}
