/**
 * Gaama ERP – Domain types per BRD/PRD
 */

export type UserRole =
  | "admin"
  | "sales"
  | "warehouse"
  | "operations"
  | "finance"
  | "compliance"

// ─── Customer Master ─────────────────────────────────────────────────────────
export interface Customer {
  customer_id: string
  customer_name: string
  company_name: string
  email: string
  phone: string
  billing_address: string
  shipping_addresses: string[]
  gst_number: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

// ─── Category Master ─────────────────────────────────────────────────────────
export interface Category {
  category_id: string
  category_name: string
  description: string
  created_at: string
}

// ─── Rate Master ─────────────────────────────────────────────────────────────
export interface Rate {
  rate_id: string
  category_id: string
  rate_value: number
  currency: string
  effective_date: string
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
  | "in_production"
  | "dispatched"
  | "invoiced"
  | "closed"

export interface SalesOrder {
  sales_order_id: string
  customer_id: string
  order_date: string
  order_status: OrderStatus
  items: SalesOrderItem[]
  total_amount: number
  tax_amount: number
  created_by: string
  created_at: string
}

// ─── GRN ─────────────────────────────────────────────────────────────────────
export interface ReceivedItem {
  item_id: string
  category_id: string
  quantity_received: number
  condition: "good" | "damaged" | "short"
}

export interface GRN {
  grn_id: string
  supplier: string
  purchase_order: string
  received_items: ReceivedItem[]
  received_date: string
  warehouse_location: string
  status: "pending" | "verified" | "rejected"
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

export interface Challan {
  challan_id: string
  sales_order_id: string
  dispatch_date: string
  items: ChallanItem[]
  vehicle_details: string
  driver_name: string
}

// ─── Gate Pass ────────────────────────────────────────────────────────────────
export interface GatePass {
  gatepass_id: string
  challan_id: string
  vehicle_number: string
  security_approval: boolean
  timestamp: string
}

// ─── Invoice ──────────────────────────────────────────────────────────────────
export type PaymentStatus = "pending" | "paid" | "partial" | "overdue"

export interface Invoice {
  invoice_id: string
  sales_order_id: string
  invoice_date: string
  amount: number
  tax: number
  grand_total: number
  payment_status: PaymentStatus
}

// ─── Certificate ───────────────────────────────────────────────────────────────
export interface Certificate {
  certificate_id: string
  sales_order_id: string
  issued_date: string
  certificate_type: string
  file_url: string
  status: "draft" | "issued" | "revoked"
}
