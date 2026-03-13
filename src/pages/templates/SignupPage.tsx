import * as React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Lock, Mail, User } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { AuthShell } from "@/components/layouts/auth-shell"

/**
 * Signup Page Template
 *
 * Registration page using the shared AuthShell layout.
 *
 * @example
 * ```tsx
 * <SignupPage onSignup={(data) => handleSignup(data)} />
 * ```
 */
interface SignupPageProps {
  onSignup?: (data: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }) => void
  showLoginLink?: boolean
  loginLink?: string
  logo?: React.ReactNode
  logoText?: string
}

export function SignupPage({
  onSignup,
  showLoginLink = true,
  loginLink = "/login",
  logo,
  logoText = "IQLine Inc.",
}: SignupPageProps) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password !== confirmPassword) return alert("Passwords do not match")
    if (!acceptTerms) return alert("Please accept the terms and conditions")

    setIsLoading(true)
    try {
      if (onSignup) {
        await onSignup({ name, email, password, confirmPassword })
      } else {
        console.log("Signup:", { name, email, password })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell logo={logo} logoText={logoText} tagline="Create your account">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">Get started</CardTitle>
          <CardDescription>Enter your details to create an account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User strokeWidth={ICON_STROKE_WIDTH} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="name" placeholder="John Doe" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail strokeWidth={ICON_STROKE_WIDTH} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="email" type="email" placeholder="name@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock strokeWidth={ICON_STROKE_WIDTH} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock strokeWidth={ICON_STROKE_WIDTH} className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="confirm-password" type="password" placeholder="••••••••" className="pl-9" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(c) => setAcceptTerms(c === true)} disabled={isLoading} />
              <label htmlFor="terms" className="text-sm leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">Terms and Conditions</Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create account"}
            </Button>

            {showLoginLink && (
              <>
                <div className="relative w-full">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">OR</span>
                  </div>
                </div>
                <p className="text-center text-sm">
                  Already have an account?{" "}
                  <Link to={loginLink} className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </>
            )}
          </CardContent>
        </form>
      </Card>
    </AuthShell>
  )
}
