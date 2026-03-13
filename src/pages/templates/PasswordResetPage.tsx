import * as React from "react"
import { Link } from "react-router-dom"
import { PasswordResetForm } from "@/components/blocks/password-reset-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Sparkles } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

/**
 * Password Reset Page Template
 * 
 * A standard password reset page template with email input for password recovery.
 * Features:
 * - Logo/branding area
 * - Muted background for visual hierarchy
 * - Semantic spacing throughout
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <PasswordResetPage 
 *   onReset={(email) => handlePasswordReset(email)}
 *   showLoginLink={true}
 *   loginLink="/login"
 * />
 * ```
 */
interface PasswordResetPageProps {
  onReset?: (email: string) => void
  showLoginLink?: boolean
  loginLink?: string
  logo?: React.ReactNode
  logoText?: string
}

export function PasswordResetPage({
  onReset,
  showLoginLink = true,
  loginLink = "/login",
  logo,
  logoText = "IQLine Inc.",
}: PasswordResetPageProps) {
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleReset = async (resetEmail: string) => {
    setIsLoading(true)
    setEmail(resetEmail)
    
    try {
      if (onReset) {
        await onReset(resetEmail)
      } else {
        // Default behavior - replace with your reset logic
        console.log("Password reset requested for:", resetEmail)
      }
      setIsSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo Area */}
          {(logo || logoText) && (
            <div className="flex items-center justify-center gap-2">
              {logo || (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                </div>
              )}
              {logoText && (
                <span className="text-lg font-semibold">{logoText}</span>
              )}
            </div>
          )}

          {/* Success Card */}
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="rounded-lg bg-muted p-4 text-center text-sm">
                  <p className="text-muted-foreground">
                    If an account exists with this email, you will receive a password reset link.
                    Please check your inbox and follow the instructions.
                  </p>
                </div>
                {showLoginLink && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={loginLink}>
                      <ArrowLeft strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
                      Back to login
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail("")
                  }}
                >
                  Resend email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home Link */}
          <div className="text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo Area */}
        {(logo || logoText) && (
          <div className="flex items-center justify-center gap-2">
            {logo || (
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
              </div>
            )}
            {logoText && (
              <span className="text-lg font-semibold">{logoText}</span>
            )}
          </div>
        )}

        {/* Password Reset Form */}
        <PasswordResetForm
          onReset={handleReset}
          showLoginLink={showLoginLink}
          loginLink={loginLink}
          isLoading={isLoading}
        />

        {/* Back to Home Link */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
