/**
 * Gaama ERP – Domain types aligned with Gaama ERP 2 (SOURCE_OF_TRUTH)
 * Existing fields kept for backward compatibility; new fields added for full replica.
 */

export type UserRole =
  | "admin"
  | "sales"
  | "warehouse"
  | "operations"
  | "finance"
  | "compliance"

// ─── Shipping Address (for Customer) ─────────────────────────────────────────
export interface ShippingAddress {
  id: string
  address: string
  city?: string
  state?: string
  pincode?: string
  is_default: boolean
}

// ─── Customer Master ─────────────────────────────────────────────────────────
export interface Customer {
  customer_id: string
  customer_name: string
  company_name?: string
  email: string
  phone: string
  billing_address: string
  /** Legacy: string[]. Prefer shipping_addresses_typed when present. */
  shipping_addresses?: string[]
  /** Gaama ERP 2: structured addresses with add/remove/set default */
  shipping_addresses_typed?: ShippingAddress[]
  gst_number: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
  // Gaama ERP 2 extras
  terms_of_delivery?: string
  pan_number?: string
  contact_person?: string
  customer_code?: string
  customer_type?: string
  website?: string
  industry_type?: string
  city?: string
  state?: string
  pincode?: string
  kyc_document?: string
  trade_license_number?: string
  iec_code?: string
  msme_registration?: string
  supporting_documents?: string
  // Step 3 Tax/Legal/Financial (C.1)
  gst_registration_type?: string
  state_code?: string
  tax_filing_frequency?: string
  payment_terms?: string
  credit_limit?: string
  opening_balance?: string
  bank_name?: string
  account_number?: string
  ifsc?: string
}

// ─── SubCategory (for Category) ───────────────────────────────────────────────
export interface SubCategory {
  id: string
  name: string
  created_at: string
}

// ─── Category Master ─────────────────────────────────────────────────────────
export interface Category {
  category_id: string
  category_name: string
  description?: string
  created_at: string
  // Gaama ERP 2
  dose_count?: number
  dose_unit?: string
  status?: string
  subcategories?: SubCategory[]
  created_by?: string
  updated_by?: string
  updated_at?: string
}

// ─── Rate Master ─────────────────────────────────────────────────────────────
export type PricingType = "By Carton" | "By Bag" | "By Weight" | "By Vehicle"

export interface Rate {
  rate_id: string
  category_id: string
  category_name?: string
  rate_value: number
  /** Gaama ERP 2: same as rate_value, for compatibility */
  rate?: string
  currency?: string
  effective_date: string
  effective_from?: string
  effective_to?: string
  /** When the rate row was created (Rate Master list). */
  created_at?: string
  // Gaama ERP 2
  pricing_type?: PricingType
  customer_id?: string
  customer_name?: string
  status?: string
  description?: string
}

// ─── Sales Order ─────────────────────────────────────────────────────────────
export interface SalesOrderItem {
  item_id: string
  category_id: string
  quantity: number
  rate: number
  total_price: number
}

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "Draft"
  | "Approved"
  | "approved"
  | "Completed"
  | "Cancelled"
  | "in_production"
  | "dispatched"
  | "invoiced"
  | "closed"

export interface SalesOrder {
  sales_order_id: string
  order_number?: string
  sales_order_number?: string
  customer_id: string
  customer_name?: string
  order_date: string
  delivery_date?: string
  order_status: OrderStatus
  items: SalesOrderItem[]
  total_amount: number
  tax_amount?: number
  created_by?: string
  created_at: string
  // Gaama ERP 2 single-product style (optional; when set, takes precedence for display)
  category_id?: string
  category_name?: string
  product_id?: string
  product_name?: string
  quantity?: string
  unit?: string
  measurement_type?: string
  order_basis?: "standard" | "vehicle" | "weight"
  weight_type_for_invoicing?: "net" | "gross"
  net_weight?: string
  gross_weight?: string
  sticker_range_start?: number
  sticker_range_end?: number
  notes?: string
  is_vehicle_basis?: boolean
}

// ─── GRN ─────────────────────────────────────────────────────────────────────
export interface ReceivedItem {
  item_id: string
  category_id: string
  quantity_received: number
  condition: "good" | "damaged" | "short"
}

export type GRNStatus = "pending" | "Pending" | "verified" | "rejected" | "Hold" | "Completed" | "Rejected" | "In Progress"

export interface GRN {
  grn_id: string
  grn_number?: string
  supplier?: string
  purchase_order?: string
  received_items?: ReceivedItem[]
  received_date: string
  warehouse_location?: string
  status: GRNStatus
  // Gaama ERP 2
  sales_order_id?: string
  sales_order_number?: string
  customer_id?: string
  customer_name?: string
  category_id?: string
  category_name?: string
  product_id?: string
  product_name?: string
  customer_challan_number?: string
  vehicle_number?: string
  received_quantity?: string
  unit?: string
  net_weight?: string
  gross_weight?: string
  purchase_order_date?: string
  processing_priority?: string
  assigned_bin?: string
  rate?: string
  pricing?: string
  gst_percentage?: string
  gst_amount?: string
  total_amount?: string
  received_by?: string
  radiation_dose?: string
  radiation_unit?: string
  remarks?: string
  bin_description?: string
  /** Quality / processing (read-only display on GRN form; optional in seed). */
  inspection_status?: string
  quality_remarks?: string
  processing_instructions?: string
  sticker_range_start?: number
  sticker_range_end?: number
  stickers_printed?: boolean
  created_at?: string
}

// ─── Process Tracking ────────────────────────────────────────────────────────
export type ProcessStage = "received" | "processing" | "quality_check" | "completed"

export interface ProcessTracking {
  id: string
  sales_order_id: string
  current_stage: ProcessStage
  updated_at: string
  notes?: string
}

// ─── Challan ──────────────────────────────────────────────────────────────────
export interface ChallanItem {
  item_id: string
  category_id: string
  quantity: number
}

export type ChallanStatus = "Generated" | "Dispatched" | "Delivered"

export interface Challan {
  challan_id: string
  challan_number?: string
  sales_order_id: string
  sales_order_number?: string
  grn_numbers?: string
  product_category?: string
  customer_name?: string
  customer_id?: string
  quantity?: string
  units?: string
  dispatch_date: string
  items: ChallanItem[]
  vehicle_details?: string
  driver_name?: string
  status?: ChallanStatus
  shipping_address?: string
  include_gst?: boolean
  delivery_note_date?: string
  customer_order_date?: string
  dispatched_through?: string
  base_amount?: string
  gst_amount?: string
  gst_percentage?: string
  total_amount?: string
  dispatch_to?: string
  dispatch_city?: string
  dispatch_pincode?: string
  dispatch_phone?: string
  dispatch_email?: string
  dispatch_gstin?: string
  party?: string
  party_city?: string
  party_pincode?: string
  party_phone?: string
  party_email?: string
  party_gstin?: string
  delivery_note?: string
  terms_of_delivery?: string
  hsn_sac_code?: string
  created_at?: string
}

// ─── Gate Pass (GatePassRecord) ────────────────────────────────────────────────
export type ProcessStatus = "Hold" | "Completed"
export type GatePassStatus = "Pending" | "Generated"

export interface GatePass {
  gatepass_id: string
  challan_id: string
  challan_number?: string
  customer_id?: string
  customer_name?: string
  product_category?: string
  product_name?: string
  quantity?: string
  units?: string
  challan_date_time?: string
  process_status?: ProcessStatus
  gate_pass_status?: GatePassStatus
  gate_pass_number?: string
  gate_pass_date?: string
  processing_type?: string
  driver_name?: string
  vehicle_number?: string
  vehicle_no?: string
  mobile_no?: string
  vehicle_seal_number?: string
  security_approval?: boolean
  timestamp: string
  created_at?: string
}

// ─── Invoice ──────────────────────────────────────────────────────────────────
export type PaymentStatus = "pending" | "paid" | "partial" | "overdue"
export type InvoiceStatus = "Pending" | "Generated" | "Paid" | "Overdue"

export interface Invoice {
  invoice_id: string
  invoice_number?: string
  sales_order_id: string
  sales_order_number?: string
  customer_id?: string
  customer_name?: string
  category_id?: string
  category_name?: string
  product_id?: string
  product_name?: string
  challan_numbers?: string
  quantity?: string
  unit?: string
  net_weight?: string
  gross_weight?: string
  invoice_date?: string
  amount: number
  tax: number
  grand_total: number
  total_amount?: string
  payment_status: PaymentStatus
  status?: InvoiceStatus
  requested_date_time?: string
  created_at?: string
  base_amount?: string
  rate?: string
  gst_percentage?: string
  cgst_amount?: string
  sgst_amount?: string
  total_gst_amount?: string
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  shipping_pincode?: string
  shipping_phone?: string
  shipping_email?: string
  shipping_gstin?: string
  shipping_contact?: string
  handling_charge?: string
  transportation_charge?: string
  discount_amount?: string
  terms_of_delivery?: string
  hsn_sac_code?: string
  other_reference?: string
  order_basis?: string
  measurement_type?: string
  customer_gstin?: string
  customer_pan?: string
  customer_state?: string
  customer_state_code?: string
  customer_address?: string
  customer_city?: string
  customer_pincode?: string
  customer_phone?: string
  customer_email?: string
  customer_code?: string
}

// ─── Certificate (CertificateRecord) ───────────────────────────────────────────
export type CertificateStatus = "draft" | "issued" | "revoked" | "Pending" | "Generated"

export interface CertificateProductRow {
  sr_no: number
  description: string
  quantity: string
  batch: string
}

export interface Certificate {
  certificate_id: string
  sales_order_id: string
  sales_order_number?: string
  product_category?: string
  product_name?: string
  customer_id?: string
  customer_name?: string
  quantity?: string
  units?: string
  issued_date?: string
  certificate_type?: string
  file_url?: string
  status: CertificateStatus
  certificate_no?: string
  client_ref_order_no?: string
  batch_lot_no?: string
  sticker_range_start?: number
  sticker_range_end?: string
  created_at?: string
  dae_license_no?: string
  aerb_license_no?: string
  crn?: string
  inw?: string
  jw?: string
  so_date?: string
  total_boxes?: string
  total_net_weight?: string
  total_gross_weight?: string
  number_of_standard_units?: string
  unit_serial_from?: string
  unit_serial_to?: string
  irradiation_complete_date?: string
  customer_address?: string
  customer_inv_no?: string
  invoice_date?: string
  minimum_dose?: string
  average_dose?: string
  dosimeter_batch?: string
  product_rows?: CertificateProductRow[]
}
