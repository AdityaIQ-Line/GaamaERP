# Pattern 02 — Global Header

The global header is the sticky top bar rendered by `AppShell` on every app page.
It is **never rendered inside a page component** — it is always provided by the shell.

---

## Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│ [≡]  │  [Search………………………………⌘K]  Breadcrumb / Page title           │
│      │                                                              │
│      │                    [🔔2] │ [🌙] │ [⚙] │ [JD ▾ John Doe]   │
└─────────────────────────────────────────────────────────────────────┘
  ↑          ↑ LEFT ZONE                     ↑ RIGHT ZONE
Sidebar
trigger
```

### Left zone (in order, left → right)

| Slot | Component | Notes |
|------|-----------|-------|
| Sidebar trigger | `SidebarTrigger` | Toggles the sidebar open/closed |
| Separator | `Separator` (vertical, `h-4`) | Visual divider |
| Search bar | `CommandPaletteTrigger` | Desktop only (`hidden md:flex`). Opens command palette. |
| Breadcrumbs | `Breadcrumb` + generated items | Desktop only (`hidden md:flex`). Auto-generated from URL. |
| Mobile page title | `<span className="md:hidden">` | Shows current page name on mobile when breadcrumbs are hidden. |

### Right zone (in order, left → right)

| Slot | Component | Notes |
|------|-----------|-------|
| Notifications | `NotificationPanel` | Bell icon with unread badge. Dropdown on click. |
| Separator | `Separator` (vertical, `h-4 mx-1`) | |
| Theme toggle | `ThemeToggle` | Light / dark / system. |
| Separator | `Separator` (vertical, `h-4 mx-1`) | |
| Settings link | `Button` (ghost, icon) → `Link to="/settings"` | Quick access to settings. |
| Separator | `Separator` (vertical, `h-4 mx-1`) | |
| User menu | `DropdownMenu` with `Avatar` trigger | Shows name on desktop. Dropdown: Profile, Settings, Log out. |

---

## Search bar (`CommandPaletteTrigger`)

The search bar is a **trigger** for the command palette — it is not a real input.
Clicking it (or pressing Ctrl+K / ⌘K) opens the `CommandDialog`.

```
┌─────────────────────────────────────┐
│ 🔍  Search…                    ⌘K  │  ← flex-1 span pushes kbd to the right
└─────────────────────────────────────┘
  w-48, border, bg-muted/50
```

- Width: `w-48` (fixed)
- The `⌘K` badge is always `shrink-0` on the far right
- Hidden on mobile (`hidden md:flex`)

---

## Breadcrumbs

Breadcrumbs are **auto-generated** from `location.pathname` using `generateBreadcrumbs()`.
See [05-breadcrumbs.md](./05-breadcrumbs.md) for full rules.

On mobile, breadcrumbs are replaced by a plain page title `<span>` that shows
`getRouteLabel(pathname)` — the last segment of the path, formatted as a title.

---

## Notification panel

- Bell icon with a red `Badge` showing unread count (capped at "9+")
- Click opens a dropdown `ScrollArea` listing all notifications
- Each notification has: type icon (info/success/warning/error), title, description, relative timestamp
- "Mark all as read" button at the top of the dropdown
- Clicking a notification marks it as read

---

## User menu

```
[JD ▾  John Doe]          ← Avatar + name on desktop, avatar only on mobile
  ├── John Doe            ← Label (name + email)
  │   john@example.com
  ├── ──────────────
  ├── 👤 Profile          → /profile
  ├── ⚙  Settings         → /settings
  ├── ──────────────
  └── 🚪 Log out          → onLogout()
```

---

## File

`src/components/blocks/global-header.tsx`

### Props

```tsx
interface GlobalHeaderProps {
  breadcrumbs?: BreadcrumbItem[]      // manual override; auto-generated if omitted
  onLogout?: () => void
  userName?: string                   // passed through from AppShell
  userEmail?: string
  userAvatar?: string
  onCommandPaletteOpen?: () => void   // called when search bar is clicked
}
```

---

## Rules

- ✅ The header is rendered by `AppShell`. Never import or render it inside a page.
- ✅ Breadcrumbs are automatic — only override when the auto-generated label is wrong.
- ✅ On mobile the breadcrumb is replaced by the current page title — no action needed.
- ❌ Never add page-specific actions or buttons to the global header.
- ❌ Never put the user avatar in the sidebar (user lives in the header only).
- ❌ Never hide or conditionally render the header from within a page component.
