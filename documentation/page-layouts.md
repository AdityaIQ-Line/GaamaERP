# Page Layouts

This document describes the different page layout patterns used in the application.

## Layout Types

### 1. Container Layout

A centered container with max-width constraints.

```tsx
<div className="container mx-auto px-4 py-8">
  {/* Content */}
</div>
```

**Use when:**
- Creating standard content pages
- Need consistent max-width across breakpoints
- Content should be centered

### 2. Full-Width Layout

Content spans the full viewport width.

```tsx
<div className="w-full">
  {/* Content */}
</div>
```

**Use when:**
- Creating hero sections
- Dashboard-style layouts
- Full-width components like carousels

### 3. Grid Layout

Using CSS Grid for complex layouts.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

**Use when:**
- Displaying cards or items in a grid
- Responsive multi-column layouts
- Complex layout requirements

### 4. Flex Layout

Using Flexbox for flexible layouts.

```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Flex items */}
</div>
```

**Use when:**
- Simple horizontal/vertical arrangements
- Aligning items
- Responsive direction changes

### 5. Sidebar Layout

Layout with a fixed or collapsible sidebar.

```tsx
<div className="flex h-screen">
  <aside className="w-64 border-r">
    {/* Sidebar content */}
  </aside>
  <main className="flex-1 overflow-auto">
    {/* Main content */}
  </main>
</div>
```

**Use when:**
- Navigation-heavy pages
- Dashboard interfaces
- Admin panels

## IQLine / Gaama page body (inside AppShell)

Routes rendered under **`AppShell`** use **`PageShell`** (`flex h-full flex-col`) as the per-page wrapper: **page header first**, then a **single scrollable body** with **`flex-1 overflow-auto`**.

- **Page background:** Use the **default** main/content background (**no** **`bg-muted`** on that scroll column). This matches **IQLDS list pages** and full-page create flows alike; contrast comes from **`PageHeader`** and **cards/tables**. See **[CREATE_PAGES_DESIGN_INTENT.md](./CREATE_PAGES_DESIGN_INTENT.md) §3.1** and **[Pattern 07](./patterns/07-page-composition.md)**.
- **List / index:** Body is usually **`flex-1 overflow-auto px-6 py-4 space-y-4`** (see Gaama pages under `src/pages/gaama/`).
- **Full-page create / generate:** Follow **[CREATE_PAGES_DESIGN_INTENT.md](./CREATE_PAGES_DESIGN_INTENT.md) §3.3** — outer scroll **`flex-1 overflow-auto`**, inner **`w-full h-full`**, then **`PageHeaderWithBack`** and **`space-y-4 px-6 py-4 h-full`** around cards/forms.

```tsx
// List-style body (default surface — no bg-muted on this div)
<div className="flex-1 overflow-auto px-6 py-4 space-y-4">{/* … */}</div>
```

## Responsive Breakpoints

The application uses Tailwind's default breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Spacing Guidelines

- **Page padding**: `py-8` or `py-12` for vertical spacing
- **Section spacing**: `space-y-6` or `space-y-8` between sections
- **Container padding**: `px-4` or `px-6` for horizontal padding

## Examples

### Dashboard Layout

```tsx
<div className="flex h-screen">
  <Sidebar />
  <div className="flex-1 flex flex-col">
    <Header />
    <main className="flex-1 overflow-auto p-6">
      {/* Dashboard content */}
    </main>
  </div>
</div>
```

### Content Page Layout

```tsx
<div className="container mx-auto max-w-4xl px-4 py-8">
  <header className="mb-8">
    <h1 className="text-4xl font-bold">Page Title</h1>
    <p className="text-muted-foreground mt-2">Subtitle</p>
  </header>
  <Separator />
  <article className="mt-8 prose">
    {/* Article content */}
  </article>
</div>
```

## Layout Components

The application provides several reusable layout components:

### Two Column Layout

A flexible two-column layout with optional headers, footers, and scrollable sections.

```tsx
import { TwoColumnLayout } from "@/components/layouts/two-column-layout"

<TwoColumnLayout
  left={<div>Left content</div>}
  right={<div>Right content</div>}
  leftWidth="50%"
  rightWidth="50%"
  leftHeader={<h2>Left Header</h2>}
  rightHeader={<h2>Right Header</h2>}
  leftFooter={<div>Left Footer</div>}
  rightFooter={<div>Right Footer</div>}
  showSeparator={true}
/>
```

**Props:**
- `left`: Content for the left section (required)
- `right`: Content for the right section (required)
- `leftWidth`: Width of the left section (default: "50%")
- `rightWidth`: Width of the right section (default: "50%")
- `leftHeader`: Optional header for the left section
- `leftFooter`: Optional footer for the left section
- `rightHeader`: Optional header for the right section
- `rightFooter`: Optional footer for the right section
- `showSeparator`: Whether to show separators between sections (default: true)
- `className`: Additional CSS classes

**Use when:**
- You need equal or custom-width columns
- Both sections need headers or footers
- You need independent scrolling for each section
- Creating comparison views or side-by-side content

### Three Column Layout

A three-column layout with left sidebar, main content area, and right properties panel.

```tsx
import { ThreeColumnLayout } from "@/components/layouts/three-column-layout"

<ThreeColumnLayout
  left={<div>Left sidebar content</div>}
  content={<div>Main content</div>}
  right={<div>Properties panel</div>}
  leftWidth="240px"
  rightWidth="320px"
/>
```

**Props:**
- `left`: Content for the left sidebar (required)
- `content`: Main content area (required)
- `right`: Content for the right properties panel (required)
- `leftWidth`: Width of the left sidebar (default: "240px")
- `rightWidth`: Width of the right properties panel (default: "320px")
- `className`: Additional CSS classes

**Use when:**
- You need navigation sidebar + main content + properties panel
- Creating editor interfaces with toolbars and properties
- Building complex dashboards with multiple panels
- Need three distinct content areas with independent scrolling



