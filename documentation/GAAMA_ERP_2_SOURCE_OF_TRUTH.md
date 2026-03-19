# Gaama ERP 2 – Single Source of Truth

**This document is the only source of truth** for building an **exact feature replica** of **Gaama ERP 2** inside GammaERP. Nothing from Gaama ERP 2 is out of scope.

- **Reference:** `d:\Projects\Gama ERP\Gaama ERP 2`
- **Target:** `D:\Projects\Gama ERP\GammaERP` (this repo)

---

## Part A – Goal and Principles

### A.1 Goal

- GammaERP = **exact feature replica** of Gaama ERP 2.
- **Exact parameters and processes** for: Add Customer, Add Category, Add Rate, Create New Order, Create GRN, Process Tracking > Export.
- **Five areas rebuilt to match:** Process Tracking, Challan Management, Gate Pass, Invoice Management, Certificate Management.
- **No scope left behind:** Every button, action, flow, field, and validation from Gaama ERP 2 must exist in GammaERP.

### A.2 Principles

- **Exact replica:** Forms, fields, validation, and context payloads match Gaama ERP 2. Extend types/DataContext as needed.
- **Reuse stack:** PageShell, PageHeader, Dialog, FormSection, `useData`, `canAccess`; only replace or extend page content and flows.
- **Dependency order:** Types/Context → Masters → Sales Order → GRN → Process Tracking → Challan → Gate Pass → Invoice → Certificate.
- **Confirmation dialogs** for Approve, Delete, Send for Processing (AlertDialog).
- **Search/filters** on list pages; **toasts** (e.g. sonner) for success/error.

---

## Part B – Current State (GammaERP)

| Area | Exists | Missing / Wrong |
|------|--------|------------------|
| Nav & routes | ✅ All modules | – |
| DataContext | ✅ CRUD, localStorage, canAccess | deleteRate, getNextStickerNumber; types need Gaama 2 shape |
| Customer | ✅ Create, Edit, View | Multi-step form; multiple shipping addresses (add/remove/set default); full field set |
| Category | ✅ Create, Edit, View | doseCount, doseUnit, status, subcategories; exact payload |
| Rate | ✅ Create, Edit, View | pricingType, customer-specific, effectiveTo; Delete + confirm |
| Sales Order | ✅ Create, View | Edit; Approve; View GRNs on order; single-product form with orderBasis, sticker range, net/gross |
| GRN | ✅ Create, View | From Sales Order (Customer → SO filtered); Edit; Print Sticker; Send for Processing; full GRN fields |
| Process Tracking | ✅ Create by order, View | Data from GRNs (status ≠ Pending); table columns; filters; Update status modal (Hold/Reject + remarks; Rejected → Gate Pass); Export |
| Challan | ✅ Create, View | Tabs Pending/Delivery; create from GRN(s); shipping address; Edit; Print/Export |
| Gate Pass | ✅ Create, View | List from context; filters; Generate/View/Print modals; GatePassRecord shape |
| Invoice | ✅ Create, View | Tabs Pending/Invoices; Create from pending; Edit; Print/Export |
| Certificate | ✅ Create, View | Tabs Pending/Certificate; Generate → CreateCertificateForm; View/Print/Download/Export |

---

## Part C – Full Scope (Nothing Left Behind)

### C.1 Add Customer

- **Entry:** "+ New Customer" / "Add Customer".
- **UI:** Multi-step (1–4), breadcrumb "Customer Master / Add New Customer".
- **Step 1:** Customer Code (auto CUS+pad), Customer Name*, Customer Type, Email*, Phone, Mobile*, Alternate Mobile, Website, Industry Type, Channel Type, Contact Person.
- **Step 2:** Billing: Address, State, City, Pincode, Country (India). Shipping: multiple addresses (Address, State, City, Pincode, Country); Add/Remove; first = default.
- **Step 3:** GST Registration Type, GST Number, State Code, PAN, Tax Filing Frequency, Payment Terms, Credit Limit, Opening Balance, Bank Name, Account Number, IFSC, KYC Document.
- **Step 4:** Review & Submit.
- **Validation:** Required per step; all shipping fields if any.
- **Payload:** name, email, phone, billingAddress, shippingAddresses[{ id, address, city, state, pincode, isDefault }], termsOfDelivery, gstNumber, panNumber, contactPerson, customerCode, customerType, website, industryType, city, state, pincode, kycDocument.
- **Also:** View customer (full view screen); Edit customer (same multi-step pre-filled); Delete customer (optional; confirm).

### C.2 Add / Edit Category

- **Entry:** "Add Category" / "Add Product Category".
- **UI:** Full-page form; breadcrumb "Product Category / Add or Edit Product Category".
- **Fields:** Category Name*, Dose Count*, Dose Unit* (default kGy), Status (e.g. Active), Description. Subcategories: list of names; Add subcategory (input + add); Remove per row.
- **Validation:** Category Name, Dose Count, Dose Unit required.
- **Save:** addCategory / updateCategory with categoryName, doseCount, doseUnit, status, description, subcategories[{ id, name, createdAt }], createdBy, updatedBy, updatedAt.
- **List:** Search; Table vs Listing view toggle; Edit (opens form); optional Delete with confirm.

### C.3 Add / Edit / Delete Rate

- **Entry:** "Add Rate" / "Add New".
- **Form:** Category* (dropdown; on select auto-fill Category Unit from category.doseUnit), Category Unit (read-only), Pricing Type* (By Carton / By Weight / By Vehicle), Rate Per Unit*, Status, Description. Customer-specific toggle → Customer dropdown, Effective Date, Expiry Date.
- **Validation:** Category, Pricing Type, Rate Per Unit required.
- **Save:** addRate / updateRate with categoryId, categoryName, pricingType, rate, status, description, customerId?, customerName?, effectiveFrom, effectiveTo.
- **Delete:** Confirmation dialog → deleteRate(id).
- **List:** Search; table with Edit, Delete.

### C.4 Create New Order (Sales Order)

- **Entry:** "+ Create Sales Order" / "Create Order".
- **Form:** Sales Order Number (auto, read-only), Date*. Customer* (dropdown → auto-fill Name, Address, Email, Phone). Product: Category* → Products (from category subcategories) → Product Name*. Measurement Type* (carton / bag / weight). Quantity* (label by type). Net Weight*, Gross Weight* (gross ≥ net). Order basis: Standard / Vehicle / Weight; if Weight: Weight type for invoicing (Net/Gross). If carton/bag: Sticker range (Start auto from getNextStickerNumber, End = start + qty − 1). Notes optional.
- **Actions:** "Save as Draft", "Save & Approve".
- **Payload:** customerId, customerName, categoryId, categoryName, productId, productName, quantity, unit, measurementType, isVehicleBasis, orderBasis, weightTypeForInvoicing, orderDate, deliveryDate, status Draft|Approved, netWeight, grossWeight, stickerRangeStart, stickerRangeEnd, notes.
- **List:** View, Edit, Approve (when Draft). On View: show linked GRNs with View link.

### C.5 Create GRN

- **Entry:** "+ Create GRN".
- **Flow:** Section 1 – Customer* (dropdown) → Sales Order* (filtered by customer; only where total received < SO quantity; status not Completed/Cancelled). On SO select: auto-fill product, category, unit. Section 2 – GRN Number (auto), Customer Challan Number*, Purchase Order Date, Received Quantity*, Received By*, Net Weight*, Gross Weight* (net ≤ gross), Radiation Dose (auto from category if mapped), Radiation Unit (e.g. kGy), Remarks. Section 3 – Rate (optional), Total Amount, GST Rate %, GST Amount, Total with GST (auto). Section 4 – Processing Priority, Bin Description.
- **Submit:** addGRN with salesOrderId, salesOrderNumber, customerId, customerName, categoryId, categoryName, productId, productName, customerChallanNumber, vehicleNumber?, receivedQuantity, unit, netWeight, grossWeight, purchaseOrderDate, processingPriority, receivedDate, status Pending, rate?, pricing, gstPercentage, gstAmount, totalAmount, receivedBy, radiationDose, radiationUnit, remarks, binDescription.
- **GRN List:** View, Edit, Print Sticker, Send for Processing (update status and/or navigate to Process Tracking).

### C.6 Process Tracking

- **Data source:** GRNs with status ≠ "Pending" (sent for processing). Map to rows: Sl.No, GRN No, Sales Order No, Product Category, Customer, Quantity, Units, Created At, Status, Action.
- **Filters:** Search, Customer, Product Category, Status.
- **Action:** Update status modal: Status (Hold, Completed, Rejected, In Progress). Hold and Rejected require Remarks. On Rejected: auto-create Gate Pass (Defect).
- **Export:** Button exports current filtered table to CSV/Excel (columns except Action).

### C.7 Challan Management

- **Tabs:** Pending (GRNs not yet in a challan), Delivery (generated challans).
- **Pending:** List GRNs; "Create Challan" (per row or multi-select) → form: select GRN(s), shipping address from customer.addresses, dispatch details → "Generate Challan" → addChallan with grnNumbers, shippingAddress, status Generated, pricing fields, etc.
- **Delivery:** Table of challans; View, Edit (updateChallan), Print, Export (e.g. PDF).
- **Challan type:** grnNumbers (comma-separated), shippingAddress, status (Generated|Dispatched|Delivered), includeGST, deliveryNoteDate, customerOrderDate, dispatchedThrough, baseAmount, gstAmount, gstPercentage, totalAmount, dispatch/party fields.

### C.8 Gate Pass

- **Data source:** DataContext gatePasses (or derived from challans/GRNs). GatePassRecord: challanId, challanNumber, customerId, customerName, productCategory, productName, quantity, units, challanDateTime, processStatus (Hold|Completed), gatePassStatus (Pending|Generated), gatePassNumber, gatePassDate, processingType, driverName, vehicleNo, etc.
- **Page:** Filters (Search, Customer, Category, Status). Table: Challan No., Customer, Product Category, Product Name, Quantity, Challan Date & Time, Process Status, Gate Pass Status, Actions.
- **Actions:** Generate (modal → set gatePassNumber/date, updateGatePass), View (modal), Print (from view).

### C.9 Invoice Management

- **Tabs:** Pending Generation, Invoices.
- **Pending:** List items ready for invoice (e.g. SO + completed challans, no invoice yet). Columns: Sl.No, Sales Order No., Challan No., Product Category, Customer, Quantity, Unit, Requested Date/Time, Action "Create Invoice". Create Invoice opens form with SO + challans, rate from Rate Master, GST/total → addInvoice.
- **Invoices:** Table: Invoice Number, Sales Order No., Category, Customer, Quantity, Unit, Created At, Total Amount, Action (View, Edit, Print, Export).
- **Invoice type:** salesOrderId, salesOrderNumber, challanNumbers, customer/shipping details, baseAmount, rate, gstPercentage, cgstAmount, sgstAmount, totalGstAmount, totalAmount, status (Pending|Generated|Paid|Overdue), etc.

### C.10 Certificate Management

- **Tabs:** Pending Generation (count), Certificate (count).
- **Pending:** List records status Pending (or from GRNs). Action "Generate Certificate" → CreateCertificateForm (full-screen or large modal): product rows (add/remove), batch/lot, sticker range, dates, irradiation details. On submit: addCertificate/updateCertificate; switch to Certificate tab.
- **Certificate tab:** Table; View (ViewCertificate), Print, Download. Export button in filters row.
- **Certificate type:** salesOrderId, salesOrderNumber, productCategory, productName, customerId, customerName, quantity, units, status (Pending|Generated), certificateNo, and all certificate detail fields (daeLicenseNo, aerbLicenseNo, crn, inw, jw, soDate, totalBoxes, totalNetWeight, totalGrossWeight, unitSerialFrom, unitSerialTo, irradiationCompleteDate, minimumDose, averageDose, dosimeterBatch, productRows, etc.).

### C.11 Shared / UX

- **Confirmation dialogs:** AlertDialog for Approve order, Delete rate/customer/category, Send for Processing, etc.
- **Search and filters:** On list pages (Customer, Category, Rate, Sales Order, GRN, Process Tracking, Challan, Gate Pass, Invoice, Certificate).
- **Toasts:** Success/error after save, approve, generate, delete (e.g. sonner).

---

## Part D – Implementation Order

1. **Types and DataContext** – Align gaama-types and DataContext with Gaama ERP 2 (all entities). Add deleteRate, getNextStickerNumber; optional deleteCustomer, deleteCategory. Ensure GRN has sales_order_id/customer_challan_number/pricing/GST/radiation; Challan has grn_numbers/status/shipping; Invoice/ Certificate/GatePass full shapes.
2. **Add Customer** – Multi-step form, exact fields and payload; multiple shipping addresses; View/Edit screens.
3. **Add Category** – Form with doseCount, doseUnit, status, subcategories; Add/Edit; list with search and view toggle.
4. **Add Rate** – Form with category, pricingType, rate, customer-specific, dates; Add/Edit/Delete with confirm.
5. **Create New Order** – Single-product form; customer → category → product; measurement, weight, order basis, sticker range; Draft/Approve; list with View, Edit, Approve, View GRNs.
6. **Create GRN** – Customer → Sales Order (filtered) → auto-fill; full GRN fields; list with View, Edit, Print Sticker, Send for Processing.
7. **Process Tracking** – Rebuild: data from GRNs (≠ Pending), table, filters, Update modal (Hold/Reject + remarks; Rejected → Gate Pass), Export.
8. **Challan Management** – Rebuild: Pending/Delivery tabs; create from GRN(s); shipping address; View, Edit, Print, Export.
9. **Gate Pass** – Rebuild: list, filters, table; Generate, View, Print modals.
10. **Invoice Management** – Rebuild: Pending/Invoices tabs; Create from pending; View, Edit, Print, Export.
11. **Certificate Management** – Rebuild: Pending/Certificate tabs; Generate → CreateCertificateForm; View, Print, Download, Export.
12. **Global** – Confirmation dialogs everywhere needed; search/filters on all list pages; toasts.

---

## Part E – Summary Tables

### E.1 Actions and Parameters

| Action | Exact behaviour |
|--------|------------------|
| Add Customer | Multi-step 1–4; all fields in C.1; payload to addCustomer. |
| Add Category | Form in C.2; addCategory payload. |
| Add Rate | Form in C.3; addRate; Delete with confirm. |
| Create New Order | Form in C.4; addSalesOrder; Draft / Approve. |
| Create GRN | Flow in C.5; addGRN. |
| Process Tracking > Export | Export filtered table CSV/Excel. |

### E.2 Pages to Rebuild

| Page | Required structure and actions |
|------|--------------------------------|
| Process Tracking | GRNs ≠ Pending; table; filters; Update modal; Export. |
| Challan Management | Tabs Pending/Delivery; create from GRN(s); shipping; View, Edit, Print, Export. |
| Gate Pass | List; filters; table; Generate, View, Print. |
| Invoice Management | Tabs Pending/Invoices; Create from pending; View, Edit, Print, Export. |
| Certificate Management | Tabs Pending/Certificate; Generate → CreateCertificateForm; View, Print, Download, Export. |

### E.3 Module Parity

| Module | Create | Edit | View | Other actions |
|--------|--------|------|------|----------------|
| Customer | ✅ multi-step | ✅ multi-step | ✅ full view | Optional Delete |
| Category | ✅ with subcategories | ✅ | ✅ | Table/List toggle; optional Delete |
| Rate | ✅ | ✅ | ✅ | Delete + confirm |
| Sales Order | ✅ single-product | ✅ | ✅ | Approve; View GRNs |
| GRN | ✅ from SO | ✅ | ✅ | Print Sticker; Send for Processing |
| Process Tracking | – | Update status | – | Export |
| Challan | ✅ from GRN(s) | ✅ | ✅ | Print; Export |
| Gate Pass | – | – | ✅ | Generate; View; Print |
| Invoice | ✅ from pending | ✅ | ✅ | Print; Export |
| Certificate | ✅ Generate form | – | ✅ | Print; Download; Export |

---

**End of source of truth.** All implementation must follow this document; no scope from Gaama ERP 2 is excluded.
