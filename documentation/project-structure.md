# Project Structure

Complete guide to the project folder structure and organization.

## Folder Structure

```
iqlds/
├── .cursor/
│   └── README.md                 # References to main documentation
├── .github/
│   └── workflows/
│       └── sync-template.yml    # Auto-sync main → template branch
├── documentation/                # Main documentation (you are here)
│   ├── README.md
│   ├── getting-started.md
│   ├── project-structure.md
│   ├── architecture.md
│   ├── components.md
│   ├── navigation.md
│   └── ...
├── src/
│   ├── app/
│   │   ├── App.tsx              # Root component with providers
│   │   └── router.tsx           # React Router configuration
│   ├── assets/                   # Static assets (logos, images)
│   ├── components/
│   │   ├── ui/                  # Primitives (60+ components)
│   │   ├── blocks/              # Reusable sections
│   │   ├── layouts/             # Structural composition
│   │   └── patterns/            # Repeatable compositions
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and configuration
│   ├── pages/                    # Page components
│   │   ├── StarterPage.tsx
│   │   └── templates/           # Page templates
│   ├── styles/                   # Theme CSS files
│   └── index.css                # Global styles and CSS variables
├── package.json
├── components.json               # shadcn/ui configuration
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Core Directories

### `src/components/` - Component Library

The component library follows a clear hierarchy:

#### **`ui/`** - Primitives Only
Atomic components from shadcn/ui. No layout, routing, or business logic.

```
ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── dialog.tsx
├── tabs.tsx
└── ... (60+ components)
```

**Rules:**
- Only UI primitives
- No imports from blocks, layouts, or patterns
- No routing or navigation logic
- Self-contained with minimal dependencies

#### **`blocks/`** - Reusable Sections
Complex UI sections that can be reused across pages.

```
blocks/
├── global-header.tsx          # App header with breadcrumbs
├── global-sidebar.tsx         # App sidebar navigation
├── global-footer.tsx          # App footer
├── page-header.tsx            # Page title and actions
├── page-tabs.tsx              # Tabbed navigation
├── data-table.tsx             # Table with sorting/filtering
├── metric-card.tsx            # Dashboard metrics
├── empty-state.tsx            # Empty state placeholder
├── error-state.tsx            # Error display
└── ...
```

**Rules:**
- Can import from `ui/`
- Can contain business logic
- May handle user interactions
- Cannot import from layouts or patterns

#### **`layouts/`** - Structural Composition
Page structure and layout components.

```
layouts/
├── app-shell.tsx              # Application frame
├── page-shell.tsx             # Page container
├── two-column-layout.tsx      # Master-detail pattern
├── three-column-layout.tsx    # IDE-style layout
├── split-layout.tsx           # Resizable split panes
└── page-with-properties.tsx   # Page + right properties panel
```

**Rules:**
- Can import from `ui/` and `blocks/`
- Define page structure
- Handle responsive behavior
- Cannot contain business logic

#### **`patterns/`** - Repeatable Compositions
Common combinations of blocks and layouts.

```
patterns/
├── page-header-with-back.tsx  # Header with back button
└── page-header-with-tabs.tsx  # Header with tab navigation
```

**Rules:**
- Can import from `ui/`, `blocks/`, and `layouts/`
- Combine multiple components
- Provide common UX patterns
- Minimal logic, mostly composition

### `src/app/` - Application Configuration

```
app/
├── App.tsx                     # Root component
│   └── Providers (Theme, Router)
└── router.tsx                  # Route definitions
```

**App.tsx** - Root component with providers:
- `ThemeProvider` - Dark mode support
- `SidebarProvider` - Sidebar state management
- `RouterProvider` - React Router
- `Toaster` - Toast notifications

**router.tsx** - Route configuration:
- Route definitions
- Lazy loading
- Error boundaries
- Nested routes

### `src/pages/` - Page Components

```
pages/
├── HomePage.tsx                # Main landing/home page
├── StarterPage.tsx             # Template starter page
└── templates/                  # Page templates
    ├── LoginPage.tsx
    ├── SignupPage.tsx
    ├── DashboardPage.tsx
    └── ...
```

**Rules:**
- Pages compose layouts, blocks, and patterns
- Pages don't define layout rules
- Pages handle route-specific logic
- Named with `PascalCase.tsx`

### `src/lib/` - Utilities and Configuration

```
lib/
├── utils.ts                    # Utility functions (cn, etc.)
├── constants.ts                # Constants (icon width, etc.)
├── navigation.ts               # Navigation utilities
└── sidebar-config.ts           # Sidebar navigation config
```

### `src/hooks/` - Custom React Hooks

```
hooks/
├── use-mobile.ts               # Mobile detection
└── ... (add your custom hooks)
```

## Component Hierarchy

### Layer Model

```
Layer 1: AppShell               (application frame)
  └─ Layer 2: PageShell         (page container)
     └─ Layer 3: Layouts        (TwoColumnLayout, etc.)
        └─ Layer 4: Blocks      (PageHeader, DataTable, etc.)
           └─ Layer 5: UI       (Button, Card, etc.)
```

**Import Rules:**
- Each layer can only import from layers below it
- Never import upward in the hierarchy
- Pages can import from any layer

### Example: Building a User Management Page

```tsx
// 1. Page composes everything
export function UsersPage() {
  return (
    <PageShell>                      {/* Layer 2: Layout */}
      <PageHeader                    {/* Layer 4: Block */}
        title="Users"
        actions={<Button>Add</Button>}  {/* Layer 5: UI */}
      />
      <div className="flex-1 p-6">
        <DataTable                   {/* Layer 4: Block */}
          data={users}
          columns={columns}
        />
      </div>
    </PageShell>
  )
}
```

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| UI Components | `kebab-case.tsx` | `button.tsx`, `card.tsx` |
| Blocks | `kebab-case.tsx` | `page-header.tsx`, `data-table.tsx` |
| Layouts | `kebab-case.tsx` | `app-shell.tsx`, `two-column-layout.tsx` |
| Patterns | `kebab-case.tsx` | `page-header-with-tabs.tsx` |
| Pages | `PascalCase.tsx` | `DashboardPage.tsx`, `SettingsPage.tsx` |
| Utilities | `kebab-case.ts` | `utils.ts`, `sidebar-config.ts` |
| Hooks | `use-*.ts` | `use-mobile.ts`, `use-auth.ts` |

## Import Paths

```tsx
// UI Primitives
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

// Blocks
import { PageHeader } from "@/components/blocks/page-header"
import { DataTable } from "@/components/blocks/data-table"

// Layouts
import { AppShell } from "@/components/layouts/app-shell"
import { PageShell } from "@/components/layouts/page-shell"
import { TwoColumnLayout } from "@/components/layouts/two-column-layout"

// Patterns
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

// Utilities
import { cn } from "@/lib/utils"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { generateBreadcrumbs } from "@/lib/navigation"

// Hooks
import { useMobile } from "@/hooks/use-mobile"
```

## Project Scale Patterns

Choose your structure based on project size:

### Simple Projects (1-5 pages)

```
src/
├── pages/
│   ├── HomePage.tsx
│   ├── DashboardPage.tsx
│   └── SettingsPage.tsx
```

Flat structure, minimal abstraction.

### Feature-Based (5-20 pages)

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── routes.tsx
│   ├── dashboard/
│   └── users/
```

Feature-based organization with dedicated folders.

### Module-Based (20+ pages)

```
src/
├── modules/
│   ├── core/
│   │   ├── auth/
│   │   └── dashboard/
│   ├── products/
│   │   ├── admin/
│   │   ├── user/
│   │   └── shared/
```

Domain-driven with role-based access control.

See [architecture.md](./architecture.md) for detailed patterns.

## Best Practices

### 1. **Colocation**
Keep related files together:
```
features/users/
├── components/UserCard.tsx
├── pages/UsersPage.tsx
├── services/users.service.ts
└── types.ts
```

### 2. **Barrel Exports**
Use `index.ts` for clean imports:
```tsx
// components/ui/index.ts
export { Button } from "./button"
export { Card, CardHeader, CardContent } from "./card"

// Usage
import { Button, Card } from "@/components/ui"
```

### 3. **Consistent Naming**
- Components: Descriptive nouns (`UserCard`, `PageHeader`)
- Utilities: Verb-based (`formatDate`, `validateEmail`)
- Hooks: `use` prefix (`useAuth`, `useUsers`)

### 4. **Avoid Deep Nesting**
Keep folder depth ≤ 4 levels:
```
✅ src/components/blocks/page-header.tsx
❌ src/components/blocks/headers/page/page-header.tsx
```

## Configuration Files

### `components.json`
shadcn/ui configuration:
```json
{
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### `tsconfig.json`
Path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Documentation Structure

```
documentation/
├── README.md                   # Documentation index
├── getting-started.md          # Installation and setup
├── project-structure.md        # This file
├── architecture.md             # Architecture patterns
├── components.md               # Component guide
├── navigation.md               # Navigation patterns
├── creating-pages.md           # Page creation guide
├── page-layouts.md             # Layout patterns
└── design-system.md            # Design tokens
```

## Related Resources

- [Architecture Patterns](./architecture.md)
- [Component Guide](./components.md)
- [Navigation Patterns](./navigation.md)
- [Getting Started](./getting-started.md)
