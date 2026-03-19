# Gaama ERP Feature Parity – Intent Document  
**Superseded by:** [GAAMA_ERP_2_SOURCE_OF_TRUTH.md](./GAAMA_ERP_2_SOURCE_OF_TRUTH.md) — use that as the single source of truth.

---

**Purpose:** Bring the GammaERP codebase to full feature parity with the reference app **Gaama ERP 2** (`d:\Projects\Gama ERP\Gaama ERP 2`), including all button actions, processes, and workflows that are currently missing.

**Reference codebase:** `d:\Projects\Gama ERP\Gaama ERP 2`  
**Target codebase:** `D:\Projects\Gama ERP\GammaERP` (this repo)

---

## 1. Process I Will Follow

1. **Analyse** – Compare Gaama ERP 2 and GammaERP module-by-module (pages, DataContext, types).
2. **Gap list** – Enumerate missing actions, buttons, flows, and data shapes.
3. **Prioritise** – Implement in dependency order (masters → Sales Order → GRN → Challan → Invoice → Certificate / Gate Pass).
4. **Implement** – Add missing handlers, wire to existing `DataContext`, extend types where needed.
5. **Reuse patterns** – Keep GammaERP’s existing patterns (PageShell, PageHeader, Dialog, FormSection, `useData`, `canAccess`) and align behaviour to Gaama ERP 2’s flows.

No full rewrite; only add missing operations and align flows so that “every button and process” from Gaama ERP 2 exists in GammaERP.

---

## 2. What Already Exists in GammaERP

| Area | Status |
|------|--------|
| **Navigation & routes** | ✅ All modules present (Dashboard, Customers, Categories, Rates, Sales Orders, GRN, Process Tracking, Challan, Gate Pass, Invoices, Certificates). |
| **DataContext** | ✅ Full CRUD API for all entities; localStorage persistence; role-based `canAccess`. |
| **Customer Master** | ✅ Create, Edit, View; `addCustomer` / `updateCustomer` wired. |
| **Category Master** | ✅ Create, Edit, View; `addCategory` / `updateCategory` wired. |
| **Rate Master** | ✅ Create, Edit, View; `addRate` / `updateRate` wired. |
| **Sales Orders** | ✅ Create, View; `addSalesOrder` wired; multi-line items; rate from category. |
| **GRN** | ✅ Create, View; `addGRN` wired (current form: supplier, PO, received_items). |
| **Process Tracking** | ✅ Create (by order ID), View; `addProcessTracking` wired. |
| **Challan** | ✅ Create, View; `addChallan` wired (current form: sales_order_id, items). |
| **Gate Pass** | ✅ Create, View; `addGatePass` wired. |
| **Invoices** | ✅ Create, View; `addInvoice` wired. |
| **Certificates** | ✅ Create, View; `addCertificate` wired. |

So: **nav and pages are there; create (and where present, edit/view) are wired.** What’s missing is the **extra actions, edit flows, and process steps** that Gaama ERP 2 has.

---

## 3. Gap Analysis – What Is Left to Implement

### 3.1 Sales Orders

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Edit Sales Order** | ❌ Only Create + View | Add Edit mode: open form with existing order, call `updateSalesOrder` on Save. |
| **Approve Order** | ❌ | Add “Approve” button when status = Draft; on confirm, call `updateSalesOrder(id, { order_status: "confirmed" })` (or equivalent). |
| **View GRNs linked to order** | ❌ | On Order View, show list of GRNs for this `sales_order_id` with “View” linking to GRN view. |

### 3.2 GRN (Goods Receipt Note)

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Create GRN from Sales Order** | ❌ (current: generic supplier/PO) | Add SO dropdown; on select, auto-fill customer, category, product, quantity from SO; then add vehicle number, received qty, pricing, etc. |
| **Edit GRN** | ❌ | Add Edit mode and `updateGRN` on Save. |
| **Print Sticker** | ❌ | Add “Print Sticker” action; modal for sticker range (e.g. start/end); optional integration with `getNextStickerNumber` if we add it; print/export UI. |
| **Send for Processing** | ❌ | Add “Send for Processing” button; either navigate to Process Tracking with this GRN/order pre-selected or update GRN/process status and then navigate. |

### 3.3 Challan Management

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Create Challan from GRN(s)** | ❌ (current: from sales_order + manual items) | Flow: select one or more GRNs → auto-fill lines and details from GRN(s). |
| **Shipping address** | ❌ | If customer has multiple addresses, show dropdown for “Dispatch to” (use Customer’s `shipping_addresses`). |
| **Edit Challan** | ❌ | Add Edit mode and `updateChallan` on Save. |
| **Generate Challan (confirm)** | ⚠️ Partial (form submit creates) | Align with Gaama 2: explicit “Generate Challan” step and document number generation. |
| **Print / Export** | ❌ | Add Print and Export (e.g. PDF) actions on view. |

### 3.4 Invoice Management

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Create from Pending** | ⚠️ Partial | Explicit “pending” list (e.g. SO/challans ready for invoice); “Create Invoice” selects SO + challans; rate from Rate Master; compute GST/total. |
| **Edit Invoice** | ❌ | Add Edit mode and `updateInvoice` on Save. |
| **View / Print / Export** | ❌ | View detail screen; Print and Export (e.g. PDF) buttons. |

### 3.5 Gate Pass

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Generate Gate Pass** (from challan/record) | ⚠️ Partial (generic create form) | List records eligible for gate pass; “Generate” opens form/modal pre-filled from challan; generate number and save. |
| **View Gate Pass** | ❌ | View-only modal or page with full details. |
| **Print Gate Pass** | ❌ | Print button on view. |

### 3.6 Certificate Management

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Generate Certificate** (from GRN/order) | ⚠️ Partial | List pending; “Generate” opens modal with product rows, dose, etc.; on confirm call `addCertificate` (and optionally `updateCertificate` for status). |
| **Create Certificate modal** | ❌ | Full modal with product rows (add/remove), batch/lot, sticker range, dates. |
| **View / Print / Download** | ❌ | View certificate; Print and Download (e.g. PDF) buttons. |

### 3.7 Customer Master

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Multiple shipping addresses** | ⚠️ Type has `shipping_addresses: string[]` | UI: add/remove addresses, set default; store as array of objects or strings per current type. |

### 3.8 Category Master

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Subcategories** | ❌ (no subcategories in type) | Optional: extend Category with `subcategories` and add Add/Remove subcategory in form. |

### 3.9 Rate Master

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Delete Rate** | ❌ | Delete button with confirmation dialog; call `deleteRate(id)` (add to context if not present). |

### 3.10 Shared / UX

| Feature in Gaama ERP 2 | Status in GammaERP | Intent |
|------------------------|--------------------|--------|
| **Confirmation dialogs** | ❌ | Use AlertDialog for Approve, Delete, Send for Processing, etc. |
| **Search / filters** | ❌ | Add search and filters (e.g. by date, customer) on list pages (GRN, Sales Order, Challan, Invoice, Certificate). |
| **Toast / feedback** | ⚠️ | Success/error toasts after save, approve, generate, etc. (e.g. sonner). |

---

## 4. Data Model and Context Alignment

- **Where needed:** Extend `gaama-types.ts` and `DataContext` so that:
  - GRN can reference `sales_order_id` and carry pricing/GST/sticker range if we implement that flow.
  - Challan can reference GRN(s) and shipping address.
  - Invoice can reference challans and have pricing breakdown (base, GST, total).
  - Certificate can have product rows and certificate-specific fields.
- **DataContext:** Add any missing methods (e.g. `deleteRate`, `deleteCustomer`, etc.) and ensure all new buttons call these or existing add/update APIs.

---

## 5. Implementation Order (Dependency-Friendly)

1. **Masters (smallest scope)**  
   - Rate: add Delete + confirmation.  
   - Customer: multiple shipping addresses UI.  
   - Category: optional subcategories (type + UI).

2. **Sales Order**  
   - Edit Sales Order.  
   - Approve button + confirmation.  
   - In View, show linked GRNs with View link.

3. **GRN**  
   - Create from Sales Order (dropdown + auto-fill).  
   - Edit GRN.  
   - Print Sticker modal.  
   - Send for Processing (action + optional navigation).

4. **Challan**  
   - Create from GRN(s); shipping address from customer.  
   - Edit Challan.  
   - Print / Export.

5. **Invoice**  
   - Pending list; Create from SO + challans; pricing from Rate.  
   - Edit, View, Print, Export.

6. **Gate Pass**  
   - Generate from challan; View modal; Print.

7. **Certificate**  
   - Generate from GRN/order; Create Certificate modal with product rows; View / Print / Download.

8. **Global**  
   - Confirmation dialogs (AlertDialog) for destructive/critical actions.  
   - Search/filter on list pages.  
   - Toasts for success/error.

---

## 6. What You Can Expect From Me

- **One module at a time:** I will implement in the order above (or as you prioritise) and keep each change reviewable.
- **No breaking changes to existing flows:** Current Create/View that already work will keep working; I will only add Edit, Approve, and other actions alongside them.
- **Same stack:** React, TypeScript, existing UI components (Dialog, Button, Select, Input, Table, etc.), `DataContext`, and routing.
- **Reference behaviour:** For each button or process, behaviour will match Gaama ERP 2’s intent (approve order, create GRN from SO, create challan from GRN, generate invoice/certificate/gate pass, print/export where applicable).

---

## 7. Summary Table

| Module           | Pages/Nav | Create | Edit | View | Missing actions / processes |
|------------------|-----------|--------|------|------|-----------------------------|
| Customer         | ✅        | ✅     | ✅   | ✅   | Multiple shipping addresses UI. |
| Category         | ✅        | ✅     | ✅   | ✅   | Optional subcategories. |
| Rate             | ✅        | ✅     | ✅   | ✅   | Delete + confirm. |
| Sales Order      | ✅        | ✅     | ❌   | ✅   | Edit; Approve; View GRNs. |
| GRN              | ✅        | ✅     | ❌   | ✅   | From SO; Edit; Print Sticker; Send for Processing. |
| Process Tracking | ✅        | ✅     | -    | ✅   | (Mostly done; link from GRN.) |
| Challan          | ✅        | ✅     | ❌   | ✅   | From GRN(s); shipping address; Edit; Print/Export. |
| Invoice          | ✅        | ✅     | ❌   | ✅   | Pending flow; Edit; Print/Export. |
| Gate Pass        | ✅        | ✅     | -    | ✅   | Generate from challan; View modal; Print. |
| Certificate      | ✅        | ✅     | -    | ✅   | Generate from GRN/order; product rows modal; View/Print/Download. |

This document is the **intent and process** I will follow to make GammaERP match Gaama ERP 2 in features, button actions, and processes. If you want to adjust the order or scope (e.g. skip subcategories or defer search/filters), we can narrow or expand the list accordingly.
