# Project Architecture Guide
## Client-Side Structuring for Multiple Project Types

This document defines **industry-standard client-side architectures** for different project types, scales, and complexity levels. Use this to choose the right structure when creating new projects from the IQLine design system template.

---

## Executive Summary

Choose your architecture based on:

| Factor | Architecture |
|--------|---|
| **Scale**: Small (1-3 pages) | Simple |
| **Scale**: Medium (5-20 pages) | Feature-Based Modular |
| **Scale**: Large (20+ pages), Multi-team | Module-Based Monolithic |
| **Complexity**: Many roles/permissions | Role-Based Feature Isolation |
| **Complexity**: Many data domains | Domain-Driven Design |
| **Scalability**: Will grow significantly | Module-Based + Lazy Loading |

---

## 1. Simple Architecture
### For: Small dashboards, tools, marketing sites, MVPs

**Use When:**
- Single product/feature
- 1-5 pages total
- One team (1-3 developers)
- No complex permissions
- Quick time-to-market

**Client Folder Structure:**

```
src/
├─ app/
│  ├─ App.tsx
│  └─ router.tsx
├─ components/
│  ├─ ui/          # shadcn primitives
│  ├─ blocks/      # reusable sections
│  ├─ layouts/     # page layouts
│  └─ patterns/    # composition recipes
├─ pages/
│  ├─ HomePage.tsx
│  ├─ DashboardPage.tsx
│  ├─ SettingsPage.tsx
│  └─ NotFoundPage.tsx
├─ hooks/
│  └─ use-mobile.ts
├─ lib/
│  ├─ utils.ts
│  ├─ constants.ts
│  ├─ api.ts            # API calls
│  └─ store.ts          # Global state (if needed)
├─ styles/
│  └─ index.css
└─ main.tsx
```

**Key Characteristics:**
- Flat pages structure
- Minimal abstractions
- All logic in pages or hooks
- Single global state store (if any)

**Example Router:**

```tsx
// app/router.tsx
export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "*", element: <NotFoundPage /> },
])
```

**When to Upgrade:**
- Reach 10+ pages → Switch to Feature-Based
- Multiple teams → Switch to Module-Based
- Complex permissions → Add Role Isolation layer

---

## 2. Feature-Based Modular Architecture
### For: Medium dashboards, SaaS platforms, B2B tools (5-20 pages)

**Use When:**
- Multiple related features
- 5-20 pages total
- Small-medium team (3-8 developers)
- Some shared business logic
- Moderate complexity

**Client Folder Structure:**

```
src/
├─ app/
│  ├─ App.tsx
│  ├─ router.tsx              # Aggregates all feature routes
│  └─ root-error-boundary.tsx
├─ components/
│  ├─ ui/                     # Shared UI primitives
│  ├─ blocks/                 # Shared blocks
│  ├─ layouts/                # Shared layouts
│  └─ patterns/               # Shared patterns
├─ features/                  # ← ORGANIZATION BY FEATURE
│  ├─ auth/
│  │  ├─ components/          # Auth-only components
│  │  │  ├─ LoginForm.tsx
│  │  │  └─ RegisterForm.tsx
│  │  ├─ hooks/
│  │  │  └─ useAuth.ts
│  │  ├─ services/
│  │  │  └─ auth.service.ts
│  │  ├─ pages/
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ RegisterPage.tsx
│  │  │  └─ PasswordResetPage.tsx
│  │  ├─ routes.tsx           # Auth feature routes
│  │  └─ types.ts             # Auth types
│  │
│  ├─ dashboard/
│  │  ├─ components/
│  │  │  ├─ DashboardHeader.tsx
│  │  │  ├─ StatsCard.tsx
│  │  │  └─ RecentActivity.tsx
│  │  ├─ hooks/
│  │  │  ├─ useDashboardData.ts
│  │  │  └─ useDashboardStats.ts
│  │  ├─ services/
│  │  │  └─ dashboard.service.ts
│  │  ├─ pages/
│  │  │  └─ DashboardPage.tsx
│  │  ├─ routes.tsx
│  │  └─ types.ts
│  │
│  ├─ users/
│  │  ├─ components/
│  │  │  ├─ UserList.tsx
│  │  │  ├─ UserForm.tsx
│  │  │  └─ UserCard.tsx
│  │  ├─ hooks/
│  │  │  ├─ useUsers.ts
│  │  │  └─ useUserForm.ts
│  │  ├─ services/
│  │  │  └─ users.service.ts
│  │  ├─ pages/
│  │  │  ├─ UsersPage.tsx
│  │  │  └─ UserDetailPage.tsx
│  │  ├─ routes.tsx
│  │  └─ types.ts
│  │
│  └─ settings/
│     ├─ components/
│     ├─ hooks/
│     ├─ services/
│     ├─ pages/
│     ├─ routes.tsx
│     └─ types.ts
│
├─ shared/                    # ← SHARED ACROSS FEATURES
│  ├─ api/
│  │  └─ client.ts            # API client configuration
│  ├─ store/
│  │  ├─ index.ts
│  │  └─ slices/
│  │     ├─ auth.slice.ts
│  │     └─ ui.slice.ts
│  ├─ hooks/
│  │  └─ use-mobile.ts
│  ├─ utils/
│  │  ├─ utils.ts
│  │  └─ constants.ts
│  └─ types/
│     ├─ api.ts
│     └─ common.ts
│
├─ lib/
│  ├─ sidebar-config.ts
│  └─ navigation.ts
├─ styles/
│  └─ index.css
└─ main.tsx
```

**Feature Structure Pattern:**

Each feature has:
```
feature-name/
├─ components/      # Feature-specific UI
├─ hooks/          # Feature-specific logic
├─ services/       # API calls (feature domain)
├─ pages/          # Route pages
├─ routes.tsx      # Route definitions
├─ types.ts        # TypeScript types
└─ index.ts        # Public exports
```

**Example Feature Routes:**

```tsx
// features/dashboard/routes.tsx
import { DashboardPage } from "./pages/DashboardPage"

export const dashboardRoutes = {
  path: "/dashboard",
  element: <DashboardPage />,
  children: [
    { path: "", element: <DashboardOverview /> },
    { path: "analytics", element: <DashboardAnalytics /> },
  ],
}

// features/users/routes.tsx
import { UsersPage, UserDetailPage } from "./pages"

export const usersRoutes = {
  path: "/users",
  element: <UsersPage />,
  children: [
    { path: ":userId", element: <UserDetailPage /> },
  ],
}
```

**Main Router Aggregation:**

```tsx
// app/router.tsx
import { dashboardRoutes } from "@/features/dashboard/routes"
import { usersRoutes } from "@/features/users/routes"
import { authRoutes } from "@/features/auth/routes"
import { AppShell } from "@/components/layouts/app-shell"

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [dashboardRoutes, usersRoutes],
  },
  authRoutes,
  { path: "*", element: <NotFoundPage /> },
])
```

**Key Principles:**

1. **Feature isolation**: Each feature owns its components, logic, and pages
2. **Shared primitives**: `components/` has only UI primitives, shared blocks, layouts
3. **Service layer**: Each feature has services for API calls (not scattered in components)
4. **Colocation**: Feature files live together
5. **Cross-feature imports**: Allowed from `shared/` only, feature-to-feature is avoided
6. **Route aggregation**: Router imports from each feature's `routes.tsx`

**Benefits:**
- Scales to 15-20 pages easily
- Clear ownership per feature
- Easy to remove entire features
- Parallel development possible
- Reusable blocks/components

**When to Upgrade:**
- 20+ pages → Module-Based
- Multiple teams → Module-Based with namespacing
- Complex permissions → Add RBAC layer

---

## 3. Module-Based Monolithic Architecture
### For: Large dashboards, enterprise platforms, multi-tenant systems (20+ pages, multi-team)

**Use When:**
- 20+ pages total
- Multiple distinct business domains
- 5+ development teams
- Role-based access control required
- Large codebase (1000+ components)

**Client Folder Structure:**

```
src/
├─ app/
│  ├─ App.tsx
│  ├─ router.tsx              # Master router
│  ├─ permission-guard.tsx    # RBAC wrapper
│  └─ root-error-boundary.tsx
│
├─ components/                # ← GLOBAL COMPONENT LIBRARY
│  ├─ ui/                     # Primitives
│  ├─ blocks/                 # Shared blocks
│  ├─ layouts/                # Shared layouts
│  └─ patterns/               # Shared patterns
│
├─ modules/                   # ← ORGANIZATION BY BUSINESS DOMAIN
│  ├─ core/                   # Core functionality (always included)
│  │  ├─ auth/
│  │  │  ├─ components/
│  │  │  ├─ services/
│  │  │  ├─ hooks/
│  │  │  ├─ pages/
│  │  │  ├─ routes.tsx
│  │  │  └─ types.ts
│  │  ├─ dashboard/
│  │  │  ├─ components/
│  │  │  ├─ services/
│  │  │  ├─ pages/
│  │  │  ├─ routes.tsx
│  │  │  └─ types.ts
│  │  └─ shared/
│  │     ├─ hooks/
│  │     ├─ services/
│  │     └─ types/
│  │
│  ├─ products/               # Domain: Product Management
│  │  ├─ admin/               # RBAC: Only admins access
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  │  ├─ ProductCreatePage.tsx
│  │  │  │  ├─ ProductEditPage.tsx
│  │  │  │  └─ ProductCatalogPage.tsx
│  │  │  ├─ services/
│  │  │  ├─ routes.tsx        # /admin/products/*
│  │  │  └─ types.ts
│  │  │
│  │  ├─ user/                # RBAC: Users access
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  │  └─ ProductListPage.tsx
│  │  │  ├─ services/
│  │  │  ├─ routes.tsx        # /products/*
│  │  │  └─ types.ts
│  │  │
│  │  ├─ shared/              # Shared within products module
│  │  │  ├─ components/
│  │  │  │  ├─ ProductCard.tsx
│  │  │  │  └─ ProductFilters.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useProducts.ts
│  │  │  ├─ services/
│  │  │  │  └─ products.service.ts
│  │  │  └─ types.ts
│  │  │
│  │  └─ index.ts             # Module exports
│  │
│  ├─ orders/                 # Domain: Orders
│  │  ├─ admin/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ routes.tsx
│  │  │  └─ types.ts
│  │  ├─ user/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ routes.tsx
│  │  │  └─ types.ts
│  │  ├─ shared/
│  │  │  ├─ hooks/
│  │  │  ├─ services/
│  │  │  └─ types.ts
│  │  └─ index.ts
│  │
│  ├─ analytics/              # Domain: Analytics
│  │  ├─ manager/             # RBAC: Only managers
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ routes.tsx
│  │  │  └─ types.ts
│  │  ├─ shared/
│  │  │  ├─ hooks/
│  │  │  ├─ services/
│  │  │  └─ types.ts
│  │  └─ index.ts
│  │
│  ├─ users/                  # Domain: User Management
│  │  ├─ admin/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ routes.tsx
│  │  │  └─ types.ts
│  │  ├─ shared/
│  │  │  ├─ hooks/
│  │  │  ├─ services/
│  │  │  └─ types.ts
│  │  └─ index.ts
│  │
│  └─ settings/               # Domain: System Settings
│     ├─ admin/
│     │  ├─ components/
│     │  ├─ pages/
│     │  ├─ routes.tsx
│     │  └─ types.ts
│     ├─ user/
│     │  ├─ components/
│     │  ├─ pages/
│     │  ├─ routes.tsx
│     │  └─ types.ts
│     ├─ shared/
│     │  ├─ hooks/
│     │  ├─ services/
│     │  └─ types.ts
│     └─ index.ts
│
├─ shared/
│  ├─ api/
│  │  ├─ client.ts
│  │  └─ interceptors.ts      # Auth headers, error handling
│  ├─ store/
│  │  ├─ index.ts
│  │  └─ slices/
│  │     ├─ auth.slice.ts
│  │     ├─ ui.slice.ts
│  │     └─ permissions.slice.ts
│  ├─ hooks/
│  │  ├─ use-mobile.ts
│  │  ├─ use-permissions.ts   # ← RBAC hook
│  │  └─ use-user.ts
│  ├─ utils/
│  │  ├─ utils.ts
│  │  ├─ constants.ts
│  │  └─ permission-checker.ts # ← RBAC utility
│  ├─ guards/
│  │  ├─ role-guard.tsx       # ← RBAC guard
│  │  └─ permission-guard.tsx
│  └─ types/
│     ├─ api.ts
│     ├─ auth.ts
│     ├─ permissions.ts        # ← RBAC types
│     └─ common.ts
│
├─ lib/
│  ├─ sidebar-config.ts       # Filtered by role
│  └─ navigation.ts
├─ styles/
│  └─ index.css
└─ main.tsx
```

**Module Structure Pattern:**

```
module-name/
├─ role-1/                    # RBAC: Feature for specific role
│  ├─ components/
│  ├─ pages/
│  ├─ services/
│  ├─ routes.tsx
│  └─ types.ts
├─ role-2/
│  ├─ components/
│  ├─ pages/
│  ├─ routes.tsx
│  └─ types.ts
├─ shared/                    # Shared within module
│  ├─ components/
│  ├─ hooks/
│  ├─ services/
│  └─ types.ts
├─ index.ts                   # Module exports
└─ routes.tsx                 # Module route aggregation
```

**Example: Products Module with RBAC**

```tsx
// modules/products/shared/services/products.service.ts
export const productsService = {
  // Public endpoint
  getPublicProducts: async () => {
    return api.get("/api/v1/products")
  },
  // Admin-only endpoint
  getAll: async () => {
    return api.get("/api/v1/admin/products")
  },
  create: async (data) => {
    return api.post("/api/v1/admin/products", data)
  },
}

// modules/products/admin/pages/ProductCreatePage.tsx
export function ProductCreatePage() {
  const { mutate } = useMutation(productsService.create)
  return <ProductCreateForm onSubmit={mutate} />
}

// modules/products/user/pages/ProductListPage.tsx
export function ProductListPage() {
  const { data } = useQuery(productsService.getPublicProducts)
  return <ProductList products={data} />
}

// modules/products/admin/routes.tsx
export const productsAdminRoutes = {
  path: "/admin/products",
  element: <PermissionGuard requiredRole="admin"><Outlet /></PermissionGuard>,
  children: [
    { path: "", element: <ProductCatalogPage /> },
    { path: "create", element: <ProductCreatePage /> },
    { path: ":id/edit", element: <ProductEditPage /> },
  ],
}

// modules/products/user/routes.tsx
export const productsUserRoutes = {
  path: "/products",
  children: [
    { path: "", element: <ProductListPage /> },
    { path: ":id", element: <ProductDetailPage /> },
  ],
}

// modules/products/routes.tsx
export const productsRoutes = [
  productsAdminRoutes,
  productsUserRoutes,
]
```

**Master Router:**

```tsx
// app/router.tsx
import { productsRoutes } from "@/modules/products/routes"
import { ordersRoutes } from "@/modules/orders/routes"
import { analyticsRoutes } from "@/modules/analytics/routes"
import { usersRoutes } from "@/modules/users/routes"
import { settingsRoutes } from "@/modules/settings/routes"
import { AppShell } from "@/components/layouts/app-shell"

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RootErrorBoundary />,
    children: [
      ...productsRoutes,
      ...ordersRoutes,
      ...analyticsRoutes,
      ...usersRoutes,
      ...settingsRoutes,
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
])
```

**RBAC Implementation:**

```tsx
// shared/guards/permission-guard.tsx
interface PermissionGuardProps {
  requiredRole?: string | string[]
  requiredPermission?: string
  children: React.ReactNode
}

export function PermissionGuard({
  requiredRole,
  requiredPermission,
  children,
}: PermissionGuardProps) {
  const { user } = useAuth()
  const hasPermission = usePermissions(requiredRole, requiredPermission)

  if (!hasPermission) {
    return <UnauthorizedPage />
  }

  return <>{children}</>
}

// shared/hooks/use-permissions.ts
export function usePermissions(roles?: string | string[], permission?: string) {
  const { user } = useAuth()

  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  if (permission) {
    return user.permissions.includes(permission)
  }

  return true
}
```

**Sidebar Configuration with RBAC:**

```tsx
// lib/sidebar-config.ts
import { useAuth } from "@/shared/hooks/use-auth"

export function useSidebarItems() {
  const { user } = useAuth()

  const items = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
  ]

  // Admin-only items
  if (user.role === "admin") {
    items.push(
      { label: "Products", icon: Package, href: "/admin/products" },
      { label: "Users", icon: Users, href: "/admin/users" },
      { label: "Analytics", icon: BarChart3, href: "/analytics/manager" },
      { label: "Settings", icon: Settings, href: "/admin/settings" }
    )
  } else {
    items.push(
      { label: "My Products", icon: Package, href: "/products" },
      { label: "My Orders", icon: ShoppingCart, href: "/orders" },
      { label: "Profile", icon: User, href: "/user/settings" }
    )
  }

  return items
}
```

**Key Principles:**

1. **Domain-based modules**: Organize by business domain, not technology
2. **Role-based access**: Separate routes/components by role within each module
3. **Service layer isolation**: Each module's API calls are encapsulated
4. **Shared utilities**: RBAC hooks, guards, and stores in `shared/`
5. **Clear boundaries**: Modules don't import from each other (only `shared/`)
6. **Lazy loading**: Each module can be code-split for performance
7. **Route aggregation**: Routes defined per role, aggregated per module, composed in master router

**Benefits:**
- Scales to 100+ pages
- Clear domain ownership
- Easy to isolate roles/permissions
- Multiple teams can work independently
- Supports code-splitting and lazy loading

---

## 4. Domain-Driven Design (DDD) Architecture
### For: Complex enterprise systems with distinct business domains

**Use When:**
- Multiple independent business domains
- 50+ pages total
- Complex business logic per domain
- Domains might be owned by different teams
- Domain language is important (Ubiquitous Language)

**Client Folder Structure:**

```
src/
├─ app/
├─ components/
├─ domains/                   # ← BUSINESS DOMAINS
│  ├─ catalog/                # Domain 1: Product Catalog
│  │  ├─ entities/            # Domain models
│  │  │  ├─ Product.ts
│  │  │  └─ Category.ts
│  │  ├─ value-objects/       # Immutable value objects
│  │  │  ├─ Price.ts
│  │  │  └─ SKU.ts
│  │  ├─ repositories/        # Data access
│  │  │  ├─ ProductRepository.ts
│  │  │  └─ CategoryRepository.ts
│  │  ├─ use-cases/           # Business logic
│  │  │  ├─ SearchProducts.ts
│  │  │  ├─ CreateProduct.ts
│  │  │  └─ UpdateProduct.ts
│  │  ├─ ui/                  # UI for this domain
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ hooks/
│  │  │  └─ routes.tsx
│  │  └─ index.ts
│  │
│  ├─ order/                  # Domain 2: Order Processing
│  │  ├─ entities/
│  │  │  ├─ Order.ts
│  │  │  ├─ OrderItem.ts
│  │  │  └─ Payment.ts
│  │  ├─ value-objects/
│  │  │  ├─ OrderStatus.ts
│  │  │  └─ Currency.ts
│  │  ├─ repositories/
│  │  │  └─ OrderRepository.ts
│  │  ├─ use-cases/
│  │  │  ├─ CreateOrder.ts
│  │  │  ├─ ProcessPayment.ts
│  │  │  └─ CancelOrder.ts
│  │  ├─ ui/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ hooks/
│  │  │  └─ routes.tsx
│  │  └─ index.ts
│  │
│  ├─ user/                   # Domain 3: User Management
│  │  ├─ entities/
│  │  ├─ value-objects/
│  │  ├─ repositories/
│  │  ├─ use-cases/
│  │  ├─ ui/
│  │  └─ index.ts
│  │
│  └─ shared-kernel/          # Shared across domains
│     ├─ entities/
│     │  └─ Entity.ts         # Base class
│     ├─ value-objects/
│     │  └─ ValueObject.ts    # Base class
│     ├─ repositories/
│     │  └─ Repository.ts     # Base interface
│     ├─ events/
│     │  ├─ DomainEvent.ts
│     │  └─ EventBus.ts
│     └─ types.ts
│
├─ shared/
│  ├─ api/
│  ├─ store/
│  ├─ hooks/
│  └─ utils/
├─ lib/
├─ styles/
└─ main.tsx
```

**When to Use DDD:**
- Business logic is complex and needs isolation
- Multiple teams owning different domains
- Domains might be extracted as microservices later
- Business language is important (Ubiquitous Language)

**Note**: DDD is complex; use it only when necessary. Upgrade from Module-Based if you encounter these needs.

---

## 5. Comparison Matrix

| Criteria | Simple | Feature-Based | Module-Based | DDD |
|----------|--------|---------------|--------------|-----|
| **Pages** | 1-5 | 5-20 | 20-100 | 50+ |
| **Team Size** | 1-2 | 3-8 | 8+ | 10+ |
| **Learning Curve** | Minimal | Low | Medium | High |
| **Scalability** | Poor | Good | Excellent | Excellent |
| **RBAC Support** | Basic | Fair | Excellent | Excellent |
| **Code Reuse** | Low | High | High | Medium |
| **Flexibility** | Highest | High | Medium | Low |
| **Setup Time** | <1 hour | 2-4 hours | 4-8 hours | 8+ hours |

---

## 6. Client-Side Architecture Selection Flowchart

```
START
  │
  ├─ How many pages?
  │  ├─ 1-5 pages?
  │  │  └─→ SIMPLE ARCHITECTURE
  │  │     └─ Flat pages/
  │  │     └ No complex state management
  │  │
  │  ├─ 5-20 pages?
  │  │  ├─ Multiple related features?
  │  │  │  └─→ FEATURE-BASED MODULAR
  │  │  │     └─ features/
  │  │  │     └─ Clear feature boundaries
  │  │  │
  │  │  └─ Simple CRUD operations?
  │  │     └─→ SIMPLE ARCHITECTURE
  │  │        (stay here longer)
  │  │
  │  ├─ 20-100 pages?
  │  │  ├─ Multiple roles/permissions?
  │  │  │  └─→ MODULE-BASED MONOLITHIC
  │  │  │     └─ modules/ with role-based subfolders
  │  │  │     └─ RBAC guards and permissions
  │  │  │
  │  │  └─ Clear business domains?
  │  │     └─→ MODULE-BASED MONOLITHIC
  │  │        └─ Organize by domain
  │  │
  │  └─ 50+ pages / 10+ teams?
  │     ├─ Complex business logic?
  │     │  └─→ DOMAIN-DRIVEN DESIGN
  │     │
  │     └─ Microservices planned?
  │        └─→ DOMAIN-DRIVEN DESIGN
  │
  └─ END: Selected Architecture
```

---

## 7. Migration Paths

### Simple → Feature-Based

1. **Create features/ folder**
2. **Group pages by feature**
3. **Move feature-specific components into features/*/components/**
4. **Create feature routes in features/*/routes.tsx**
5. **Aggregate in app/router.tsx**

```bash
# Before
src/pages/UserList.tsx
src/pages/UserDetail.tsx
src/pages/UserCreate.tsx
src/components/UserCard.tsx
src/hooks/useUsers.ts

# After
src/features/users/
├─ components/UserCard.tsx
├─ hooks/useUsers.ts
├─ pages/UserList.tsx
├─ pages/UserDetail.tsx
├─ pages/UserCreate.tsx
├─ routes.tsx
└─ types.ts
```

### Feature-Based → Module-Based

1. **Create modules/ folder**
2. **Group features by business domain**
3. **Add role-based subfolders per module**
4. **Move shared logic to modules/*/shared/**
5. **Create permission guards**
6. **Aggregate routes by module**

```bash
# Before (Feature-Based)
src/features/
├─ products/
├─ orders/
├─ analytics/
└─ users/

# After (Module-Based)
src/modules/
├─ core/
│  ├─ auth/
│  ├─ dashboard/
│  └─ shared/
├─ products/
│  ├─ admin/
│  ├─ user/
│  └─ shared/
├─ orders/
│  ├─ admin/
│  ├─ user/
│  └─ shared/
└─ analytics/
   ├─ manager/
   └─ shared/
```

---

## 8. Server-Side Context (Brief Reference)

### API Design Recommendations

**RESTful vs GraphQL:**

| Approach | Client Structure | Best For |
|----------|------------------|----------|
| **REST** | Service layer per domain | Module-Based, Feature-Based |
| **GraphQL** | Centralized queries/mutations folder | DDD, Complex queries |

**Suggested Backend Structure (for context):**

```
backend/
├─ api/
│  ├─ routes/
│  │  ├─ products.routes.ts
│  │  ├─ orders.routes.ts
│  │  └─ users.routes.ts
│  └─ middleware/
│     ├─ auth.middleware.ts
│     └─ rbac.middleware.ts
├─ services/
│  ├─ ProductService.ts
│  ├─ OrderService.ts
│  └─ UserService.ts
├─ models/
│  ├─ Product.ts
│  ├─ Order.ts
│  └─ User.ts
├─ controllers/
│  ├─ ProductController.ts
│  ├─ OrderController.ts
│  └─ UserController.ts
└─ database/
   └─ migrations/
```

**Key Backend Patterns to Support Client Architecture:**

| Client Pattern | Backend Support |
|---|---|
| **Feature-Based Client** | Feature-based API routes |
| **Module-Based RBAC** | Role/permission checks in middleware |
| **Service Layer** | Domain-based endpoints `/api/v1/products`, `/api/v1/orders` |
| **Lazy Loading** | Pagination, infinite scroll endpoints |

---

## 9. Production Checklist

### Before Going to Production

- [ ] **Architecture chosen and documented** (link this guide in README)
- [ ] **Build process optimized**: Code-splitting enabled, tree-shaking working
- [ ] **Error handling**: RouteErrorBoundary and ErrorBoundary in place
- [ ] **Authentication**: Auth guards on protected routes
- [ ] **Authorization**: RBAC checks for role-based access
- [ ] **Performance**:
  - [ ] Lazy loading modules/features
  - [ ] Image optimization
  - [ ] API caching strategy
  - [ ] Bundle analysis run
- [ ] **Accessibility**: WCAG 2.1 AA minimum
- [ ] **Testing**:
  - [ ] Unit tests for hooks and utilities
  - [ ] Integration tests for features
  - [ ] E2E tests for critical flows
- [ ] **Monitoring**: Error tracking (Sentry, LogRocket, etc.)
- [ ] **Documentation**: README with architecture overview

---

## 10. Quick Start Templates

### Simple Project Template

**Create from scratch:**

```bash
npx create-vite@latest my-app -- --template react
cd my-app
npm install
mkdir -p src/{features,hooks,lib,styles}
```

### Feature-Based Template

```bash
# Use this structure
src/
├─ app/
│  ├─ App.tsx
│  └─ router.tsx
├─ components/
│  ├─ ui/
│  ├─ blocks/
│  └─ layouts/
├─ features/
│  └─ [feature-name]/
│     ├─ components/
│     ├─ hooks/
│     ├─ services/
│     ├─ pages/
│     ├─ routes.tsx
│     └─ types.ts
├─ shared/
│  ├─ api/
│  ├─ store/
│  ├─ hooks/
│  └─ utils/
└─ main.tsx
```

### Module-Based Template

```bash
# Use this structure
src/
├─ app/
├─ components/
├─ modules/
│  ├─ core/
│  │  ├─ auth/
│  │  ├─ dashboard/
│  │  └─ shared/
│  ├─ [domain-1]/
│  │  ├─ [role-1]/
│  │  ├─ [role-2]/
│  │  └─ shared/
│  └─ [domain-2]/
│     ├─ [role-1]/
│     └─ shared/
├─ shared/
└─ main.tsx
```

---

## 11. Decision Records

Document architectural decisions using this template:

```markdown
# ADR-001: Feature-Based Architecture

## Status
ACCEPTED

## Context
We have 8 pages across 3 product features with 4 developers.
Flat structure is becoming hard to maintain.

## Decision
Adopt feature-based modular architecture with:
- features/ folder organized by feature
- Shared components in components/
- Feature-specific routes in features/*/routes.tsx

## Consequences
- (+) Easier to locate feature-specific code
- (+) Can develop features independently
- (-) Slight build overhead from multiple entry points
- (-) Need discipline to avoid cross-feature imports

## Timeline
DONE: 2024-01-15
```

---

## 12. Troubleshooting Common Issues

### Issue: Features importing from other features

**Problem**: `features/users/components/UserCard.tsx` imports from `features/products/`

**Solution**:
1. Move shared component to `components/blocks/`
2. Create shared hook in `shared/hooks/`
3. Extract to `features/shared/` if domain-specific

### Issue: Large bundle size

**Problem**: All features loaded at once

**Solution**:
1. Lazy load features using React.lazy()
2. Use route-based code splitting
3. Implement module prefetching

```tsx
// Lazy load features
const DashboardFeature = React.lazy(() => 
  import("@/features/dashboard")
)

// In routes
{
  path: "/dashboard",
  element: (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardFeature />
    </Suspense>
  ),
}
```

### Issue: Unclear where to put a component

**Decision Tree**:

```
Is it a UI primitive?
├─ Yes → components/ui/
└─ No
   Is it reusable in multiple features?
   ├─ Yes → components/blocks/
   └─ No
      Is it a full page?
      ├─ Yes → features/*/pages/ or modules/*/[role]/pages/
      └─ No
         Does it layout content?
         ├─ Yes → components/layouts/
         └─ No
            Feature-specific UI?
            ├─ Yes → features/*/components/
            └─ No → shared/components/
```

---

## 13. Recommended Reading & Resources

- [Clean Code by Robert Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [React Patterns Documentation](https://react.dev/learn)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Module Federation (Micro-frontends)](https://webpack.js.org/concepts/module-federation/)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)

---

**End of Document**

Use this guide to:
1. **Choose architecture** before starting a project
2. **Document your choice** in README.md
3. **Set up folder structure** first
4. **Enforce boundaries** with linting rules
5. **Migrate gracefully** as projects grow    