# Page Templates

This directory contains standard page templates that serve as references and starting points for creating new pages.

## Available Templates

### Authentication Pages

| Template | Description |
|----------|-------------|
| **LoginPage.tsx** | Email/password login with Google OAuth option |
| **SignupPage.tsx** | User registration with terms acceptance |
| **PasswordResetPage.tsx** | Password recovery via email |

### Error & Status Pages

| Template | Description |
|----------|-------------|
| **NotFoundPage.tsx** | 404 error page with navigation options |
| **ServerErrorPage.tsx** | 500 server error page with retry action |
| **MaintenancePage.tsx** | Scheduled maintenance page with status info |

### Landing & Home Pages

| Template | Description |
|----------|-------------|
| **LandingPage.tsx** | Public marketing/product landing page |
| **DashboardHomePage.tsx** | Role-aware dashboard with metrics and quick actions |
| **StarterPage.tsx** | Template starter page with getting started guide |

## Usage

Import templates from the index file:

```tsx
import { 
  LoginPage, 
  SignupPage,
  NotFoundPage,
  ServerErrorPage,
  LandingPage,
  DashboardHomePage,
} from "@/pages/templates"
```

### Example: Setting Up Routes

```tsx
// app/router.tsx
import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layouts/app-shell"
import { 
  LoginPage, 
  SignupPage, 
  NotFoundPage,
  LandingPage,
  DashboardHomePage,
} from "@/pages/templates"

export const router = createBrowserRouter([
  // Public landing page
  { path: "/", element: <LandingPage /> },
  
  // Protected routes (after login)
  {
    element: <AppShell />,
    children: [
      { path: "/dashboard", element: <DashboardHomePage user={currentUser} /> },
    ],
  },
  
  // Auth routes
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  
  // Error routes
  { path: "*", element: <NotFoundPage /> },
])
```

## Template Props

### LoginPage

```tsx
<LoginPage
  onLogin={(email, password) => handleLogin(email, password)}
  onGoogleLogin={() => handleGoogleLogin()}
  showSignupLink={true}
  signupLink="/signup"
  logoText="My App"
/>
```

### DashboardHomePage

```tsx
<DashboardHomePage
  user={{ name: "John", role: "admin" }}
  metrics={[
    { title: "Revenue", value: "$45k", change: "+12%", trend: "up" },
  ]}
  onNavigate={(path) => navigate(path)}
/>
```

### ServerErrorPage

```tsx
<ServerErrorPage
  title="Something went wrong"
  onRetry={() => window.location.reload()}
  homeButton={{ href: "/", label: "Go Home" }}
/>
```

### MaintenancePage

```tsx
<MaintenancePage
  estimatedTime="2 hours"
  statusPageUrl="https://status.example.com"
  supportEmail="support@example.com"
/>
```

## Documentation

For detailed documentation, see:
- [Implementation Guide](../../../.cursor/implementation/02-page-creation.md)
- [Creating Pages Guide](../../../docs/creating-pages.md)
- [Page Templates Documentation](../../../docs/page-templates.md)

## Customization

All templates are fully customizable via props. See individual template files for prop definitions and JSDoc comments.

## Guidelines

When using templates:
1. Copy and customize templates rather than modifying them directly
2. Maintain accessibility features
3. Follow design system guidelines
4. Use TypeScript types provided
5. Update documentation if creating new patterns
