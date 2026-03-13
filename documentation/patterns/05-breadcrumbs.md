# Pattern 05 — Breadcrumbs

Breadcrumbs are **auto-generated from the current URL** and displayed in the global header on desktop.
You almost never need to do anything — they just work.

---

## Where breadcrumbs live

Breadcrumbs are rendered by `GlobalHeader`, which is part of `AppShell`.
They appear on desktop only (`hidden md:flex`). On mobile they are replaced by the current page title.

```
GlobalHeader → left zone → <Breadcrumb> component
                            ↑ auto-generated from location.pathname
```

---

## How auto-generation works

The function `generateBreadcrumbs(pathname)` in `src/lib/navigation.ts` converts a URL path
into an array of `BreadcrumbItem` objects.

### Algorithm

1. Split `pathname` by `/`, filter empty segments
2. Always prepend `{ label: "Home", href: "/" }`
3. For each segment, build the cumulative path and format the label
4. The **last** segment has no `href` (it is the current page — not a link)
5. All earlier segments get their `href` for navigation

### Example outputs

| URL | Breadcrumbs |
|-----|-------------|
| `/` | Home |
| `/dashboard` | Home › Dashboard |
| `/settings` | Home › Settings |
| `/settings/security` | Home › Settings › Security |
| `/settings/notifications` | Home › Settings › Notifications |
| `/users/123/edit` | Home › Users › 123 › Edit |

---

## Label formatting

`formatPathSegment(segment)` converts URL segments into human-readable labels:

```ts
formatPathSegment("dashboard")       // "Dashboard"
formatPathSegment("patient-details") // "Patient Details"
formatPathSegment("user-profile")    // "User Profile"
formatPathSegment("123")             // "123"  (IDs pass through unchanged)
```

The rule: split on `-`, capitalise first letter of each word, join with space.

---

## Mobile — page title only

On screens narrower than `md`, the full breadcrumb trail is hidden.
In its place a single `<span>` shows the current page name:

```tsx
<span className="md:hidden text-sm font-medium truncate">
  {getRouteLabel(pathname)}
</span>
```

`getRouteLabel(pathname)` returns just the last segment, formatted — e.g. `"Security"` for `/settings/security`.

---

## Overriding breadcrumbs

Override only when the auto-generated label is **wrong** — for example, when a segment is an ID
that should display a record name, or when you want a custom label.

Pass the override to `AppShell` via the `breadcrumbs` prop:

```tsx
// In the router — pass to AppShell
<AppShell
  breadcrumbs={[
    { label: "Home",    href: "/" },
    { label: "Invoices", href: "/invoices" },
    { label: "Invoice #1042" },     // ← custom label; no href = current page
  ]}
/>
```

Or, more practically, manage the override in the page itself and lift it to the shell
via context or a state management approach.

### When to override

| Situation | Action |
|-----------|--------|
| Auto-generated label is correct | Do nothing |
| Segment is an ID (e.g. `/users/abc123`) | Override with the record's name |
| Path has a custom label requirement | Override that segment only |
| You want to suppress the "Home" prefix | Override the full array |

---

## Full API

### `generateBreadcrumbs(pathname, customBreadcrumbs?)`

```ts
function generateBreadcrumbs(
  pathname: string,
  customBreadcrumbs?: BreadcrumbItem[]
): BreadcrumbItem[]
```

- If `customBreadcrumbs` is provided, it is returned as-is (no auto-generation).
- `BreadcrumbItem` is `{ label: string; href?: string }`.
- Last item should have no `href` (it's the current page).

### `formatPathSegment(segment)`

```ts
function formatPathSegment(segment: string): string
// "my-page" → "My Page"
```

### `getRouteLabel(pathname)`

```ts
function getRouteLabel(pathname: string): string
// "/settings/security" → "Security"
// "/"                  → "Home"
```

### `buildPath(...segments)`

```ts
function buildPath(...segments: string[]): string
// buildPath("users", "123", "edit") → "/users/123/edit"
```

### `isActiveRoute(currentPath, targetPath, exact?)`

```ts
function isActiveRoute(
  currentPath: string,
  targetPath: string,
  exact?: boolean           // default false
): boolean
// isActiveRoute("/settings/security", "/settings")       → true  (prefix)
// isActiveRoute("/settings/security", "/settings", true) → false (exact)
```

---

## BreadcrumbItem type

```ts
// src/lib/navigation.ts
export interface BreadcrumbItem {
  label: string
  href?: string    // omit for the last/current item
}
```

---

## Rendering in `GlobalHeader`

`GlobalHeader` uses `useMemo` to recompute breadcrumbs whenever the pathname or the override changes:

```tsx
const getBreadcrumbs = React.useMemo(
  () => generateBreadcrumbs(location.pathname, breadcrumbs),
  [breadcrumbs, location.pathname]
)
```

Each item is rendered as a `BreadcrumbLink` (clickable) or `BreadcrumbPage` (current, non-clickable):

```tsx
{getBreadcrumbs.map((item, index) => {
  const isLast = index === getBreadcrumbs.length - 1
  return (
    <React.Fragment key={index}>
      <BreadcrumbItem>
        {isLast || !item.href ? (
          <BreadcrumbPage>{item.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link to={item.href}>{item.label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
      {!isLast && <BreadcrumbSeparator />}
    </React.Fragment>
  )
})}
```

---

## Rules

- ✅ Breadcrumbs are always auto-generated from the URL — no action required for standard routes.
- ✅ Only override when the auto-generated label is wrong (e.g., a bare ID in the URL).
- ✅ The last breadcrumb item must never have an `href` (it represents the current page).
- ✅ On mobile, `getRouteLabel` is used to show the current page title in place of breadcrumbs.
- ❌ Never hard-code breadcrumb arrays for routes where auto-generation produces the correct output.
- ❌ Never render a `<Breadcrumb>` component inside a page — breadcrumbs are a global header concern.
