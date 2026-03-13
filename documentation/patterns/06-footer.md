# Pattern 06 — Footer

There are two footer concepts: the **global footer** and the **page footer**.
They serve different purposes and should never both appear on the same page.

---

## Global Footer

The global footer is always visible at the bottom of the app shell. It renders
copyright information and is provided by `AppShell` — you never render it manually.

```
┌──────────────────────────────────────────────────────────────────────┐
│  © 2026 IQLine Inc. All rights reserved.                             │
└──────────────────────────────────────────────────────────────────────┘
```

**File:** `src/components/blocks/global-footer.tsx`

```tsx
export function GlobalFooter() {
  return (
    <footer className="border-t px-6 py-2">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} IQLine Inc. All rights reserved.
      </p>
    </footer>
  )
}
```

- `border-t` — single top border, no extra padding
- Always rendered by `AppShell` — never import or render inside a page
- The copyright year is dynamic (`new Date().getFullYear()`)

---

## Page Footer

A page footer replaces the global footer when a page needs **sticky bottom action buttons** —
typically a form's primary Save / Cancel CTAs, or a multi-step wizard's navigation.

```
┌──────────────────────────────────────────────────────────────────────┐
│  scrollable page content                                             │
│  ...                                                                 │
├──────────────────────────────────────────────────────────────────────┤
│  PAGE FOOTER (sticky bottom-0, border-t)                             │
│  ┌────────────────────────────────────────┐                          │
│  │  [Cancel]                    [Save ▸]  │                          │
│  └────────────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────┘
```

There is no single `PageFooter` component — you build it inline inside the page using a
`<div>` with the following class pattern:

```tsx
<div className="border-t bg-background px-6 py-3 flex items-center justify-end gap-2 shrink-0">
  <Button variant="outline">Cancel</Button>
  <Button>Save Changes</Button>
</div>
```

Place it as the **last child** inside `PageShell`:

```tsx
<PageShell>
  <PageHeader title="Edit Profile" />
  <div className="flex-1 overflow-auto p-6">
    {/* form content */}
  </div>
  {/* ↓ page footer — only when page needs sticky CTAs */}
  <div className="border-t bg-background px-6 py-3 flex items-center justify-end gap-2 shrink-0">
    <Button variant="outline" onClick={onCancel}>Cancel</Button>
    <Button onClick={onSave}>Save Changes</Button>
  </div>
</PageShell>
```

### Why it works

`PageShell` is `flex flex-col h-full`. The content area has `flex-1 overflow-auto`.
This makes the page footer stick to the bottom of the viewport regardless of content length.

---

## When to use each footer

| Situation | Footer to use |
|-----------|---------------|
| Regular informational / read-only page | Global footer (automatic, no action needed) |
| Form page with Save / Cancel at bottom | Page footer (`<div>` with `shrink-0` in `PageShell`) |
| Multi-step wizard | Page footer (Back / Next / Submit navigation) |
| Detail page with no bottom CTAs | Global footer (automatic) |
| Dashboard / table / calendar | Global footer (automatic) |

---

## Rules

- ✅ The global footer is always rendered by `AppShell`. Never render it yourself.
- ✅ Use a page footer only when the page has sticky bottom CTAs.
- ✅ Place the page footer as the last child inside `PageShell`.
- ✅ Give the page footer `shrink-0` so it never collapses.
- ✅ Give the scrollable content area `flex-1 overflow-auto` so it takes remaining space.
- ❌ Never render both a global footer and a page footer at the same time.
- ❌ Never put primary CTAs in the global footer.
- ❌ Never use `position: fixed` for the page footer — let the flex layout handle it.
