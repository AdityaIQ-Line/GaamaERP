# Pattern 01 — Application Skeleton

The app skeleton is the outermost frame that wraps every page in the application.
It is defined once, in the router, and never repeated inside individual pages.

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  GLOBAL HEADER (sticky, z-40)                                   │
│  ┌──────────────────────────────┐ ┌─────────────────────────┐   │
│  │ [≡] Breadcrumbs              │ │ Search  🔔 🌙 ⚙ Avatar  │   │
│  └──────────────────────────────┘ └─────────────────────────┘   │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ SIDE-  │  PAGE CONTENT (flex-1, overflow-auto)                 │
│  BAR   │                                                        │
│        │  ┌──────────────────────────────────────────────────┐ │
│ [Logo] │  │  PAGE HEADER (mandatory per page)                │ │
│ [Nav]  │  │  Title            Tags  [Action] [Primary CTA]   │ │
│ [Nav]  │  └──────────────────────────────────────────────────┘ │
│ [Nav]  │                                                        │
│        │  ┌──────────────────────────────────────────────────┐ │
│        │  │  Page body — cards, tables, forms, etc.          │ │
│        │  └──────────────────────────────────────────────────┘ │
│        │                                                        │
├────────┴────────────────────────────────────────────────────────┤
│  GLOBAL FOOTER                                                  │
│  © 2026 IQLine Inc. All rights reserved.                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component: `AppShell`

**File:** `src/components/layouts/app-shell.tsx`  
**Import:** `import { AppShell } from "@/components/layouts/app-shell"`

`AppShell` is a **router-level layout wrapper**. It is set as the `element` on the
root route in the router, and all app pages are its `children`. It renders:

1. `GlobalSidebar` — collapsible left navigation with tenant switcher in the header
2. `GlobalHeader` — sticky top bar (breadcrumbs, search, notifications, user menu)
3. `<main>` — the `<Outlet />` where child pages render
4. `GlobalFooter` — always-visible bottom bar
5. `CommandPalette` — mounted once globally, triggered by Ctrl+K / ⌘K

### Router setup

```tsx
// src/app/router.tsx
export const router = createBrowserRouter([
  {
    // AppShell wraps ALL main app pages
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/",          element: <HomePage /> },
      { path: "/dashboard", element: <LazyPage><DashboardPage /></LazyPage> },
      { path: "/settings",  element: <LazyPage><SettingsPage /></LazyPage> },
      // ... all other app routes
    ],
  },
  // Auth pages — NO AppShell, rendered standalone
  { path: "/login",          element: <LazyPage><LoginPage /></LazyPage> },
  { path: "/signup",         element: <LazyPage><SignupPage /></LazyPage> },
  { path: "/password-reset", element: <LazyPage><PasswordResetPage /></LazyPage> },
  // Error pages — NO AppShell
  { path: "/forbidden",      element: <LazyPage><ForbiddenPage /></LazyPage> },
  { path: "*",               element: <NotFoundPage /> },
])
```

### Props

```tsx
interface AppShellProps {
  // User displayed in the header (right side) and passed to breadcrumbs
  user?: { name: string; email: string; avatar?: string }

  // Multi-tenant workspace switching (sidebar header)
  tenants?: Tenant[]            // list of all workspaces the user can access
  currentTenant?: Tenant        // the currently selected workspace
  onTenantChange?: (t: Tenant) => void

  // Custom sidebar header override (rare — use tenants prop instead)
  sidebarHeader?: React.ReactNode

  // Global logout handler
  onLogout?: () => void

  // Manual breadcrumb override (auto-generated from URL if omitted)
  breadcrumbs?: Array<{ label: string; href?: string }>
}
```

### Minimal usage (single tenant, default user)

```tsx
<AppShell />
```

### Full usage (multi-tenant, real user)

```tsx
<AppShell
  user={{ name: "Jane Doe", email: "jane@acme.com", avatar: "/avatars/jane.png" }}
  tenants={[
    { id: "acme",    name: "Acme Corp",    plan: "Pro"  },
    { id: "staging", name: "Acme Staging", plan: "Free" },
  ]}
  currentTenant={{ id: "acme", name: "Acme Corp", plan: "Pro" }}
  onTenantChange={(t) => switchWorkspace(t.id)}
  onLogout={handleLogout}
/>
```

---

## What belongs in AppShell vs in a page

| Concern | Where it lives |
|---------|---------------|
| Sidebar navigation | `GlobalSidebar` inside `AppShell` |
| Top bar (search, bell, user) | `GlobalHeader` inside `AppShell` |
| Command palette (Ctrl+K) | `CommandPalette` inside `AppShell` — mounted once |
| Notifications state | `NotificationPanel` inside `GlobalHeader` |
| Page title | `PageHeader` inside the **page component** |
| Page actions (CTAs) | `PageHeader` actions prop inside the **page component** |
| Page tabs | `PageHeaderWithTabs` inside the **page component** |

---

## Rules

- ✅ Every regular app route must be a child of the `AppShell` route.
- ✅ Auth pages (`/login`, `/signup`, `/password-reset`) are **always** standalone — they use `AuthShell`, never `AppShell`.
- ✅ Error pages (`/forbidden`, `404`) are **always** standalone.
- ❌ Never nest another `AppShell` inside a page.
- ❌ Never add a second sidebar, header, or footer inside a page component.
- ❌ Never put page-specific breadcrumbs directly in the router — override via `breadcrumbs` prop only when auto-generation produces the wrong label.
