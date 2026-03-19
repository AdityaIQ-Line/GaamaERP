# Exact Gaama ERP 2 Replica – Intent Document  
**Superseded by:** [GAAMA_ERP_2_SOURCE_OF_TRUTH.md](./GAAMA_ERP_2_SOURCE_OF_TRUTH.md) — use that as the single source of truth.

---

**Goal:** Build an **exact feature replica** of **Gaama ERP 2** inside the current GammaERP branch. When users click specific elements (Add Customer, Add Category, Add Rate, Create New Order, Create GRN, Process Tracking > Export), the **parameters, validation, and processes** must match Gaama ERP 2. The pages **Challan Management, Gate Pass, Invoice Management, Certificate Management, and Process Tracking** are currently wrong in GammaERP and will be fixed to match Gaama ERP 2’s structure, flows, and behaviour.

**Reference codebase:** `d:\Projects\Gama ERP\Gaama ERP 2`  
**Target codebase:** `D:\Projects\Gama ERP\GammaERP` (this repo)

---

## 1. What I Understood

### 1.1 Your requirements

1. **Exact parameters and processes** for these user actions:
   - **Add Customer** – Same form fields, steps, validation, and payload as Gaama ERP 2.
   - **Add Category** – Same fields (category name, dose count/unit, status, description, subcategories), validation, and save behaviour.
   - **Add Rate** – Same fields (category, pricing type, rate, customer-specific, effective/expiry dates, etc.), validation, and save behaviour.
   - **Create New Order** – Same flow: customer selection → product/category → measurement type → quantity, net/gross weight, sticker range, order basis (vehicle/weight/standard), Save as Draft / Save & Approve.
   - **Create GRN** – Same flow: select Customer → select Sales Order (filtered by customer and remaining quantity) → auto-fill from SO → GRN fields (challan number, radiation dose, received qty, net/gross weight, pricing/GST, processing priority, etc.) → Submit.
   - **Process Tracking > Export** – Same behaviour: Export button exports the process tracking table data (e.g. CSV/Excel) with the current filters applied.

2. **Five areas are “totally wrong”** and must be fixed to match Gaama ERP 2:
   - **Challan Management** – Layout, tabs (Pending / Delivery), create-from-GRN flow, shipping address from customer, Generate Challan, Edit, View, Print/Export.
   - **Gate Pass** – Layout, data source (challans/GRNs with process status), filters, table columns, Generate / View / Print actions and modals.
   - **Invoice Management** – Tabs (Pending Generation / Invoices), pending list logic, Create Invoice from pending row, generated invoices list, View/Edit/Print/Export.
   - **Certificate Management** – Tabs (Pending Generation / Certificate), pending list, Generate Certificate opening Create Certificate form, View/Print/Download.
   - **Process Tracking** – Data source (GRNs not in Pending status), table columns (Sl.No, GRN No, Sales Order No, Product Category, Customer, Quantity, Units, Status, Action), Search + Customer/Category/Status filters, Update status modal (with Hold/Rejected requiring remarks, Rejected auto-creating Gate Pass), and **Export** button behaviour.

3. **Overall objective:** GammaERP should behave as an **exact feature replica** of Gaama ERP 2, reusing the same flows, field names, validation rules, and UI structure where applicable, adapted to GammaERP’s stack (React, existing layout/components, DataContext).

---

## 2. Exact Parameters and Processes (When User Clicks)

### 2.1 Add Customer

**Source:** Gaama ERP 2 `CustomerMasterNew.tsx` + `DataContext.addCustomer`.

**Flow:**

- **Entry:** Click “+ New Customer” (or “Add Customer”).
- **UI:** Multi-step form (steps 1–4) with breadcrumb “Customer Master / Add New Customer”.
- **Step 1 – Basic info:**  
  Customer Code (auto: `CUS` + padded number), Customer Name*, Customer Type, Email*, Phone, Mobile*, Alternate Mobile, Website, Industry Type, Channel Type, Contact Person.
- **Step 2 – Address:**  
  Billing: Address, State, City, Pincode, Country (default India).  
  Shipping: One or more addresses; each: Address, State, City, Pincode, Country; Add/Remove; first is default.
- **Step 3 – Taxation/Legal/Financial:**  
  GST Registration Type, GST Number, State Code, PAN, Tax Filing Frequency, Payment Terms, Credit Limit, Opening Balance, Bank Name, Account Number, IFSC, KYC Document.
- **Step 4 – Review/Submit.**  
  Validation: required fields per step; all shipping address fields if any added.  
  On Submit: map form to DataContext `Customer`: `name`, `email`, `phone`, `billingAddress` (full string), `shippingAddresses` (array of `{ id, address, city, state, pincode, isDefault }`), `termsOfDelivery`, `gstNumber`, `panNumber`, `contactPerson`, `customerCode`, `customerType`, `website`, `industryType`, `city`, `state`, `pincode`, `kycDocument`.  
  Then: success message, close form, refresh list.

**Intent in GammaERP:** Replace current Add Customer with this multi-step form and exact payload to `addCustomer` (extending types/context if needed).

---

### 2.2 Add Category

**Source:** Gaama ERP 2 `CategoryMaster.tsx` + `DataContext.addCategory` / `updateCategory`.

**Flow:**

- **Entry:** Click “Add Category” (or “Add Product Category”).
- **UI:** Full-page form with breadcrumb “Product Category / Add Product Category”.
- **Fields:**  
  Category Name* (text), Dose Count* (number), Dose Unit* (default “kGy”), Status (e.g. Active), Description (textarea).  
  Subcategories: list of names; “Add subcategory” (input + add), remove per row.
- **Validation:** Category Name, Dose Count, Dose Unit required.
- **Save:** If new: `addCategory({ categoryName, doseCount, doseUnit, status, description, subcategories: [{ id, name, createdAt }], createdBy, updatedBy, updatedAt })`. If edit: `updateCategory(id, same shape)`. Success message, close form, refresh list.

**Intent in GammaERP:** Category form must use these fields and payloads; types must support `doseCount`, `doseUnit`, `status`, `subcategories`, `createdBy`, `updatedBy`, `updatedAt`.

---

### 2.3 Add Rate

**Source:** Gaama ERP 2 `RateMaster.tsx` + `EditRate.tsx` + `DataContext.addRate` / `updateRate` / `deleteRate`.

**Flow:**

- **Entry:** Click “Add Rate” (or “Add New”).
- **UI:** Form (inline or modal): Category* (dropdown from DataContext categories; on select auto-fill Category Unit from category’s doseUnit), Category Unit (read-only/display), Pricing Type* (e.g. “By Carton” / “By Weight” / “By Vehicle”), Rate Per Unit*, Status (e.g. Active), Description.  
  Customer-specific: toggle; if ON, show Customer (dropdown) and Effective Date / Expiry Date.
- **Validation:** Category, Pricing Type, Rate Per Unit required.
- **Save:** `addRate({ categoryId, categoryName, pricingType, rate, status?, description?, customerId?, customerName?, effectiveFrom, effectiveTo })`. Edit: `updateRate(id, …)`. Delete: confirmation dialog then `deleteRate(id)`.

**Intent in GammaERP:** Rate form and table must match these fields; add `deleteRate` to context if missing; implement Edit (same form pre-filled) and Delete with confirm.

---

### 2.4 Create New Order (Sales Order)

**Source:** Gaama ERP 2 `SalesOrderForm.tsx` + `DataContext.addSalesOrder`.

**Flow:**

- **Entry:** From Sales Order list, click “+ Create Sales Order” (or “Create Order”).
- **UI:** Full form with sections:  
  - Sales Order Number (auto, read-only), Date*.  
  - Customer: dropdown* → auto-fill Customer Name, Address, Email, Phone.  
  - Product: Category* → Products (from category subcategories) → Product Name*. Measurement Type* (carton / bag / weight). Quantity* (label/placeholder by type: “Number of Cartons” etc.). Net Weight*, Gross Weight* (validation: gross ≥ net).  
  - Order basis: Standard / Vehicle / Weight. If Weight: “Weight type for invoicing” (Net / Gross).  
  - If carton/bag: Sticker range – Starting Sticker No (auto from `getNextStickerNumber`), Ending Sticker No (auto from start + quantity − 1).  
  - Notes (optional).
- **Actions:** “Save as Draft” and “Save & Approve”.  
  Validation: Customer, Product Name, Category, Net Weight, Gross Weight, Measurement Type, Quantity; gross ≥ net.
- **Save:** `addSalesOrder({ customerId, customerName, categoryId, categoryName, productId, productName, quantity, unit, measurementType, isVehicleBasis, orderBasis, weightTypeForInvoicing, orderDate, deliveryDate, status: "Draft" | "Approved", netWeight, grossWeight, stickerRangeStart, stickerRangeEnd, notes? })`. Success message then callback (e.g. back to list).

**Intent in GammaERP:** Replace current Create Order with this form (single product per order as in reference), same validation and payload; ensure DataContext and types support all these fields.

---

### 2.5 Create GRN

**Source:** Gaama ERP 2 `CreateGRN.tsx` + `DataContext.addGRN`.

**Flow:**

- **Entry:** From GRN list, click “+ Create GRN” (or “Create GRN”).
- **UI:** Single page.  
  - **Section: Select Customer & Sales Order**  
    Customer Name* (dropdown from DataContext).  
    Sales Order Number* (dropdown filtered by selected customer; only SOs where total received qty < SO quantity, status not Completed/Cancelled).  
    On SO select: auto-fill product/category/unit from SO.  
  - **Section: GRN details**  
    GRN Number (auto e.g. `GRN-YYYY-MM###`).  
    Customer Challan Number* (delivery challan number).  
    Purchase Order Date, Received Quantity*, Received By*.  
    Net Weight*, Gross Weight* (validation: net ≤ gross).  
    Radiation Dose (auto from category if mapped), Radiation Unit (e.g. kGy).  
    Remarks.  
  - **Section: Pricing & GST**  
    Rate (optional), Total Amount, GST Rate %, GST Amount, Total with GST (auto-calc from total + GST).  
  - **Section: Processing & Storage**  
    Processing Priority, Bin Description.
- **Submit:** Validation as above; then `addGRN({ salesOrderId, salesOrderNumber, customerId, customerName, categoryId, categoryName, productId, productName, customerChallanNumber, vehicleNumber?, receivedQuantity, unit, netWeight, grossWeight, purchaseOrderDate, processingPriority, receivedDate, status: "Pending", rate?, pricing, gstPercentage, gstAmount, totalAmount, receivedBy, radiationDose, radiationUnit, remarks, binDescription })`. Success message and `onSuccess()` (e.g. back to GRN list).

**Intent in GammaERP:** Replace current GRN create (generic supplier/PO) with this Customer → Sales Order → GRN flow and exact fields/validation/payload; DataContext GRN type must align (e.g. salesOrderId, salesOrderNumber, customerChallanNumber, pricing, GST, radiation, etc.).

---

### 2.6 Process Tracking > Export

**Source:** Gaama ERP 2 `ProcessTracking.tsx` – Export button (top-right).

**Flow:**

- **Trigger:** User clicks “Export” (icon FileDown + label “Export”) on the Process Tracking page.
- **Behaviour:** Export the **currently filtered** process tracking table data (columns: Sl.No, GRN No, Sales Order No, Product Category, Customer, Quantity, Units, Status, and any Action column excluded) to a file. Typical implementation: CSV or Excel; filename can include timestamp. No extra modal required unless you want a format choice.

**Intent in GammaERP:** Add an Export button to Process Tracking that builds a CSV (or Excel) from the current `filteredRecords` and triggers download. Same placement and label as in Gaama ERP 2.

---

## 3. What Is Wrong in GammaERP and How It Will Be Fixed

### 3.1 Process Tracking page

**Current issues:**

- Data source may not match: Gaama ERP 2 uses **GRNs with status ≠ "Pending"** (i.e. sent for processing) and maps them to a process record (Sl.No, GRN No, Sales Order No, Product Category, Customer, Quantity, Units, Created At, Status, Action).
- Update flow: row Action opens a modal to change Status (e.g. Hold, Completed, Rejected, In Progress); **Hold and Rejected require Remarks**; on **Rejected**, auto-create a Gate Pass (Defect).
- Filters: Search, Customer, Product Category, Status.
- **Export** button missing or not exporting the table with current filters.

**Fix:**

- Build process records from `grns.filter(grn => grn.status !== "Pending")` (or equivalent status that means “sent for processing”).
- Table columns and filters as above; Update status modal with validation and `updateGRN`; on Rejected call `addGatePass` with processingType “Defect”.
- Add Export: from current filtered list, generate CSV/Excel and download.

---

### 3.2 Challan Management

**Current issues:**

- GammaERP Challan is a simple “sales_order_id + items + dispatch” form. Gaama ERP 2 has:
  - **Tabs:** “Pending” (GRNs not yet linked to a challan) and “Delivery” (generated challans).
  - **Create flow:** From Pending tab, select one or more GRNs → form shows GRN lines, customer shipping address dropdown (from Customer Master), dispatch details → “Generate Challan” → create challan with status “Generated”, link GRNs.
  - **Delivery tab:** List of challans with View, Edit, Print/Export.
  - Challan model: grnNumbers (comma-separated), shipping address, includeGST, delivery note date, customer order date, dispatched through, pricing/GST fields, dispatch/party details, etc.

**Fix:**

- Redesign Challan page: two tabs (Pending / Delivery).
- Pending: list GRNs that don’t yet have a challan (from DataContext); “Create Challan” per row or multi-select → open create form. Form: select GRNs, shipping address from customer’s addresses, dispatch details, then Generate Challan → `addChallan` with full payload.
- Delivery: table of challans; View (modal or page), Edit (`updateChallan`), Print/Export.
- Align `Challan` type and DataContext with Gaama ERP 2 (grnNumbers, shippingAddress, status, pricing fields, etc.).

---

### 3.3 Gate Pass

**Current issues:**

- GammaERP Gate Pass is a generic create form. Gaama ERP 2:
  - **Data source:** Gate pass records come from challans/GRNs (e.g. after process tracking or from rejected GRNs). `GatePassRecord`: challanId, challanNumber, customer, productCategory, productName, quantity, units, challanDateTime, processStatus (Hold/Completed), gatePassStatus (Pending/Generated), gatePassNumber, etc.
  - **Page:** Filters (Search, Customer, Category, Status); table with columns Challan No., Customer, Product Category, Product Name, Quantity, Challan Date & Time, Process Status, Gate Pass Status, Actions.
  - **Actions:** Generate (opens GenerateGatePassModal), View (ViewGatePassModal), Print (same as View with print).

**Fix:**

- Gate pass list built from DataContext `gatePasses` (or derived from challans/GRNs as in reference).
- Same filters and table columns; same actions: Generate (modal to fill and set gatePassNumber/date, then `updateGatePass`), View modal, Print from view.
- Ensure types and context support `GatePassRecord` shape (challanId, challanNumber, processStatus, gatePassStatus, etc.).

---

### 3.4 Invoice Management

**Current issues:**

- GammaERP has a single create/view flow. Gaama ERP 2 has:
  - **Tabs:** “Pending Generation” and “Invoices”.
  - **Pending:** List of items ready for invoice (e.g. sales orders with completed challans); columns Sl.No, Sales Order No., Challan No., Product Category, Customer, Quantity, Unit, Requested Date/Time, Action (“Create Invoice”).
  - **Create Invoice:** Opens CreateInvoice (or modal) with SO + challans selected; pricing from Rate Master; GST/total calculation; Generate Invoice → `addInvoice` and move to Invoices tab.
  - **Invoices tab:** List of generated invoices; columns Invoice Number, Sales Order No., Category, Customer, Quantity, Unit, Created At, Total Amount, Action (View, Edit, Print).
  - View/Edit/Print/Export for generated invoices.

**Fix:**

- Two tabs: Pending Generation, Invoices.
- Pending: compute “pending” list from DataContext (e.g. SOs with delivered challans, no invoice yet); table + “Create Invoice” per row opening create flow with SO + challans and rate/GST logic.
- Invoices: table of invoices; View, Edit (`updateInvoice`), Print, Export.
- Align Invoice type with Gaama ERP 2 (salesOrderId, challanNumbers, pricing breakdown, customer/shipping details, etc.).

---

### 3.5 Certificate Management

**Current issues:**

- GammaERP Certificate is a simple create/view. Gaama ERP 2 has:
  - **Tabs:** “Pending Generation (count)” and “Certificate (count)”.
  - **Pending:** Records (e.g. from GRNs/orders) with status “Pending”; Action “Generate Certificate” opens **CreateCertificateForm** (full-screen or large modal) with product rows, batch/lot, sticker range, dates, irradiation details, etc. On submit, create/update certificate and switch to Certificate tab.
  - **Certificate tab:** List of generated certificates; View (ViewCertificate), Print, Download.
  - Export button in filters row for certificate list.

**Fix:**

- Two tabs with counts; filters (Search, Customer, Category) and Export.
- Pending: list certificates with status Pending (or derive from GRNs); “Generate Certificate” opens CreateCertificateForm with exact fields and product rows as in Gaama ERP 2; on save, `addCertificate` or `updateCertificate` and refresh.
- Certificate tab: table with View, Print, Download; ViewCertificate full-screen/modal with same layout as reference.

---

## 4. How I Will Proceed

### 4.1 Principles

- **Exact replica:** Forms, fields, validation, and context payloads will match Gaama ERP 2. Where types differ, I will extend GammaERP’s `gaama-types` and `DataContext` to match the reference.
- **No unnecessary rewrites:** Existing layout (PageShell, PageHeader, routing) and UI library will be kept; only the page content and flows will be replaced or extended.
- **One area at a time:** Implement in dependency order so that downstream pages (Challan, Invoice, Certificate, Gate Pass) have the correct data shape and context APIs.

### 4.2 Implementation order

1. **Types and DataContext**  
   Extend/align `gaama-types.ts` and `DataContext.tsx` with Gaama ERP 2: Customer (shipping addresses, extra fields), Category (doseCount, doseUnit, status, subcategories), Rate (pricingType, customer-specific, effectiveTo), SalesOrder (orderBasis, weightTypeForInvoicing, sticker range, net/gross), GRN (salesOrderId, customerChallanNumber, pricing, GST, radiation, etc.), Challan (grnNumbers, shipping, status, pricing), Invoice (full breakdown, challanNumbers), GatePassRecord, CertificateRecord. Add any missing methods (e.g. deleteRate, getNextStickerNumber).

2. **Add Customer**  
   Implement multi-step Add Customer form with exact fields and `addCustomer` payload (and Customer type extensions).

3. **Add Category**  
   Implement Add/Edit Category form with dose count/unit, status, description, subcategories, and correct add/update payloads.

4. **Add Rate**  
   Implement Add/Edit Rate form with category, pricing type, rate, customer-specific, dates; add Delete with confirmation and `deleteRate`.

5. **Create New Order**  
   Implement Create Sales Order form with customer → category → product, measurement type, quantity, net/gross weight, order basis, sticker range, Save as Draft / Save & Approve and correct `addSalesOrder` payload.

6. **Create GRN**  
   Implement Create GRN: Customer → Sales Order (filtered) → auto-fill → GRN details + pricing/GST + processing; correct `addGRN` payload.

7. **Process Tracking**  
   Rebuild page: data from GRNs (status ≠ Pending), table, filters, Update status modal (with Hold/Reject remarks and Rejected → Gate Pass). Add **Export** button (CSV/Excel of filtered table).

8. **Challan Management**  
   Rebuild: Pending / Delivery tabs; create from GRN(s), shipping address, Generate Challan; list with View, Edit, Print/Export.

9. **Gate Pass**  
   Rebuild: list from gatePasses (or derived), filters, table, Generate / View / Print modals and behaviour.

10. **Invoice Management**  
    Rebuild: Pending Generation / Invoices tabs; pending list, Create Invoice from row (SO + challans + rate/GST); Invoices list with View, Edit, Print, Export.

11. **Certificate Management**  
    Rebuild: Pending Generation / Certificate tabs; pending list, Generate Certificate → CreateCertificateForm; Certificate list with View, Print, Download, Export.

### 4.3 Verification

- For each of the six actions (Add Customer, Add Category, Add Rate, Create Order, Create GRN, Process Tracking > Export), I will verify: same fields, same validation, same payload to context (or documented deviation with reason).
- For Challan, Gate Pass, Invoice, Certificate, Process Tracking: I will verify layout (tabs, filters, table columns) and actions (Create, View, Edit, Print, Export/Download) match Gaama ERP 2 behaviour.

---

## 5. Summary

| Item | What you want | How I will proceed |
|------|----------------|---------------------|
| Add Customer | Exact parameters and process as Gaama ERP 2 | Multi-step form, same fields and validation, same `addCustomer` payload; extend Customer type if needed. |
| Add Category | Exact parameters and process | Form with categoryName, doseCount, doseUnit, status, description, subcategories; same add/update payload. |
| Add Rate | Exact parameters and process | Form with category, pricing type, rate, customer-specific, dates; Edit + Delete with confirm. |
| Create New Order | Exact parameters and process | Full form: customer → product/category, measurement, weight, order basis, sticker range; Draft / Approve; same `addSalesOrder` payload. |
| Create GRN | Exact parameters and process | Customer → Sales Order (filtered) → auto-fill; GRN fields + pricing/GST; same `addGRN` payload. |
| Process Tracking > Export | Same behaviour as Gaama ERP 2 | Export button that downloads filtered table as CSV/Excel. |
| Challan Management | Currently wrong | Rebuild with Pending/Delivery tabs, create-from-GRN, shipping address, Generate/Edit/View/Print/Export. |
| Gate Pass | Currently wrong | Rebuild with list from context, filters, table, Generate/View/Print modals. |
| Invoice Management | Currently wrong | Rebuild with Pending/Invoices tabs, Create Invoice from pending, View/Edit/Print/Export. |
| Certificate Management | Currently wrong | Rebuild with Pending/Certificate tabs, Generate → CreateCertificateForm, View/Print/Download/Export. |
| Process Tracking page | Currently wrong | Rebuild data source (GRNs not Pending), table, filters, Update modal (Hold/Reject + remarks, Rejected → Gate Pass), Export. |

This document is the single reference for what “exact replica” means and in what order the work will be done. If you want to change scope or order, we can update this document and then proceed accordingly.
