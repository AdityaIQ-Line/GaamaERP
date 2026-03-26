# Gamma ERP — Implementation Intent

**Status:** Planning / alignment (not a substitute for signed-off PRDs).  
**Sources:** Functional & field-level spec (Obsidian), in-repo audit vs `src/`, **[CREATE_PAGES_DESIGN_INTENT.md](./CREATE_PAGES_DESIGN_INTENT.md)**, **[GAAMA_ERP_2_SOURCE_OF_TRUTH.md](./GAAMA_ERP_2_SOURCE_OF_TRUTH.md)** (if present).

---

## 1. What we understood

### 1.1 Product scope

The business flow is:

**Masters → Sales Order → GRN → Processing → Delivery Challan → Gate Pass → Invoice → Certificate**

The functional document defines **fields, validations, list columns, actions, and calculations** per module. The codebase (`GammaERP`) is a **working Gaama/IQLDS-style app** with `DataContext` + seed-style data and pages under `src/pages/gaama/`.

### 1.2 UX / UI protocol

- **Create / generate** flows: full page, **`PageShell`** + **`PageHeaderWithBack`** + **`space-y-4 px-6 py-4`**, cards on default page surface (no full-column `bg-muted`). Documented in **CREATE_PAGES_DESIGN_INTENT**.
- **View / edit** (primary record): **same full-page shell by default**, not modal dialogs — unless the module explicitly specifies a modal or the task is auxiliary (confirm destroy, print sticker, quick status update). Documented in **CREATE_PAGES_DESIGN_INTENT §3.10** and **navigation.md**.

### 1.3 Gap types

When we “implement the spec,” changes fall into:

| Type | Meaning |
|------|--------|
| **Field** | Missing label/input, wrong mandatory flag, wrong default |
| **Options** | Dropdown values don’t match spec (e.g. dispatch modes) |
| **Actions** | List row actions wrong (e.g. View+Edit vs Delete) |
| **Calculation** | Totals, remaining qty, sticker range, GST display logic |
| **Data model** | Type/API in `gaama-types` or `DataContext` doesn’t carry needed fields |
| **Surface** | Dialog vs full page for view/edit/detail |

---

## 2. How we will proceed (method)

1. **Lock one module at a time** (or one vertical slice, e.g. “Challan create only”) to avoid inconsistent half-migrations.
2. **Read spec section** → **read types** (`src/lib/gaama-types.ts`) → **read page + context** (`DataContext.tsx`, relevant `*Page.tsx`).
3. **List deltas** as: *current behaviour* → *target behaviour* → *files to touch*.
4. **Implement** with minimal scope: match existing patterns (Challan/Sales Order full-page detail is the reference for view/edit).
5. **Verify:** `npm run build`, quick manual pass on the screen, update this doc’s “done” table when a slice ships.

**Order recommendation (business + dependency):**

1. **Masters** (Category, Rate) — small, unblock SO/GRN labels.  
2. **Sales Order** — listing/detail/edit parity, sticker math, validations copy.  
3. **GRN** — field completeness, edit scope, processing priority options.  
4. **Process tracking** — status/reason rules; optional navigation after Rejected.  
5. **Challan** — dispatch options, include-GST UI, shipping “Add new”.  
6. **Gate pass** — capture logistics on generate (types already exist).  
7. **Invoice** — create/edit fields vs spec; wire types already on `Invoice`.  
8. **Certificate** — field-level mandatory audit vs create form.

---

## 3. Current vs planned — by module

Legend: **Done (in repo)** = already implemented in a recent pass or prior work. **Planned** = still to do unless marked done.

### 3.1 Category Master

| Aspect | Current | Planned change |
|--------|---------|----------------|
| List actions | **View + Edit** (no delete) | **Aligned** with spec. |
| List columns | **Category Name**, **Subcategory**, Dose (combined), Status, **Created At**; description on view/detail only | **Aligned** with spec table record. |
| Dose in create/edit | **Single “Dose (kGy)”** field (numeric value + kGy suffix); stored as `dose_count` + `dose_unit: kGy` | **Aligned** with fixed-unit rule (no separate unit control). |
| Full-page add/edit | Yes (`PageHeaderWithBack`) | Keep; align copy/validation messages to spec. |

**Files:** `src/pages/gaama/CategoriesPage.tsx`, possibly `gaama-types.ts`, `DataContext.tsx`.

---

### 3.2 Rate Master

| Aspect | Current | Planned change |
|--------|---------|----------------|
| Pricing types | By Carton / Bag / Weight / Vehicle | **Aligned** with spec. |
| Customer-specific toggle + customer | Present | **Aligned**. |
| Effective / expiry | Present | **Aligned**. |
| List actions | Edit + Delete | **Aligned** with spec. |

**Files:** Mostly stable; `RatesPage.tsx`, types.

---

### 3.3 Sales Order (create, list, view, edit)

| Aspect | Current | Planned change |
|--------|---------|----------------|
| Create: draft / approve | Save draft + Save & approve | **Largely aligned**; verify toast/validation strings vs spec. |
| Sticker range | End = start + qty − 1; start from sequence | **Aligned** in logic. |
| Listing | No **S.No**; extra **Approve** on draft rows | Add S.No if required; document or keep Approve as UX enhancement. |
| View: quantity cards, GRN list, fulfillment | Present with **GRN Date** in linked GRN table | **Aligned**. |
| GRN row action | Link to GRN with `openGrnId` | **Aligned**; ensure GRN page opens detail reliably. |
| Edit: allowed fields | Measurement type, quantity (labeled as **Number of Cartons/Bags** or Quantity kg), gross/net weight | **Aligned** with narrowed edit scope (extra weight-type control removed from edit). |
| Customer phone mandatory | Enforced at save: selected customer must have phone | **Aligned**. |

**Files:** `SalesOrdersPage.tsx`, possibly `gaama-types.ts`.

---

### 3.4 GRN

| Aspect | Current | Planned change |
|--------|---------|----------------|
| Row actions | View, Edit, Print sticker, Send for processing | **Aligned** with spec. |
| Edit scope | Qty + weights editable in edit mode; other sections read-only in view | **Tighten** edit mode so only spec’d fields are writable if product insists. |
| Processing priority | Create GRN uses **High / Medium / Low** dropdown (default Medium) | **Aligned** with spec options. |
| Storage bin | `bin_description` on type | Ensure label “Storage Bin Description” and visibility on create. |
| Print sticker | Dialog with editable processing date | **Keep as dialog** (per protocol exception). |

**Files:** `GRNPage.tsx`, `print-sticker-dialog.tsx`, types/context as needed.

---

### 3.5 Process tracking

| Aspect | Current | Planned change |
|--------|---------|----------------|
| Statuses | In Progress, Hold, Completed, Rejected | **Aligned**. |
| Hold / Rejected reason | Required remarks | **Aligned**. |
| Rejected → gate pass | Creates `GatePass` record and redirects user to Gate Pass module | **Aligned** with spec intent. |
| Update UI | **Dialog** for status update | **Keep as modal** (auxiliary workflow per §3.10). |

**Files:** `ProcessTrackingPage.tsx`, `DataContext.tsx` (if navigation side effects).

---

### 3.6 Delivery Challan

| Aspect | Current | Planned change |
|--------|---------|----------------|
| View/edit surface | **Full pages** (no dialog) | **Done** — keep as reference. |
| Dispatch through options | **Vehicle, By Person, By Post** | **Aligned** with spec options. |
| Include GST in total | UI checkbox in create flow, persisted to challan (`include_gst`) | **Aligned**. |
| Shipping address | Dropdown + free text + **Add New** persisted to customer addresses | **Aligned** with spec intent. |
| Partial dispatch / remaining qty | Present in create table | **Keep**; verify formulas vs spec. |

**Files:** `ChallanPage.tsx`, `CustomersPage.tsx` or context for address CRUD, types.

---

### 3.7 Gate pass

| Aspect | Current | Planned change |
|--------|---------|----------------|
| Generate flow | Full page: number, date, processing type, vehicle number, driver, mobile, seal | **Aligned** with required logistics capture and persisted to `GatePass` fields. |
| View surface | **Full page** with cards (replacing dialog), populated from generated logistics fields | **Aligned**. |
| List / print | Opens full view + print | **Done** pattern. |

**Files:** `GatePassPage.tsx`, `DataContext.tsx` (`updateGatePass` / seed).

---

### 3.8 Invoice

| Aspect | Current | Planned change |
|--------|---------|----------------|
| View/edit surface | **Full pages** (replacing dialog) | **Done** for shell; **extend** content with spec fields over time. |
| Create flow | Includes SO ref, date, base, GST%, discount, handling/transport toggles + charges, HSN/SAC, shipping address, terms, other reference, computed totals | **Aligned** for current spec field set. |
| List print | Opens view then print | **Done** pattern. |

**Files:** `InvoicesPage.tsx`, types, context.

---

### 3.9 Certificate

| Aspect | Current | Planned change |
|--------|---------|----------------|
| View surface | **Full page** (replacing dialog) | **Done** for layout. |
| Generate flow | Full page form with mandatory checks for batch/lot, irradiation date, min/avg dose, DAE/AERB licenses, dosimeter batch, and product rows | **Aligned** for mandatory matrix baseline. |
| List print | Opens view then print | **Done** pattern. |

**Files:** `CertificatesPage.tsx`, types, context.

---

### 3.10 Cross-cutting: view / edit / detail surfaces

| Module | Current (after recent work) | Notes |
|--------|----------------------------|--------|
| Challan | Full-page view + edit | Reference implementation. |
| Sales Order | Full-page create / view / edit | Reference. |
| GRN | Full-page create / view / edit | Reference. |
| Gate pass | Full-page generate + **full-page view** | Dialog removed for view. |
| Invoice | Full-page create + **full-page view/edit** | Dialog removed. |
| Certificate | Full-page generate + **full-page view** | Dialog removed. |
| Process tracking | **Dialog** for status update | Intentional exception. |
| Masters (Category, Rate, Customer) | Full-page add/edit where applicable | AlertDialog for destructive confirm only. |

---

## 4. What will not be in the first implementation pass

- **Backend/API replacement** — app remains client-side `DataContext` unless product adds a real API.
- **i18n** — English-only per create-page intent.
- **Dark mode** tuning for new screens — light-first.
- **Rewriting every module in one PR** — phased per §2.

---

## 5. Success criteria (for “spec alignment” phases)

- [ ] Each module’s **critical path** matches the functional doc: fields, options, primary actions, and key calculations.
- [ ] **No primary record view/edit** left in `Dialog` without an explicit exception in this doc or module spec.
- [ ] `npm run build` clean; no regressions on existing flows (create GRN, create SO, challan, etc.).
- [ ] **CREATE_PAGES_DESIGN_INTENT** + **navigation.md** remain the UX source of truth; this file updated when a slice completes.

---

## 6. Revision history

| Date | Author / context | Change |
|------|------------------|--------|
| *(init)* | Cursor / user request | Intent doc: understanding, method, current vs planned matrix, done vs remaining. |
