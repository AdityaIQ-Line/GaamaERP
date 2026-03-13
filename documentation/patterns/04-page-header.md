# Pattern 04 — Page Header

**Every page must have a page header.** It is not optional.

The page header is the sticky bar at the top of the page content area — below the global header,
inside the page component. It provides the page title, an optional back button, optional tags,
and optional action buttons / CTAs.

---

## Visual Anatomy

```
┌──────────────────────────────────────────────────────────────────────┐
│ PAGE HEADER  (sticky top-0, z-30, h-14, border-b)                   │
│                                                                      │
│  LEFT ZONE                           RIGHT ZONE                     │
│  ┌──────────────────────┐            ┌──────────────────────────┐   │
│  │ [←]  Page Title      │            │ [Tag] [Tag]  [Btn] [CTA] │   │
│  └──────────────────────┘            └──────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
  ↑ leading slot                              ↑ actions slot
  (back button or nothing)
```

---

## The three header variants

### 1. `PageHeader` — standard

Use for top-level pages that don't need a back button.

```tsx
import { PageHeader } from "@/components/blocks/page-header"

<PageHeader
  title="Dashboard"
  actions={
    <>
      <Button variant="outline" size="sm">Export</Button>
      <Button size="sm">New Report</Button>
    </>
  }
/>
```

### 2. `PageHeaderWithBack` — detail / stack pages

Use whenever the user navigated *into* a record, a sub-page, or any screen that has a parent.

```tsx
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

<PageHeaderWithBack
  title="Edit Profile"
  backButton={{ href: "/profile" }}       // explicit back destination
  // backButton={{ onClick: handleBack }} // or custom handler
  // backButton={{}}                      // or navigate(-1) — browser back
  actions={<Button size="sm">Save Changes</Button>}
/>
```

The back button is always an icon-only ghost button with `ArrowLeft`.

### 3. `PageHeaderWithTabs` — tabbed pages

Use when the page content is split into tabs.

```tsx
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"

<PageHeaderWithTabs
  title="Settings"
  tabs={[
    { value: "general",       label: "General" },
    { value: "security",      label: "Security" },
    { value: "notifications", label: "Notifications", badge: 3 },
  ]}
  defaultValue="general"
  onValueChange={setActiveTab}
  actions={<Button size="sm">Save</Button>}
/>
```

`PageHeaderWithTabs` renders `PageHeader` (with `noBorder`) followed immediately by `PageTabs`.

---

## Left zone

```
[←]  Page Title                [optional tags beside title]
```

| Element | Notes |
|---------|-------|
| `leading` slot | Anything placed before the title. Use for `BackButton` or a status icon. |
| `title` | `h1` — always present, `text-lg font-semibold`. |
| Tags | Place `<Badge>` elements inside `leading` or directly after `title` in a `flex gap-2` wrapper. |

### Adding tags next to the title

Tags live in the `leading` slot, after the back button (if any). Wrap them together:

```tsx
<PageHeader
  title="Invoice #1042"
  leading={
    <div className="flex items-center gap-2">
      <BackButton href="/invoices" />
      <Badge variant="outline">Draft</Badge>
      <Badge>Overdue</Badge>
    </div>
  }
  actions={<Button size="sm">Send Invoice</Button>}
/>
```

---

## Right zone (actions)

Pass a `React.ReactNode` to the `actions` prop. Typical patterns:

```tsx
// Single primary CTA
actions={<Button size="sm">Save</Button>}

// Secondary + primary
actions={
  <>
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Publish</Button>
  </>
}

// Icon button + primary
actions={
  <>
    <Button variant="ghost" size="icon" aria-label="More options">
      <MoreHorizontal className="size-4" />
    </Button>
    <Button size="sm">New Item</Button>
  </>
}

// Dropdown + primary
actions={
  <>
    <DropdownMenu>...</DropdownMenu>
    <Button size="sm">Create</Button>
  </>
}
```

The actions wrapper is `flex items-center gap-2 shrink-0` — it will not wrap or truncate.

---

## Files

| Component | File |
|-----------|------|
| `PageHeader` | `src/components/blocks/page-header.tsx` |
| `BackButton` | `src/components/blocks/back-button.tsx` |
| `PageTabs` | `src/components/blocks/page-tabs.tsx` |
| `PageHeaderWithBack` | `src/components/patterns/page-header-with-back.tsx` |
| `PageHeaderWithTabs` | `src/components/patterns/page-header-with-tabs.tsx` |

---

## Props reference

### `PageHeader`

```tsx
interface PageHeaderProps {
  title: string
  leading?: React.ReactNode    // left of title — back button, tags, icons
  actions?: React.ReactNode    // right side — CTAs, filters, menus
  noBorder?: boolean           // remove bottom border (used by PageHeaderWithTabs)
}
```

### `PageHeaderWithBack`

```tsx
interface PageHeaderWithBackProps {
  title: string
  actions?: React.ReactNode
  backButton?: {
    label?: string       // optional text label (default: icon only)
    href?: string        // navigate to this path
    onClick?: () => void // custom click handler
    // if neither href nor onClick → navigate(-1)
  }
  className?: string
  noBorder?: boolean
}
```

### `BackButton`

```tsx
interface BackButtonProps {
  label?: string       // optional text (default: icon only)
  href?: string        // navigate to this path
  onClick?: () => void // custom handler
  className?: string
}
```

### `PageHeaderWithTabs`

```tsx
interface PageHeaderWithTabsProps {
  title: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  tabs: Array<{
    value: string
    label: string
    badge?: string | number  // shows a secondary Badge
    disabled?: boolean
  }>
  defaultValue?: string       // uncontrolled
  value?: string              // controlled
  onValueChange?: (value: string) => void
}
```

---

## Positioning

`PageHeader` is `sticky top-0 z-30`. This means:

- It sticks below the global header (`z-40`) as the page scrolls
- The page content below it scrolls underneath
- The `PageShell` wrapper sets `flex h-full flex-col` to make this work correctly

```
┌───────────────────────────────────┐  z-40 (GlobalHeader)
├───────────────────────────────────┤  z-30 (PageHeader — sticks here as body scrolls)
│                                   │
│  scrollable content               │
│  ...                              │
│                                   │
└───────────────────────────────────┘
```

---

## Rules

- ✅ Every page **must** have a `PageHeader`, `PageHeaderWithBack`, or `PageHeaderWithTabs`.
- ✅ Use `PageHeaderWithBack` when the page was reached by navigating into a record or sub-route.
- ✅ Use `PageHeaderWithTabs` when the page content is tab-based.
- ✅ Always place CTAs in the `actions` slot — never inline in the page body.
- ✅ Tags and badges go in the `leading` slot, beside (after) the title.
- ❌ Never add a second page header inside a tab panel — one per page only.
- ❌ Never place page-level CTAs in the global header.
- ❌ Never render the page header outside of a `PageShell` wrapper.
- ❌ Never make the page header non-sticky unless absolutely required.
