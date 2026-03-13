import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { MetricCard } from "@/components/blocks/metric-card"
import { EmptyState } from "@/components/blocks/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  ArrowRight,
  Plus,
  FileText,
  FolderOpen,
} from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

/**
 * Dashboard Home Page Template
 * 
 * A role-aware dashboard page that shows different content based on user role.
 * This is the default landing page after authentication.
 * 
 * Features:
 * - Role-based content display
 * - Quick actions grid
 * - Recent activity
 * - Key metrics overview
 * 
 * @example
 * ```tsx
 * <DashboardHomePage 
 *   user={{ name: "John", role: "admin" }}
 *   onNavigate={(path) => navigate(path)}
 * />
 * ```
 */
interface DashboardHomePageProps {
  user?: {
    name?: string
    role?: "admin" | "manager" | "user" | string
    email?: string
  }
  metrics?: {
    title: string
    value: string
    change?: string
    trend?: "up" | "down"
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  }[]
  quickActions?: {
    title: string
    description: string
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
    href?: string
    onClick?: () => void
  }[]
  recentItems?: {
    id: string
    title: string
    description: string
    time: string
    type?: string
  }[]
  onNavigate?: (path: string) => void
}

// Default metrics for demo
const defaultMetrics = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+8.2%",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "-1.2%",
    trend: "down" as const,
    icon: Activity,
  },
  {
    title: "Growth",
    value: "+23%",
    change: "+4.5%",
    trend: "up" as const,
    icon: TrendingUp,
  },
]

// Quick action type
type QuickAction = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  href?: string
  onClick?: () => void
}

// Quick actions based on role
const getQuickActions = (role: string): QuickAction[] => {
  const commonActions: QuickAction[] = [
    {
      title: "View Reports",
      description: "Access your analytics and reports",
      icon: FileText,
      href: "/reports",
    },
    {
      title: "Browse Projects",
      description: "View and manage your projects",
      icon: FolderOpen,
      href: "/projects",
    },
  ]

  const adminActions: QuickAction[] = [
    {
      title: "Manage Users",
      description: "Add, edit, or remove user accounts",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "System Settings",
      description: "Configure application settings",
      icon: Activity,
      href: "/admin/settings",
    },
  ]

  const managerActions: QuickAction[] = [
    {
      title: "Team Overview",
      description: "View your team's performance",
      icon: Users,
      href: "/team",
    },
  ]

  switch (role) {
    case "admin":
      return [...adminActions, ...commonActions]
    case "manager":
      return [...managerActions, ...commonActions]
    default:
      return commonActions
  }
}

// Recent activity items for demo
const defaultRecentItems = [
  {
    id: "1",
    title: "Project Alpha updated",
    description: "New milestone completed",
    time: "2 hours ago",
    type: "project",
  },
  {
    id: "2",
    title: "New team member",
    description: "Sarah joined the team",
    time: "5 hours ago",
    type: "team",
  },
  {
    id: "3",
    title: "Report generated",
    description: "Monthly analytics ready",
    time: "Yesterday",
    type: "report",
  },
]

export function DashboardHomePage({
  user = { name: "User", role: "user" },
  metrics = defaultMetrics,
  quickActions,
  recentItems = defaultRecentItems,
  onNavigate,
}: DashboardHomePageProps) {
  const role = user.role || "user"
  const actions = quickActions || getQuickActions(role)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">Admin</Badge>
      case "manager":
        return <Badge variant="secondary">Manager</Badge>
      default:
        return null
    }
  }

  const handleActionClick = (action: QuickAction) => {
    if ("onClick" in action && action.onClick) {
      action.onClick()
    } else if (action.href && onNavigate) {
      onNavigate(action.href)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={`${getGreeting()}, ${user.name || "User"}`}
        actions={
          <div className="flex items-center gap-2">
            {getRoleBadge()}
            <Button>
              <Plus strokeWidth={ICON_STROKE_WIDTH} className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4 space-y-8">
          {/* Metrics Overview */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => {
                // Ensure required props are present
                if (!metric.change || !metric.trend) {
                  return null
                }
                return (
                  <MetricCard
                    key={metric.title}
                    title={metric.title}
                    value={metric.value}
                    change={metric.change}
                    trend={metric.trend}
                    icon={metric.icon}
                  />
                )
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <Card
                    key={action.title}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => handleActionClick(action)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-primary" />
                        </div>
                        <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {recentItems.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {recentItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-muted p-2">
                            <FileText strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                variant="no-data"
                title="No recent activity"
                description="Your recent activity will appear here."
              />
            )}
          </section>

          {/* Role-specific content */}
          {role === "admin" && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Admin Tools</h2>
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    All systems operational. Last checked 5 minutes ago.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Database: Healthy
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      API: Operational
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Storage: 45% used
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  )
}
