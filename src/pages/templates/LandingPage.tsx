import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Layout,
  Layers,
  Palette,
  Sparkles,
  Zap,
  Shield,
  Users,
} from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

/**
 * Landing Page Template
 * 
 * A public-facing landing page for marketing/product websites.
 * This page is designed to be used before login.
 * 
 * Features:
 * - Hero section with CTA
 * - Features grid
 * - Pricing section (optional)
 * - Footer
 * 
 * @example
 * ```tsx
 * <LandingPage 
 *   companyName="Acme Inc"
 *   loginLink="/login"
 *   signupLink="/signup"
 * />
 * ```
 */
interface LandingPageProps {
  companyName?: string
  tagline?: string
  description?: string
  loginLink?: string
  signupLink?: string
  logo?: React.ReactNode
}

const features = [
  {
    title: "Lightning Fast",
    description: "Built on Vite for instant hot module replacement and blazing fast builds.",
    icon: Zap,
  },
  {
    title: "Type Safe",
    description: "Full TypeScript support with strict type checking and IntelliSense.",
    icon: Code2,
  },
  {
    title: "Beautiful UI",
    description: "60+ accessible components built with Radix UI and Tailwind CSS.",
    icon: Palette,
  },
  {
    title: "Flexible Layouts",
    description: "Pre-built layouts for dashboards, split views, and multi-column designs.",
    icon: Layout,
  },
  {
    title: "Secure by Default",
    description: "Authentication patterns and role-based access control ready to use.",
    icon: Shield,
  },
  {
    title: "Team Ready",
    description: "Scalable architecture patterns for teams of any size.",
    icon: Users,
  },
]

const benefits = [
  "Pre-built authentication pages",
  "Role-based access control patterns",
  "Responsive sidebar navigation",
  "Dark mode support",
  "Accessible components",
  "Comprehensive documentation",
]

export function LandingPage({
  companyName = "Your Product",
  tagline = "Build faster. Ship with confidence.",
  description = "A modern React template with everything you need to build beautiful, responsive applications.",
  loginLink = "/login",
  signupLink = "/signup",
  logo,
}: LandingPageProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            {logo || (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-semibold">{companyName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to="/sandbox">Try sandbox</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to={loginLink}>Sign in</Link>
            </Button>
            <Button asChild>
              <Link to={signupLink}>
                Get Started
                <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="mr-1 h-3 w-3" />
            Production Ready
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to={signupLink}>
                Start Building
                <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={loginLink}>
                Sign In
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start with a solid foundation and scale as you grow.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon strokeWidth={ICON_STROKE_WIDTH} className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ship faster with best practices built in
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Everything is organized following industry-standard patterns so you can focus on building features, not boilerplate.
                </p>
                <ul className="mt-8 space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <CheckCircle2 strokeWidth={ICON_STROKE_WIDTH} className="h-5 w-5 text-primary" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button asChild>
                    <Link to={signupLink}>
                      Get Started Free
                      <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-lg border bg-card p-8 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Layers strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">src/</span>
                    </div>
                    <div className="ml-6 space-y-1 text-sm">
                      <div className="text-muted-foreground">├── components/</div>
                      <div className="text-muted-foreground">├── pages/</div>
                      <div className="text-muted-foreground">├── hooks/</div>
                      <div className="text-muted-foreground">├── lib/</div>
                      <div className="text-muted-foreground">└── app/</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create your account and start building in minutes.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link to={signupLink}>
                Create Free Account
                <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              {logo || (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                  <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <span className="text-sm font-medium">{companyName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
