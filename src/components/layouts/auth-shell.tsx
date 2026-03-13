import * as React from "react"
import { Link } from "react-router-dom"
import LogoIcon from "@/assets/Logo.svg?react"

interface AuthShellProps {
  children: React.ReactNode
  /** Optional logo override */
  logo?: React.ReactNode
  /** Product/brand name shown next to logo */
  logoText?: string
  /** Link on logo — defaults to "/" */
  logoHref?: string
  /** Show a "Back to home" link below the card */
  showHomeLink?: boolean
  /** Optional tagline below logo */
  tagline?: string
}

/**
 * AuthShell — Centered layout wrapper for authentication pages.
 *
 * Wraps Login, Signup, Password Reset and similar standalone pages
 * in a consistent, full-height centered layout with branding at the top.
 *
 * @example
 * ```tsx
 * <AuthShell logoText="Acme Inc." tagline="Sign in to your account">
 *   <LoginForm />
 * </AuthShell>
 * ```
 */
export function AuthShell({
  children,
  logo,
  logoText = "IQLine Inc.",
  logoHref = "/",
  showHomeLink = true,
  tagline,
}: AuthShellProps) {
  return (
    <div className="min-h-svh w-full flex flex-col items-center justify-center bg-muted/40 px-4 py-10">
      {/* Brand header */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Link to={logoHref} className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
          {logo ?? (
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <LogoIcon className="h-5 w-auto" />
            </div>
          )}
          {logoText && (
            <span className="text-lg font-semibold">{logoText}</span>
          )}
        </Link>
        {tagline && (
          <p className="text-sm text-muted-foreground">{tagline}</p>
        )}
      </div>

      {/* Content card area */}
      <div className="w-full max-w-sm">
        {children}
      </div>

      {/* Back to home */}
      {showHomeLink && (
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      )}
    </div>
  )
}
