# Creating Pages

This guide explains how to create new pages in the application.

## Overview

Pages in this application are React components that represent full views or screens. They are typically placed in the `src/pages` directory (or similar structure based on your routing setup).

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

