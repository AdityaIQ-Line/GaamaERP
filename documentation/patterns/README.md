# UI Patterns — Reference Index

This folder documents every structural pattern used in the IQLine Design System.
Each file is self-contained and written to be read by developers **and** LLMs producing
new pages. Follow these patterns exactly — do not invent alternatives.

---

## Pattern Files

| # | File | What it covers |
|---|------|---------------|
| 01 | [app-skeleton.md](./01-app-skeleton.md) | The full application frame — sidebar, header, main, footer |
| 02 | [global-header.md](./02-global-header.md) | Top bar anatomy — breadcrumbs, search, icons, user menu |
| 03 | [sidebar.md](./03-sidebar.md) | Sidebar structure, grouped nav, active state, tenant switcher |
| 04 | [page-header.md](./04-page-header.md) | Per-page header — title, back button, tags, actions |
| 05 | [breadcrumbs.md](./05-breadcrumbs.md) | Dynamic breadcrumb generation and progression rules |
| 06 | [footer.md](./06-footer.md) | Global footer vs page-level footer |
| 07 | [page-composition.md](./07-page-composition.md) | How to assemble a complete page correctly |

---

## The One-Sentence Rule for Each Pattern

- **App Skeleton** — every route inside the app lives inside `AppShell`; auth and error pages do not.
- **Global Header** — breadcrumbs on the left, search + bell + theme + settings + user on the right; never add per-page content here.
- **Sidebar** — grouped navigation with active highlighting; the header slot holds the tenant switcher, not the user.
- **Page Header** — every page **must** have a `PageHeader`, `PageHeaderWithBack`, or `PageHeaderWithTabs`; it is never optional.
- **Breadcrumbs** — generated automatically from the URL; override only when the default label is wrong.
- **Footer** — the global footer is always visible; swap it for a `PageFooter` only when a page needs sticky CTAs.
- **Page Composition** — the correct order is always: `PageShell` → page header → scrollable content area → optional page footer.
