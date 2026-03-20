# Create Pages – Design Guidelines & Protocol

**Status:** Approved product decisions (see **§6**).  
**Companion:** [GAAMA_ERP_2_SOURCE_OF_TRUTH.md](./GAAMA_ERP_2_SOURCE_OF_TRUTH.md) for *what* each module does; this document defines *how* full-page **create** flows look and behave.

---

## 1. Purpose

1. **Unify** all **Add / Create / Generate** full-page flows (same structure, spacing, hierarchy, field patterns).
2. **Anchor** layout to the **Create GRN** full-page design (stacked cards, reference panels, section titles, field styling) as the **reference implementation**.
3. **Buttons** use **`@/components/ui/button`** and theme **`primary`** (aligned to brand teal — **§6.1**), not ad-hoc mock hex on individual pages.

This document + **code** are the source of truth for spacing, colors, and behavior. **Figma / Pencil** are used only for **field structure and field names** (**§7**).

---

## 2. Scope

| In scope | Out of scope (unless product says otherwise) |
|----------|-----------------------------------------------|
| Full-page **create** flows (`PageHeaderWithBack` or equivalent + body — **§3.2**) | List/index pages, dashboards |
| **Edit** full pages that reuse the same form layout | **View-only** screens (can stay compact / dialog) |
| Layout, cards, section titles, reference/read-only blocks | Changing business rules or DataContext APIs |
| **English-only** copy on create pages (**§6.10**) | i18n / multiple languages |

---

## 3. Protocol – Page Structure

### 3.1 Shell

- Wrap in **`PageShell`**.
- Scrollable column: **`flex-1 overflow-auto`**.
- **Page background:** Match **IQLDS / list views** — the scrollable content area uses the **same default surface** as the rest of the app (**no** full-page **`bg-muted`** tint on the content column). Contrast for forms comes from **cards** (`bg-card`, borders), not from muting the whole page (**§6.5** light theme).

### 3.2 Page title & back (IQLDS)

Create / generate full pages use the **same page title + back treatment** as the rest of the app (IQLDS layout guidelines), not a one-off header.

- **References:** [Pattern 04 — Page Header](./patterns/04-page-header.md), [navigation.md](./navigation.md) (back in header), [`PageHeaderWithBack`](../src/components/patterns/page-header-with-back.tsx) (wraps [`PageHeader`](../src/components/blocks/page-header.tsx) + [`BackButton`](../src/components/blocks/back-button.tsx)).

- **Title copy:** Verb + entity (e.g. “Create GRN”, “Add Customer”, “Generate Certificate”) — consistent with how the **list** page names the module in **`PageHeader`**.

- **Title markup & style:** **`h1`** with **`text-lg font-semibold`** and **`text-foreground`** — exactly like **`PageHeader`** (left zone). Do **not** use a plain **`span`** with **`text-sm` / `font-medium`** for the screen title.

- **Back control:** **`BackButton`** only: **`Button` `variant="ghost"` `size="sm"`**, **`ArrowLeft`** icon (see Pattern 04). No ad-hoc **`<button className="text-muted-foreground">`**.

- **Preferred implementation:** **`PageHeaderWithBack`** with `title="…"` and `backButton={{ onClick: () => { … } }}` (or `href` when routed). Optional **`actions`** for rare header CTAs; primary submit stays in the form footer (**§3.9**).

- **`FullPageHeader`:** Treat as **legacy**. New or refactored create flows should use **`PageHeaderWithBack`**. If **`FullPageHeader`** remains temporarily, it **must** be updated to match **`BackButton`** + **`h1` `text-lg font-semibold`** so it is visually identical to Pattern 04.

- **Unsaved changes:** The back handler must **confirm** when the form is dirty (**§6.7**) before calling `navigate`, clearing mode, or `onClick` completion.

### 3.3 Content width & alignment with the title

- **Column width:** Create / generate flows use the **full width** of the main content area (same as IQLDS list views). **Do not** cap the stack with a fixed **`max-w-[…]`** (e.g. 950px, `max-w-5xl`, `max-w-6xl`) unless product explicitly asks for a narrow form — guidelines are **from header through fields** in one continuous column (**§6.4**).

- **Alignment rule (required):** The **header row** (back + title) and **all cards** share the **same horizontal inset** — **`PageHeader`** already uses **`px-6`** on its inner row; place the **card / form stack** in a sibling below with the **same `px-6`** so title and fields align edge-to-edge with list pages.

- **Recommended DOM structure:** **`w-full h-full`** wrapper (or no width cap). **`PageHeaderWithBack`** then a **`space-y-4 px-6 py-4 h-full`** block for cards/forms (vertical inset + fill scroll column height).

```tsx
<PageShell>
  <div className="flex-1 overflow-auto">
    <div className="w-full h-full">
      <PageHeaderWithBack
        title="Create GRN"
        backButton={{ onClick: handleBackWithOptionalConfirm }}
        noBorder
      />
      <div className="space-y-4 px-6 py-4 h-full">
        {/* Cards / form — same px-6 as PageHeader title row */}
      </div>
    </div>
  </div>
</PageShell>
```

- **`noBorder` on `PageHeaderWithBack`:** Optional on full-page create flows; use **`noBorder`** if the default **`PageHeader` bottom border** feels redundant above the first card.

- **Padding note:** If you use **`px-4 md:px-6`** on the form column, apply the **same** horizontal padding to the header row (e.g. **`PageHeader` `className`** override) so title and cards still line up.

- **Sticky header:** Default **`PageHeader` `px-6`** is full-width content; keep the scrollable **form column** at the **same** horizontal padding — no separate “narrow centered” column for cards.

### 3.4 Sections = cards

- Each logical section is a **card**:
  - **`rounded-[10px]`** (or `rounded-lg` if unified later).
  - **Border:** `border` + `border-border`.
  - **Background:** `bg-card` / `bg-background`.
  - **Padding:** `p-5 md:p-6`.
  - **Vertical rhythm between cards:** `space-y-4` on the form wrapper.

### 3.5 Section titles

- **H2** per card: `text-base` or `text-lg` **`font-semibold`**, use **`text-foreground`** (light theme only).

### 3.6 Reference / read-only blocks

- When create depends on a **selected parent record**, show a **highlighted panel** inside the relevant card:
  - Subheading (e.g. “Sales Order Information”) + **context-specific badge** (**§6.6 example**).
  - Tinted / bordered panel; read-only grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`), small labels, **`Input readOnly`** with muted styling.

### 3.7 Required vs optional labels

Use **one** of these patterns per screen (choose based on how many fields are required):

| Situation | Convention |
|-----------|--------------|
| **Many required fields** (most fields mandatory) | Do **not** mark every required field. Mark **optional** fields only: suffix **`(optional)`** on the label (e.g. `Rate per unit (₹) (optional)`). |
| **Few required fields** (minority mandatory) | Mark **required** fields with a red **`*`** next to the label (typically before the label text). Optional fields have **no** marker. |

**Do not** mix `*` on every required field *and* `(optional)` on the same screen unless one section clearly uses the “many required” pattern and another the “few required” pattern (rare — avoid if possible).

### 3.8 Form fields (create layout)

- **Labels:** `text-xs font-medium` (or `text-sm` in looser sections) per **§3.7**.
- **Select triggers:** `h-9`, `rounded-lg`, muted fill consistent with inputs.
- **Text inputs:** `h-9`, `rounded-lg`, border from theme.
- **Read-only / auto:** muted background.
- **Hints:** `text-xs text-muted-foreground`.
- **Textarea:** `min-h-[100px]`, `rounded-lg`, full width in card.
- **Grids:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` as needed.

### 3.9 Footer actions

**Create pages (transactional / “add” flows):**

- **Header back** (**`PageHeaderWithBack`** / **`BackButton`** — **§3.2**) with dirty confirm on navigation (**§6.7**).
- **Footer row:** **`Cancel`** (`Button variant="outline"`) **and** **`Submit`** (`Button variant="default"`) — **both** must be present so users have an explicit cancel next to submit.

**Data / master “add” pages** (e.g. customer, category, rate masters — product may label these separately):

- **Back** in header is sufficient; **Cancel** in footer is **optional** if product classifies the page as “data page”. When in doubt, include **Cancel** for consistency with other creates.

Layout: `flex justify-end gap-2` (or `justify-between` if a left-aligned secondary action exists).

### 3.10 Modals vs full page

- **Create:** **full page** (this protocol).
- **Edit / View:** may stay **dialog**; full-page edit should reuse the **same card layout** as create.

### 3.11 Theme

- **Light mode only** for create flows in v1; no requirement to tune dark-mode tokens for these screens yet.

---

## 4. Button Guidelines

Use **`@/components/ui/button`**:

| Role | Variant | Size | Notes |
|------|---------|------|--------|
| Primary submit | `default` | `default` or `lg` | Uses **`--primary`** (teal — **§6.1**) |
| Cancel / dismiss | `outline` | `default` | Next to primary on create pages |
| Secondary | `secondary` or `outline` | `default` | |
| Destructive | `destructive` | `default` | |
| Toolbar / tables | `ghost` | `sm` | |

**Do not** use `className="bg-[#009689]"` on submit buttons; set **`--primary`** globally once (**§6.1**).

---

## 5. Rollout (Apply Create GRN Pattern)

| Module | Create flow | Notes |
|--------|-------------|--------|
| GRN | Create GRN | Reference implementation |
| Customer | Add Customer | Align cards/sections |
| Category | Add / edit | Align |
| Rate | Add Rate | Align |
| Sales Order | Create | Align |
| Invoice | Create | Align |
| Challan | Generate | Align |
| Certificate | Generate | Align |
| Gate Pass | Generate | Align |

---

## 6. Product decisions (approved)

### 6.1 Primary color

**Yes** — align app **`--primary`** (and primary button) with brand teal from mocks (e.g. **`#009689`**). Implement in global theme (`globals.css` / Tailwind theme), not per-page overrides.

### 6.2 Required vs optional labeling

- **Many required fields** → mark **optional** only: **`(optional)`** on label.
- **Few required fields** → mark **required** with **`*`** on label.

See **§3.7**.

### 6.3 Back vs Cancel

- **Create pages (transactions / generates):** **Back** (header) **and** **Cancel** (footer) **both** required.
- **Data pages:** **Back** alone is acceptable; Cancel optional.

See **§3.9**.

### 6.4 Max width

**No fixed max-width** on create / generate stacks by default: use the **full main column** with **`px-6`** (or matching list-page padding) from **`PageHeaderWithBack`** through form fields. Avoid arbitrary **`max-w-5xl` / `max-w-6xl`** unless product specifies a constrained layout.

### 6.5 Dark mode

**Light-only** for v1 create pages.

### 6.6 Reference panel badge — example

Use a **short, context-specific** badge that says what the block is — not a generic “Reference Data” unless nothing more specific fits.

**Example (Create GRN):**

- Panel title: **“Sales Order Information”**  
- Badge: **`From sales order`** or **`Reference order`** — describes that values come from the selected SO.

**Example (hypothetical Create Invoice from challans):**

- Panel title: **“Challan summary”**  
- Badge: **`From challan`**

Use **`Badge`** + **`primary`** or a subtle **`secondary`** variant so it stays on-brand without one-off hex.

### 6.7 Unsaved changes

**Confirm on back** (and treat **Cancel** the same way if the form is dirty): show a **confirm dialog** (“Discard changes?”) before leaving. Optionally also `beforeunload` for browser refresh/tab close if implemented app-wide.

### 6.8 Figma / Pencil vs doc + code

- **Figma / Pencil:** **Field structure** (layout of groups), **field names** / labels as starting copy, and **grouping** into sections.
- **This document + codebase:** **Everything else** — spacing, colors, typography tokens, button rules, layout width (full column + padding), required/optional rules, back/cancel behavior, confirmation flows.

### 6.9 Accessibility — example

**Target:** Meet **WCAG 2.1 Level AA** where practical for new/refactored create pages.

**Associate every control with a visible label:**

```tsx
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

{/* Text input */}
<div className="space-y-1">
  <Label htmlFor="grn-customer-challan">Customer challan number</Label>
  <Input id="grn-customer-challan" name="customer_challan" />
</div>

{/* Select: put id on trigger so htmlFor works */}
<div className="space-y-1">
  <Label htmlFor="grn-customer">Customer name</Label>
  <Select>
    <SelectTrigger id="grn-customer" className="w-full">
      <SelectValue placeholder="Select customer" />
    </SelectTrigger>
    <SelectContent>{/* items */}</SelectContent>
  </Select>
</div>
```

- Prefer **`htmlFor` + `id`** over `aria-label` when there is a visible label.
- For **error text**, link with **`aria-describedby`** on the input pointing to the error element `id`.
- **Submit** buttons: clear label text (“Create GRN”, not “Submit” only if ambiguous).

### 6.10 Language

**English only** for copy on create pages; no i18n dictionary required for v1.

---

## 7. Design inputs (Figma / Pencil)

Use exports **only** to:

- Decide **which fields** appear and **how they are grouped** into sections.
- Align **field names** with stakeholders before locking copy in code.

Do **not** treat mock **colors, exact px, or button styles** as authoritative — follow **§3–§4** and theme tokens instead.

---

## 8. Next Steps

1. Set **`--primary`** to brand teal in global styles (**§6.1**).
2. Remove remaining **`bg-[#009689]`** overrides on create flows; use **`Button variant="default"`**.
3. Implement **dirty-state confirm** on back/cancel for create pages (**§6.7**).
4. Add **Cancel** next to submit where missing on transactional create pages (**§3.9**).
5. Rename generic **“Reference Data”** badges to context-specific text where applicable (**§6.6**).
6. **Migrate create / generate pages** from **`FullPageHeader`** to **`PageHeaderWithBack`** (**§3.2**), with header + cards in one **full-width** column and matching **`px-6`** (**§3.3**).
7. (Optional) Extract shared classes e.g. `createPageCard`, `createPageSelectTrigger` in `lib/ui-classes.ts`.

---

## 9. Revision History

| Date | Change |
|------|--------|
| *(init)* | Intent from Create GRN + Button variants |
| *(approved)* | §6 filled: primary teal, required/optional rules, back+cancel, light-only, badge example, confirm on back, Figma/Pencil scope, a11y example, English-only |
| *(update)* | §3.2–§3.3: IQLDS **`PageHeaderWithBack` / `BackButton` + `h1` title**; header + cards share **`px-6`** full-width column |
| *(update)* | §3.3 / §6.4: removed fixed **`max-w-[950px]`** — create flows use full content width like list pages |
| *(update)* | §3.1: page scroll column matches **IQLDS list views** — **no** full-column **`bg-muted`**; contrast from **cards** only |
