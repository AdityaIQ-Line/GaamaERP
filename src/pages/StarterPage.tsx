import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  Layout, 
  Palette, 
  Code2, 
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

const features = [
  {
    title: "UI Components",
    description: "60+ accessible, customizable components built with Radix UI",
    icon: Code2,
    badge: "Ready to use",
  },
  {
    title: "Layout System",
    description: "Flexible layouts including app shell, split panes, and multi-column",
    icon: Layout,
    badge: "Composable",
  },
  {
    title: "Theming",
    description: "Light and dark modes with OKLCH color system",
    icon: Palette,
    badge: "Customizable",
  },
  {
    title: "Patterns",
    description: "Pre-built patterns for headers, tabs, and navigation",
    icon: Layers,
    badge: "Best practices",
  },
]

export function StarterPage() {
  return (
    <PageShell>
      <PageHeader 
        title="Welcome to Your Project" 
        actions={
          <Button asChild>
            <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
              shadcn/ui Docs
            </a>
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-6xl px-6 py-8 space-y-12">
          
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4" />
              Ready to build
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Start Building Your App
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              This template includes everything you need to build a modern React application.
              Edit this page at <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/pages/StarterPage.tsx</code>
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon strokeWidth={ICON_STROKE_WIDTH} className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Getting Started Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Getting Started</h2>
              <p className="text-muted-foreground mt-2">
                Follow these steps to customize your project
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      1
                    </div>
                    <CardTitle className="text-base">Edit This Page</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Replace this starter page with your own content. Find it at{" "}
                    <code className="text-xs bg-muted px-1 rounded">src/pages/StarterPage.tsx</code>
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      2
                    </div>
                    <CardTitle className="text-base">Configure Navigation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Update sidebar items in{" "}
                    <code className="text-xs bg-muted px-1 rounded">src/lib/sidebar-config.ts</code>{" "}
                    and routes in{" "}
                    <code className="text-xs bg-muted px-1 rounded">src/app/router.tsx</code>
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      3
                    </div>
                    <CardTitle className="text-base">Customize Theme</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Modify colors and styles in{" "}
                    <code className="text-xs bg-muted px-1 rounded">src/index.css</code>{" "}
                    or create a custom theme
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Resources Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Resources</h2>
              <p className="text-muted-foreground mt-2">
                Learn more about the tools and libraries used in this template
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
                  <div className="text-left">
                    <div className="font-semibold">shadcn/ui</div>
                    <div className="text-xs text-muted-foreground">Component library</div>
                  </div>
                  <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-auto h-4 w-4" />
                </a>
              </Button>

              <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer">
                  <div className="text-left">
                    <div className="font-semibold">Tailwind CSS</div>
                    <div className="text-xs text-muted-foreground">Styling framework</div>
                  </div>
                  <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-auto h-4 w-4" />
                </a>
              </Button>

              <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                <a href="https://reactrouter.com" target="_blank" rel="noopener noreferrer">
                  <div className="text-left">
                    <div className="font-semibold">React Router</div>
                    <div className="text-xs text-muted-foreground">Navigation</div>
                  </div>
                  <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-auto h-4 w-4" />
                </a>
              </Button>

              <Button variant="outline" className="h-auto py-4 justify-start" asChild>
                <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
                  <div className="text-left">
                    <div className="font-semibold">Vite</div>
                    <div className="text-xs text-muted-foreground">Build tool</div>
                  </div>
                  <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-auto h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-muted-foreground border-t pt-8">
            <p>
              This is a starter template. Delete or modify any files to fit your needs.
            </p>
            <p className="mt-1">
              Check out the <code className="bg-muted px-1 rounded">docs/</code> folder for more information.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default StarterPage

