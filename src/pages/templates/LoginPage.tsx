import * as React from "react"
import { LoginForm } from "@/components/blocks/login-form"
import { AuthShell } from "@/components/layouts/auth-shell"

/**
 * Login Page Template
 *
 * Wraps the LoginForm inside the shared AuthShell layout.
 *
 * @example
 * ```tsx
 * <LoginPage
 *   onLogin={(email, password) => handleLogin(email, password)}
 * />
 * ```
 */
interface LoginPageProps {
  onLogin?: (email: string, password: string) => void
  onGoogleLogin?: () => void
  showSignupLink?: boolean
  signupLink?: string
  showForgotPassword?: boolean
  forgotPasswordLink?: string
  logo?: React.ReactNode
  logoText?: string
}

export function LoginPage({
  onLogin,
  onGoogleLogin,
  showSignupLink = true,
  signupLink = "/signup",
  showForgotPassword = true,
  forgotPasswordLink = "/password-reset",
  logo,
  logoText = "IQLine Inc.",
}: LoginPageProps) {
  return (
    <AuthShell logo={logo} logoText={logoText} tagline="Sign in to your account">
      <LoginForm
        onLogin={onLogin}
        onGoogleLogin={onGoogleLogin}
        showSignupLink={showSignupLink}
        signupLink={signupLink}
        showForgotPassword={showForgotPassword}
        forgotPasswordLink={forgotPasswordLink}
      />
    </AuthShell>
  )
}
