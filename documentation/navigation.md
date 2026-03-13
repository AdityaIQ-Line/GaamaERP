# Navigation Patterns

This guide covers navigation patterns and best practices following shadcn/ui standards for React applications.

## Table of Contents

- [Navigation Principles](#navigation-principles)
- [Back Button Pattern](#back-button-pattern)
- [Breadcrumb Navigation](#breadcrumb-navigation)
- [Page Tabs Navigation](#page-tabs-navigation)
- [Sidebar Navigation](#sidebar-navigation)
- [CTA Patterns](#cta-patterns)
- [Navigation State](#navigation-state)

## Navigation Principles

### 1. **Predictable Navigation**
Users should always know where they are and how to get back.

### 2. **Consistent Patterns**
Use the same navigation patterns throughout your application.

### 3. **Clear Visual Hierarchy**
Primary actions should be visually prominent.

### 4. **Accessible Navigation**
All navigation must be keyboard accessible and screen-reader friendly.

## Back Button Pattern

### Standard Back Button

Use the `BackButton` component for navigating to the previous page:

```tsx
import { BackButton } from "@/components/blocks/back-button"

export function MyPage() {
  return (
    <div>
      <BackButton />
      {/* Page content */}
    </div>
  )
}
```

### Back Button with Custom Destination

Specify a custom destination instead of browser history:

```tsx
<BackButton href="/dashboard" label="Back to Dashboard" />
```

### Back Button in Page Header

Use the `PageHeaderWithBack` pattern for pages with back navigation:

```tsx
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { PageShell } from "@/components/layouts/page-shell"

export function DetailPage() {
  return (
    <PageShell>
      <PageHeaderWithBack
        title="User Details"
        backButton={{
          href: "/users",
          label: "Back to Users"
        }}
      />
      {/* Page content */}
    </PageShell>
  )
}
```

### When to Use Back Button

✅ **Use back button when:**
- Navigating from list → detail views
- Navigating from parent → child pages
- In modal/drawer flows
- In multi-step forms (between steps)

❌ **Don't use back button when:**
- On top-level navigation pages
- When navigation context is unclear
- In replace navigation (where history shouldn't be used)

## Breadcrumb Navigation

### Automatic Breadcrumbs

Breadcrumbs are automatically generated from the route path:

```tsx
import { GlobalHeader } from "@/components/blocks/global-header"

export function AppShell() {
  return (
    <div>
      <GlobalHeader /> {/* Breadcrumbs included */}
      {/* Content */}
    </div>
  )
}
```

Route `/users/123/edit` generates:
```
Home > Users > User Details > Edit
```

### Custom Breadcrumbs

Provide custom breadcrumb labels:

```tsx
import { GlobalHeader } from "@/components/blocks/global-header"

const customBreadcrumbs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Project Alpha" } // Current page (no href)
]

<GlobalHeader breadcrumbs={customBreadcrumbs} />
```

### Breadcrumb Best Practices

1. **Show hierarchy**: Each level should represent a navigable parent
2. **Current page**: Last item should be the current page (not clickable)
3. **Truncate long paths**: Show first 3 levels, collapse middle items
4. **Mobile**: Hide breadcrumbs on small screens (use back button instead)

```tsx
// Responsive breadcrumbs
<Breadcrumb className="hidden md:flex">
  {/* Breadcrumb items */}
</Breadcrumb>
```

## Page Tabs Navigation

### Tabs with Content Sections

Use `PageHeaderWithTabs` for tabbed page navigation:

```tsx
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"
import { PageShell } from "@/components/layouts/page-shell"
import { useState } from "react"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <PageShell>
      <PageHeaderWithTabs
        title="Settings"
        tabs={[
          { value: "general", label: "General" },
          { value: "security", label: "Security" },
          { value: "notifications", label: "Notifications" },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "security" && <SecuritySettings />}
        {activeTab === "notifications" && <NotificationSettings />}
      </div>
    </PageShell>
  )
}
```

### Tabs with URL Sync

Sync tabs with URL search params for shareable links:

```tsx
import { useSearchParams } from "react-router-dom"

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "general"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value })
  }

  return (
    <PageHeaderWithTabs
      value={activeTab}
      onValueChange={handleTabChange}
      tabs={[...]}
    />
  )
}
```

### Nested Tabs

For complex pages, use nested tab navigation:

```tsx
export function ProjectPage() {
  return (
    <PageShell>
      {/* Primary tabs */}
      <PageHeaderWithTabs
        title="Project Alpha"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "tasks", label: "Tasks" },
          { value: "settings", label: "Settings" },
        ]}
      />

      {/* Secondary tabs within Tasks */}
      {activeTab === "tasks" && (
        <Tabs value={taskTab} onValueChange={setTaskTab}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </PageShell>
  )
}
```

## Sidebar Navigation

### Global Sidebar

Configure sidebar navigation items:

```tsx
// lib/sidebar-config.ts
export const SIDEBAR_ITEMS = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "Users",
    icon: Users,
    href: "/users",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]
```

### Active State

Sidebar automatically highlights active route:

```tsx
import { Link, useLocation } from "react-router-dom"

export function NavItem({ href, label, icon: Icon }) {
  const location = useLocation()
  const isActive = location.pathname === href

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md",
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}
```

### Nested Navigation

For hierarchical navigation:

```tsx
export const SIDEBAR_ITEMS = [
  {
    label: "Products",
    icon: Package,
    href: "/products",
    children: [
      { label: "All Products", href: "/products" },
      { label: "Categories", href: "/products/categories" },
      { label: "Inventory", href: "/products/inventory" },
    ],
  },
]
```

## CTA Patterns

### Primary Actions

Place primary CTAs in consistent locations:

#### 1. **Page Header Actions**

```tsx
<PageHeader
  title="Users"
  actions={
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add User
    </Button>
  }
/>
```

#### 2. **Empty State Actions**

```tsx
<EmptyState
  title="No users found"
  description="Get started by creating your first user"
  action={
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add User
    </Button>
  }
/>
```

#### 3. **Floating Action Button** (Mobile)

```tsx
<Button
  size="lg"
  className="fixed bottom-6 right-6 rounded-full shadow-lg md:hidden"
>
  <Plus className="h-5 w-5" />
</Button>
```

### Secondary Actions

Use dropdown menus for secondary actions:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Action Placement Guidelines

| Location | Primary CTA | Secondary Actions | Use Case |
|----------|-------------|-------------------|----------|
| **Page Header** | Top-right | Dropdown menu | List pages, dashboards |
| **Form Footer** | Bottom-right | Cancel on left | Forms, dialogs |
| **Card/Row** | Right side | Hover actions | Tables, lists |
| **Empty State** | Centered | Below primary | Empty states |
| **FAB** | Bottom-right | Hidden menu | Mobile-only |

## Navigation State

### Loading States

Show loading state during navigation:

```tsx
import { LoadingState } from "@/components/blocks/loading-state"
import { Suspense } from "react"

<Suspense fallback={<LoadingState />}>
  <LazyLoadedPage />
</Suspense>
```

### Error States

Handle navigation errors:

```tsx
import { RouteErrorBoundary } from "@/components/blocks/route-error-boundary"

// In router config
{
  path: "/users/:id",
  element: <UserDetailPage />,
  errorElement: <RouteErrorBoundary />
}
```

### Optimistic Navigation

Show immediate feedback before navigation completes:

```tsx
import { useNavigate } from "react-router-dom"
import { useState } from "react"

function UserList() {
  const navigate = useNavigate()
  const [navigating, setNavigating] = useState(false)

  const handleNavigate = async (userId: string) => {
    setNavigating(true)
    // Prefetch data or perform action
    await prefetchUserData(userId)
    navigate(`/users/${userId}`)
  }

  return (
    <div>
      {users.map(user => (
        <Button
          onClick={() => handleNavigate(user.id)}
          disabled={navigating}
        >
          {user.name}
        </Button>
      ))}
    </div>
  )
}
```

## Navigation Examples

### Example 1: List → Detail with Back Button

```tsx
// UsersPage.tsx (List)
export function UsersPage() {
  return (
    <PageShell>
      <PageHeader
        title="Users"
        actions={
          <Button onClick={() => navigate("/users/new")}>
            Add User
          </Button>
        }
      />
      <UserList />
    </PageShell>
  )
}

// UserDetailPage.tsx (Detail)
export function UserDetailPage() {
  return (
    <PageShell>
      <PageHeaderWithBack
        title="User Details"
        backButton={{ href: "/users" }}
      />
      <UserDetails />
    </PageShell>
  )
}
```

### Example 2: Tabbed Navigation with URL Sync

```tsx
export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get("view") || "overview"

  return (
    <PageShell>
      <PageHeaderWithTabs
        title="Dashboard"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "analytics", label: "Analytics" },
          { value: "reports", label: "Reports" },
        ]}
        value={tab}
        onValueChange={(value) => setSearchParams({ view: value })}
      />
      <div className="flex-1 p-6">
        {tab === "overview" && <OverviewTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </PageShell>
  )
}
```

### Example 3: Nested Navigation with Breadcrumbs

```tsx
// Route: /projects/123/tasks/456
export function TaskDetailPage() {
  const breadcrumbs = [
    { label: "Projects", href: "/projects" },
    { label: "Project Alpha", href: "/projects/123" },
    { label: "Tasks", href: "/projects/123/tasks" },
    { label: "Task #456" }, // Current page
  ]

  return (
    <PageShell>
      <GlobalHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 p-6">
        <TaskDetails />
      </div>
    </PageShell>
  )
}
```

## Best Practices

### ✅ DO

- Use consistent navigation patterns across your app
- Provide clear visual feedback for active states
- Show loading states during navigation
- Use breadcrumbs for deep hierarchies
- Implement keyboard navigation
- Test navigation on mobile devices
- Use semantic HTML (`<nav>`, `<a>`)

### ❌ DON'T

- Mix different navigation patterns inconsistently
- Use back button on top-level pages
- Nest more than 3 levels of tabs
- Hide primary CTAs in dropdowns
- Use generic "Back" text (be specific: "Back to Users")
- Navigate without user confirmation for destructive actions
- Break browser back/forward functionality

## Accessibility

### Keyboard Navigation

All navigation must be keyboard accessible:

```tsx
// Ensure all links/buttons are focusable
<Link to="/users" className="focus:ring-2 focus:ring-primary">
  Users
</Link>

// Skip navigation link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### ARIA Labels

Provide descriptive labels for navigation:

```tsx
<nav aria-label="Main navigation">
  <SidebarMenu />
</nav>

<nav aria-label="Breadcrumb">
  <Breadcrumb />
</nav>

<BackButton aria-label="Go back to user list" />
```

### Focus Management

Manage focus when navigating:

```tsx
import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

export function PageShell({ children }) {
  const location = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Focus main content on route change
    mainRef.current?.focus()
  }, [location])

  return (
    <div>
      <GlobalHeader />
      <main ref={mainRef} tabIndex={-1} className="outline-none">
        {children}
      </main>
    </div>
  )
}
```

## Resources

- [React Router Documentation](https://reactrouter.com)
- [ARIA Authoring Practices Guide - Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [shadcn/ui Navigation Components](https://ui.shadcn.com/docs/components/navigation-menu)
