# Creating Pages

This guide explains how to create new pages in the application.

## Overview

Pages in this application are React components that represent full views or screens. They are typically placed in the `src/pages` directory (or similar structure based on your routing setup).

### Gaama ERP — full-page create / generate flows

Use **[CREATE_PAGES_DESIGN_INTENT.md](./CREATE_PAGES_DESIGN_INTENT.md)** for add/create/generate screens: **IQLDS** page title + back (**`PageHeaderWithBack`**, Pattern 04), **full-width** main column with header and form/cards sharing the same **`px-6`** as list views, and form/card rules. The DOM structure (scroll wrapper, **`w-full h-full`**, **`space-y-4 px-6 py-4 h-full`** for the form stack) is spelled out in that doc **§3.3**.

### Gaama ERP — list / index pages (IQLDS)

Module list screens under **`AppShell`** use the same **default page surface** as the app chrome — **do not** tint the scrollable content column with **`bg-muted`** or **`bg-muted/40`**. Visual separation from the page comes from **`PageHeader`** (`bg-background`) and from **tables/cards**, not from a muted full-page canvas. See **[CREATE_PAGES_DESIGN_INTENT.md](./CREATE_PAGES_DESIGN_INTENT.md) §3.1** and **[Pattern 07 — Page composition](./patterns/07-page-composition.md)**.

Typical shape (matches `src/pages/gaama/*` list views):

```tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"

export function ExampleListPage() {
  return (
    <PageShell>
      <PageHeader title="Example Master" actions={/* … */} />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* filters, table, empty states */}
      </div>
    </PageShell>
  )
}
```

For layout context (sidebar + main), see **[page-layouts.md](./page-layouts.md)** § IQLine / Gaama page body.

## Basic Page Structure

A basic page component should follow this structure:

```tsx
import { ComponentName } from "@/components/ui/component-name"

export default function PageName() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Page Title</h1>
      {/* Page content */}
    </div>
  )
}
```

## Page Layout Patterns

### Standard Page Layout

```tsx
import { Separator } from "@/components/ui/separator"

export default function StandardPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-muted-foreground mt-2">Page description</p>
      </div>
      <Separator />
      <div>
        {/* Main content */}
      </div>
    </div>
  )
}
```

### Page with Sidebar

```tsx
import { Sidebar } from "@/components/ui/sidebar"

export default function PageWithSidebar() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Page content */}
      </main>
    </div>
  )
}
```

## Best Practices

1. **Use semantic HTML**: Use appropriate HTML elements (`<main>`, `<section>`, `<article>`, etc.)
2. **Consistent spacing**: Use Tailwind spacing utilities consistently
3. **Responsive design**: Ensure pages work on mobile, tablet, and desktop
4. **Accessibility**: Include proper ARIA labels and semantic structure
5. **Loading states**: Handle loading and error states appropriately

## Page Templates

The project includes standard page templates that can be used as references or starting points. These templates are located in `src/pages/templates/` and follow all design system guidelines.

### Available Templates

1. **LoginPage** - Authentication login page with email/password fields
2. **SignupPage** - User registration page with form validation
3. **PasswordResetPage** - Password recovery page with email input
4. **DefaultPageWithSidebar** - Standard dashboard layout with sidebar navigation and header
5. **PageWithTable** - Data table page with search and actions

### Using Templates

Import and use templates directly:

```tsx
import { LoginPage } from "@/pages/templates"

export default function Login() {
  return (
    <LoginPage
      onLogin={(email, password) => {
        // Handle login
      }}
      showSignupLink={true}
      signupLink="/signup"
    />
  )
}
```

### Customizing Templates

All templates accept props for customization:

```tsx
import { DefaultPageWithSidebar } from "@/pages/templates"

export default function Dashboard() {
  return (
    <DefaultPageWithSidebar
      pageTitle="Dashboard"
      pageDescription="Overview of your account"
      sidebarItems={[
        { label: "Home", icon: HomeIcon, href: "/" },
        { label: "Settings", icon: SettingsIcon, href: "/settings" },
      ]}
    >
      <div>Your dashboard content</div>
    </DefaultPageWithSidebar>
  )
}
```

### Template Structure

Templates follow this structure:
- TypeScript with proper typing
- Accessible markup (ARIA labels, semantic HTML)
- Responsive design (mobile-first)
- Loading and error states
- Consistent spacing and styling
- Customizable via props

## Examples

See `src/pages/templates/` for complete page template implementations.

