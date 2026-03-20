# Pattern 07 — Page Composition

This document explains how to assemble a complete, correctly structured page from scratch.
Follow this guide for every new page added to the application.

---

## The mandatory page structure

```
PageShell
  └── PageHeader  (or PageHeaderWithBack / PageHeaderWithTabs)
  └── <div> scrollable content area
        └── page body (cards, forms, tables, etc.)
  └── [optional] page footer  (sticky bottom CTAs)
```

This structure is **fixed**. The only variation is which page header variant you pick and whether
a page footer is needed.

**Gaama / IQLDS note:** The scrollable content `<div>` uses **`flex-1 overflow-auto`** on the **default page surface** (same as list views). **Do not** wrap the whole body in **`bg-muted`** — use **cards/tables** for contrast. Full-page create flows may add an inner **`w-full h-full`** wrapper and **`space-y-4 px-6 py-4 h-full`** around forms per **[CREATE_PAGES_DESIGN_INTENT.md](../CREATE_PAGES_DESIGN_INTENT.md) §3.3**.

---

## Complete skeleton — copy and adapt this

```tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Button } from "@/components/ui/button"

export default function MyPage() {
  return (
    <PageShell>
      {/* 1. Page Header — mandatory */}
      <PageHeader
        title="My Page"
        actions={<Button size="sm">Primary CTA</Button>}
      />

      {/* 2. Scrollable content area — always flex-1 overflow-auto */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Page body */}
      </div>
    </PageShell>
  )
}
```

---

## Variant A — Standard page

No back button. Content fills the scrollable area. Global footer visible below.

```tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"

export default function DashboardPage() {
  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <Button variant="outline" size="sm">Export</Button>
            <Button size="sm">New Report</Button>
          </>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* metric cards, charts, tables… */}
      </div>
    </PageShell>
  )
}
```

---

## Variant B — Detail / stack page (with back button)

Use `PageHeaderWithBack` when the page was reached by navigating into a record or sub-route.

```tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

export default function UserDetailPage() {
  return (
    <PageShell>
      <PageHeaderWithBack
        title="Jane Doe"
        backButton={{ href: "/users" }}
        actions={
          <>
            <Button variant="outline" size="sm">Delete</Button>
            <Button size="sm">Edit</Button>
          </>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* user detail content */}
      </div>
    </PageShell>
  )
}
```

---

## Variant C — Tabbed page

Use `PageHeaderWithTabs` when the page body is split into tabs.
Tab content renders inside the scrollable area, not inside the header.

```tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"
import { TabsContent } from "@/components/ui/tabs"
import { useState } from "react"

export default function SettingsPage() {
  const [tab, setTab] = useState("general")

  return (
    <PageShell>
      <PageHeaderWithTabs
        title="Settings"
        tabs={[
          { value: "general",       label: "General" },
          { value: "security",      label: "Security" },
          { value: "notifications", label: "Notifications" },
        ]}
        value={tab}
        onValueChange={setTab}
        actions={<Button size="sm">Save Changes</Button>}
      />

      {/* Tabs content lives in the scrollable area */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "general"       && <GeneralSettings />}
        {tab === "security"      && <SecuritySettings />}
        {tab === "notifications" && <NotificationSettings />}
      </div>
    </PageShell>
  )
}
```

---

## Variant D — Form page with sticky footer

Use a page footer when Save / Cancel should always be visible, regardless of how far the user scrolls.

```tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

export default function EditProfilePage() {
  return (
    <PageShell>
      <PageHeaderWithBack
        title="Edit Profile"
        backButton={{ href: "/profile" }}
        noBorder
      />

      {/* Scrollable form body */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <FormSection title="Personal Information">
          {/* fields */}
        </FormSection>
        <FormSection title="Contact" noSeparator>
          {/* fields */}
        </FormSection>
      </div>

      {/* Sticky page footer */}
      <div className="border-t bg-background px-6 py-3 flex items-center justify-end gap-2 shrink-0">
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </PageShell>
  )
}
```

---

## Content area spacing rules

The content area `<div>` should always have:

```
flex-1 overflow-auto p-6
```

Add `space-y-6` between sections (cards, form sections, etc.).

| Need | Class |
|------|-------|
| Standard padding | `p-6` |
| Reduced padding (dense) | `p-4` |
| No padding (full-bleed table) | `p-0` (add padding inside the component) |
| Section spacing | `space-y-6` |
| Grid layout | `grid grid-cols-1 md:grid-cols-2 gap-6` |

---

## Page body patterns

### Metrics row

```tsx
<StatRow
  stats={[
    { label: "Total Users", value: "12,450", trend: "up" },
    { label: "Active",      value: "9,820",  trend: "up" },
    { label: "Churn Rate",  value: "1.2%",   trend: "down" },
    { label: "MRR",         value: "$48,200", secondary: "+$2,100 this month" },
  ]}
  columns={4}
  bordered
/>
```

### Form with sections

```tsx
<FormSection title="Personal Information" description="Your public profile details.">
  {/* inputs */}
</FormSection>

<FormSection title="Contact" noSeparator>
  {/* inputs */}
</FormSection>
```

### Detail / read-only data

```tsx
<DetailList title="Account Details" divided>
  <DetailRow label="Created" value="Jan 14, 2025" />
  <DetailRow label="Status" value={<Badge>Active</Badge>} />
  <DetailRow label="Plan" value="Pro" />
  <DetailRow label="Last login" value="2 hours ago" />
</DetailList>
```

### Empty state

```tsx
<EmptyCard
  icon={<Inbox className="size-6" />}
  title="No notifications"
  description="You're all caught up."
/>
```

### Data table

```tsx
<DataTable columns={columns} data={rows} />
```

---

## Layout variants inside the content area

### Two-column (sidebar layout)

```tsx
import { TwoColumnLayout } from "@/components/layouts/two-column-layout"

<TwoColumnLayout sidebar={<PropertiesPanel />}>
  <MainContent />
</TwoColumnLayout>
```

### Split panel

```tsx
import { SplitLayout } from "@/components/layouts/split-layout"

<SplitLayout ratio="70/30">
  <LeftPanel />
  <RightPanel />
</SplitLayout>
```

Available ratios: `"50/50"`, `"60/40"`, `"70/30"`, `"75/25"`, `"40/60"`, `"30/70"`, `"25/75"`.

### Three column

```tsx
import { ThreeColumnLayout } from "@/components/layouts/three-column-layout"

<ThreeColumnLayout left={<Nav />} right={<Sidebar />}>
  <MainContent />
</ThreeColumnLayout>
```

---

## Full end-to-end example — a list page

```tsx
import { PageShell }   from "@/components/layouts/page-shell"
import { PageHeader }  from "@/components/blocks/page-header"
import { DataTable }   from "@/components/blocks/data-table"
import { EmptyCard }   from "@/components/patterns/empty-card"
import { Button }      from "@/components/ui/button"
import { Users }       from "lucide-react"

export default function UsersPage() {
  const { data, loading } = useUsers()

  return (
    <PageShell>
      <PageHeader
        title="Users"
        actions={<Button size="sm">Invite User</Button>}
      />

      <div className="flex-1 overflow-auto p-6">
        {loading && <SkeletonLoader lines={8} />}

        {!loading && data.length === 0 && (
          <EmptyCard
            icon={<Users className="size-6" />}
            title="No users yet"
            description="Invite your first team member to get started."
            actionLabel="Invite User"
            onAction={openInviteModal}
          />
        )}

        {!loading && data.length > 0 && (
          <DataTable columns={userColumns} data={data} />
        )}
      </div>
    </PageShell>
  )
}
```

---

## Router registration

Every new page must be added as a child of the `AppShell` route in `src/app/router.tsx`:

```tsx
// src/app/router.tsx
{
  element: <AppShell />,
  children: [
    // ... existing routes
    { path: "/users",      element: <LazyPage><UsersPage /></LazyPage> },
    { path: "/users/:id",  element: <LazyPage><UserDetailPage /></LazyPage> },
  ],
}
```

Use `LazyPage` wrapper for code-splitting on all non-home pages.
Auth pages (`/login`, etc.) and error pages go outside `AppShell` — see pattern 01.

---

## Component import map

| Need | Import |
|------|--------|
| Page shell wrapper | `@/components/layouts/page-shell` |
| Standard page header | `@/components/blocks/page-header` |
| Page header + back button | `@/components/patterns/page-header-with-back` |
| Page header + tabs | `@/components/patterns/page-header-with-tabs` |
| Back button standalone | `@/components/blocks/back-button` |
| Form section | `@/components/patterns/form-section` |
| Detail row / list | `@/components/patterns/detail-row` |
| Stat row | `@/components/patterns/stat-row` |
| Empty state card | `@/components/patterns/empty-card` |
| Data table | `@/components/blocks/data-table` |
| Skeleton loader | `@/components/blocks/skeleton-loader` |
| Split layout | `@/components/layouts/split-layout` |
| Two column layout | `@/components/layouts/two-column-layout` |

---

## Rules

- ✅ Every page starts with `<PageShell>`.
- ✅ `PageShell` must always contain a page header as its first child.
- ✅ The scrollable content area must always be `flex-1 overflow-auto` (same default surface as IQLDS list pages — do not tint the whole content column `bg-muted`).
- ✅ Use `space-y-6` between top-level sections in the content area.
- ✅ Register every new page as a child of `AppShell` in `router.tsx`.
- ✅ Wrap lazy-loaded pages in `<LazyPage>`.
- ❌ Never render `AppShell`, `GlobalHeader`, `GlobalSidebar`, or `GlobalFooter` inside a page.
- ❌ Never use `position: fixed` or `position: absolute` on page-level elements.
- ❌ Never place a second `PageShell` inside a tab panel.
- ❌ Never put primary CTAs in the page body — they always go in `PageHeader.actions` or the page footer.
- ❌ Never skip `overflow-auto` on the content area — this causes the page to overflow the viewport.
