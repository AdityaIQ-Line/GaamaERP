# Pattern 03 — Sidebar

The sidebar is the primary navigation structure of the application.
It is rendered by `AppShell` via `GlobalSidebar` and is **never instantiated inside a page**.

---

## Visual Anatomy

```
┌───────────────────────────────┐
│  SIDEBAR HEADER               │
│  ┌─────────────────────────┐  │
│  │ [Logo] IQLine Inc  ⌄   │  │  ← TenantSwitcher (dropdown when multi-tenant)
│  └─────────────────────────┘  │
├───────────────────────────────┤
│  SIDEBAR CONTENT              │
│                               │
│  ── Main ──────────────────   │
│  🏠 Home                      │
│  📊 Dashboard                 │
│  🔍 Search                    │
│                               │
│  ── Data & Content ────────   │
│  📈 Analytics                 │
│  📄 Table                     │
│  💳 Cards                     │
│  📅 Calendar                  │
│                               │
│  ── Forms & Layouts ───────   │
│  📝 Forms                     │
│  🗂 Layouts                   │
│  ▦  Trays                     │
│                               │
│  ── Design System ─────────   │
│  🎨 Components  ▶             │  ← collapsible parent
│      ├ UI Components          │
│      ├ Themes                 │
│      └ Edge Cases             │
│  📖 Documentation             │
│                               │
│  ── Account ───────────────   │
│  👤 Profile                   │
│  ⚙  Settings  ▶              │  ← collapsible parent
│      ├ General                │
│      ├ Security               │
│      └ Notifications          │
│                               │
├───────────────────────────────┤
│  ▐ (sidebar rail — resize)    │
└───────────────────────────────┘
```

---

## File

`src/components/blocks/global-sidebar.tsx`

---

## Navigation config

All nav items are defined in **one place only**:

```
src/lib/sidebar-config.ts
```

**Never hard-code nav items inside the sidebar component itself.**

### Data types

```ts
interface SidebarItem {
  label: string
  icon: LucideIcon
  href?: string          // omit for non-navigable parents
  badge?: string         // e.g. "New" or "3"
  roles?: string[]       // empty = visible to all roles
  disabled?: boolean
  children?: SidebarItem[]
}

interface SidebarGroup {
  label: string
  items: SidebarItem[]
  roles?: string[]
}
```

### Adding a new nav item

```ts
// src/lib/sidebar-config.ts
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Home",      icon: Home,     href: "/" },
      { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
      // ✅ add new flat items here
      { label: "Reports",   icon: FileText,  href: "/reports" },
    ],
  },
  // ...
]
```

### Adding a collapsible parent

```ts
{
  label: "Analytics",
  icon: TrendingUp,
  href: "/analytics",        // optional — parent can be navigable
  children: [
    { label: "Overview", icon: BarChart3, href: "/analytics" },
    { label: "Revenue",  icon: DollarSign, href: "/analytics/revenue" },
    { label: "Users",    icon: Users,      href: "/analytics/users" },
  ],
}
```

---

## Active state detection

Active highlighting is handled by `isActiveRoute()` from `src/lib/navigation.ts`.

```ts
// Exact match (used for child items and "/" home)
isActiveRoute(pathname, "/dashboard", true)   // true only when pathname === "/dashboard"

// Prefix match (used for parent items)
isActiveRoute(pathname, "/settings")          // true for /settings, /settings/security, etc.
```

### Rules for `isActive` vs `isParentActive`

| Item type | Active when | `exact` param |
|-----------|-------------|---------------|
| Flat top-level item | exact match | `true` for `/`, `false` for all others |
| Collapsible parent | any child route is active | `false` (prefix) |
| Child sub-item | exact match | `true` |

### Home route special case

`/` must always use exact match; otherwise every path would match:

```tsx
isActiveRoute(location.pathname, item.href, item.href === "/")
//                                          ↑ exact=true only for "/"
```

---

## Collapsible nested items

Items with `children` render as a `Collapsible` group.

- The parent row opens/closes the group via `CollapsibleTrigger`
- The `ChevronRight` icon rotates 90° when open (`group-data-[state=open]/collapsible:rotate-90`)
- `defaultOpen={isParentActive}` — the group starts open when any child is active

```tsx
<Collapsible asChild defaultOpen={isParentActive} className="group/collapsible">
  <SidebarMenuItem>
    <CollapsibleTrigger asChild>
      <SidebarMenuButton isActive={isParentActive}>
        <Icon />
        <span>{item.label}</span>
        <ChevronRight className="ml-auto ... group-data-[state=open]/collapsible:rotate-90" />
      </SidebarMenuButton>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <SidebarMenuSub>
        {item.children.map((child) => (
          <SidebarMenuSubItem key={child.label}>
            <SidebarMenuSubButton asChild isActive={isChildActive}>
              <Link to={child.href}>...</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  </SidebarMenuItem>
</Collapsible>
```

---

## Mobile behaviour

On mobile the sidebar is off-canvas. Clicking any nav link must close it:

```tsx
const { isMobile, setOpenMobile } = useSidebar()

const handleNavClick = () => {
  if (isMobile) setOpenMobile(false)
}
```

Pass `onClick={handleNavClick}` to every `SidebarMenuButton` and `SidebarMenuSubButton` that has an `href`.

---

## Collapsed (icon-only) mode

The sidebar supports `collapsible="icon"` — shrinks to show icons only.

When collapsed, text labels and the tenant name/plan/chevron are hidden via:

```
group-data-[collapsible=icon]:hidden
group-data-[collapsible=icon]:opacity-0
group-data-[collapsible=icon]:max-w-0
```

Always set `tooltip={item.label}` on every `SidebarMenuButton` so the label appears on hover when collapsed.

---

## Tenant Switcher

The sidebar header slot is occupied by `TenantSwitcher`.

### When to show

| Scenario | Behaviour |
|----------|-----------|
| No `tenants` prop / single tenant | Plain logo link — navigates to `/` |
| `tenants.length > 1` | Dropdown with full tenant list |

### Tenant interface

```ts
export interface Tenant {
  id: string
  name: string
  plan?: string            // e.g. "Free", "Pro" — shown as badge in dropdown
  logo?: React.ReactNode  // custom SVG/image; defaults to app LogoIcon
}
```

### Passing tenants through AppShell

```tsx
// src/app/router.tsx — root element
<AppShell
  tenants={[
    { id: "acme",    name: "Acme Corp",    plan: "Pro"  },
    { id: "staging", name: "Acme Staging", plan: "Free" },
  ]}
  currentTenant={{ id: "acme", name: "Acme Corp", plan: "Pro" }}
  onTenantChange={(t) => switchWorkspace(t.id)}
/>
```

`AppShell` forwards these props to `GlobalSidebar → TenantSwitcher`.

### Dropdown behaviour

- Shows all tenants in a list; active tenant gets a `Check` icon
- Each tenant row: mini-logo + name + plan badge
- "Add workspace" option at the bottom (separator above it)
- Collapsed sidebar hides the name/plan/chevron — logo icon only

### Custom sidebar header override

For rare cases where the tenant switcher is not appropriate:

```tsx
<AppShell
  sidebarHeader={<MyCustomHeader />}
/>
```

---

## Role-based filtering

```ts
import { filterSidebarGroupsByRole } from "@/lib/sidebar-config"

const visibleGroups = filterSidebarGroupsByRole(SIDEBAR_GROUPS, user.role)
```

Pass `visibleGroups` to `GlobalSidebar` if you need to hide groups/items by role.
(The default `GlobalSidebar` renders all groups without filtering.)

---

## SidebarRail

`<SidebarRail />` at the bottom of the sidebar renders the drag-to-resize handle.
Always keep it — do not remove.

---

## Props

```tsx
interface GlobalSidebarProps {
  sidebarHeader?: React.ReactNode   // fully replaces TenantSwitcher
  tenants?: Tenant[]
  currentTenant?: Tenant
  onTenantChange?: (tenant: Tenant) => void
}
```

---

## Rules

- ✅ All nav items live in `SIDEBAR_GROUPS` in `src/lib/sidebar-config.ts`.
- ✅ Call `setOpenMobile(false)` on every nav click when `isMobile` is true.
- ✅ Use `tooltip={item.label}` on every `SidebarMenuButton`.
- ✅ The tenant switcher goes in the sidebar **header** — user info goes in the **global header** only.
- ✅ When adding a collapsible parent, set `defaultOpen={isParentActive}`.
- ❌ Never put the user avatar, name, or logout button in the sidebar footer.
- ❌ Never import `GlobalSidebar` from a page component — it lives in `AppShell` only.
- ❌ Never hard-code nav items inside `global-sidebar.tsx`.
