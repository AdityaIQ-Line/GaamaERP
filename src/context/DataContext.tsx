import * as React from "react"
import { createGaamaSeedData } from "@/data/gaama-seed-data"
import type {
  Customer,
  Category,
  Rate,
  SalesOrder,
  GRN,
  ProcessTracking,
  Challan,
  GatePass,
  Invoice,
  Certificate,
  UserRole,
} from "@/lib/gaama-types"

export const DEFAULT_STORAGE_KEY = "gaama-erp-data"
export const SANDBOX_STORAGE_KEY = "gaama-erp-sandbox-data"

export interface DataState {
  customers: Customer[]
  categories: Category[]
  rates: Rate[]
  salesOrders: SalesOrder[]
  grns: GRN[]
  processTrackings: ProcessTracking[]
  challans: Challan[]
  gatePasses: GatePass[]
  invoices: Invoice[]
  certificates: Certificate[]
}

export interface DataContextValue extends DataState {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  addCustomer: (c: Omit<Customer, "customer_id" | "created_at" | "updated_at">) => Customer
  updateCustomer: (id: string, c: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  getCustomer: (id: string) => Customer | undefined
  addCategory: (c: Omit<Category, "category_id" | "created_at">) => Category
  updateCategory: (id: string, c: Partial<Category>) => void
  deleteCategory: (id: string) => void
  getCategory: (id: string) => Category | undefined
  addRate: (r: Omit<Rate, "rate_id">) => Rate
  updateRate: (id: string, r: Partial<Rate>) => void
  deleteRate: (id: string) => void
  getRate: (id: string) => Rate | undefined
  getRatesByCategory: (categoryId: string) => Rate[]
  getNextStickerNumber: () => number
  addSalesOrder: (o: Omit<SalesOrder, "sales_order_id" | "created_at">) => SalesOrder
  updateSalesOrder: (id: string, o: Partial<SalesOrder>) => void
  getSalesOrder: (id: string) => SalesOrder | undefined
  addGRN: (g: Omit<GRN, "grn_id">) => GRN
  updateGRN: (id: string, g: Partial<GRN>) => void
  getGRN: (id: string) => GRN | undefined
  addProcessTracking: (p: Omit<ProcessTracking, "id">) => ProcessTracking
  updateProcessTracking: (id: string, p: Partial<ProcessTracking>) => void
  getProcessTrackingByOrderId: (salesOrderId: string) => ProcessTracking | undefined
  addChallan: (c: Omit<Challan, "challan_id">) => Challan
  updateChallan: (id: string, c: Partial<Challan>) => void
  getChallan: (id: string) => Challan | undefined
  addGatePass: (g: Omit<GatePass, "gatepass_id">) => GatePass
  updateGatePass: (id: string, g: Partial<GatePass>) => void
  getGatePass: (id: string) => GatePass | undefined
  addInvoice: (i: Omit<Invoice, "invoice_id">) => Invoice
  updateInvoice: (id: string, i: Partial<Invoice>) => void
  getInvoice: (id: string) => Invoice | undefined
  addCertificate: (c: Omit<Certificate, "certificate_id">) => Certificate
  updateCertificate: (id: string, c: Partial<Certificate>) => void
  getCertificate: (id: string) => Certificate | undefined
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** If a collection in localStorage is missing or empty, fill from demo seed so every module has rows. */
function mergeEmptyCollections(parsed: Partial<DataState> | null | undefined): DataState {
  const safe = parsed && typeof parsed === "object" ? parsed : {}
  const seed = createGaamaSeedData()
  const pick = <K extends keyof DataState>(key: K): DataState[K] => {
    const v = safe[key as keyof typeof safe]
    return Array.isArray(v) && v.length > 0 ? (v as DataState[K]) : seed[key]
  }
  return {
    customers: pick("customers"),
    categories: pick("categories"),
    rates: pick("rates"),
    salesOrders: pick("salesOrders"),
    grns: pick("grns"),
    processTrackings: pick("processTrackings"),
    challans: pick("challans"),
    gatePasses: pick("gatePasses"),
    invoices: pick("invoices"),
    certificates: pick("certificates"),
  }
}

function loadState(storageKey: string): DataState {
  if (typeof window === "undefined") {
    return createGaamaSeedData()
  }
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      return mergeEmptyCollections(
        parsed && typeof parsed === "object" ? (parsed as Partial<DataState>) : null
      )
    }
  } catch {
    // Corrupt JSON, privacy mode, or storage blocked — fall back to demo seed
  }
  return createGaamaSeedData()
}

const DataContext = React.createContext<DataContextValue | null>(null)

export function DataProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: React.ReactNode
  storageKey?: string
}) {
  const [state, setState] = React.useState<DataState>(() => loadState(storageKey))
  const [currentRole, setCurrentRole] = React.useState<UserRole>("admin")

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Quota exceeded or storage disabled — in-memory state still works for this session
    }
  }, [state, storageKey])

  const addCustomer: DataContextValue["addCustomer"] = (c) => {
    const now = new Date().toISOString()
    const customer: Customer = {
      ...c,
      customer_id: generateId("cust"),
      created_at: now,
      updated_at: now,
    }
    setState((s) => ({ ...s, customers: [...s.customers, customer] }))
    return customer
  }

  const updateCustomer: DataContextValue["updateCustomer"] = (id, c) => {
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      customers: s.customers.map((x) =>
        x.customer_id === id ? { ...x, ...c, updated_at: now } : x
      ),
    }))
  }

  const deleteCustomer: DataContextValue["deleteCustomer"] = (id) => {
    setState((s) => ({ ...s, customers: s.customers.filter((c) => c.customer_id !== id) }))
  }

  const getCustomer: DataContextValue["getCustomer"] = (id) =>
    state.customers.find((c) => c.customer_id === id)

  const addCategory: DataContextValue["addCategory"] = (c) => {
    const now = new Date().toISOString()
    const category: Category = {
      ...c,
      category_id: generateId("cat"),
      created_at: now,
    }
    setState((s) => ({ ...s, categories: [...s.categories, category] }))
    return category
  }

  const updateCategory: DataContextValue["updateCategory"] = (id, c) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((x) => (x.category_id === id ? { ...x, ...c } : x)),
    }))
  }

  const deleteCategory: DataContextValue["deleteCategory"] = (id) => {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.category_id !== id) }))
  }

  const getCategory: DataContextValue["getCategory"] = (id) =>
    state.categories.find((c) => c.category_id === id)

  const addRate: DataContextValue["addRate"] = (r) => {
    const now = new Date().toISOString()
    const rate: Rate = {
      ...r,
      rate_id: generateId("rate"),
      created_at: r.created_at ?? now,
    }
    setState((s) => ({ ...s, rates: [...s.rates, rate] }))
    return rate
  }

  const updateRate: DataContextValue["updateRate"] = (id, r) => {
    setState((s) => ({
      ...s,
      rates: s.rates.map((x) => (x.rate_id === id ? { ...x, ...r } : x)),
    }))
  }

  const deleteRate: DataContextValue["deleteRate"] = (id) => {
    setState((s) => ({ ...s, rates: s.rates.filter((r) => r.rate_id !== id) }))
  }

  const getNextStickerNumber: DataContextValue["getNextStickerNumber"] = () => {
    const maxEnd = state.salesOrders.reduce((max, o) => {
      const end = o.sticker_range_end ?? 0
      return end > max ? end : max
    }, 0)
    return maxEnd + 1
  }

  const getRate: DataContextValue["getRate"] = (id) =>
    state.rates.find((r) => r.rate_id === id)

  const getRatesByCategory: DataContextValue["getRatesByCategory"] = (categoryId) =>
    state.rates.filter((r) => r.category_id === categoryId)

  const addSalesOrder: DataContextValue["addSalesOrder"] = (o) => {
    const now = new Date().toISOString()
    const year = new Date().getFullYear()
    const sameYear = state.salesOrders.filter(
      (x) => x.order_date && x.order_date.startsWith(String(year))
    ).length
    const order_number = `SO-${year}-${String(sameYear + 1).padStart(3, "0")}`
    const order: SalesOrder = {
      ...o,
      sales_order_id: generateId("so"),
      order_number,
      sales_order_number: order_number,
      created_at: now,
    }
    setState((s) => ({ ...s, salesOrders: [...s.salesOrders, order] }))
    return order
  }

  const updateSalesOrder: DataContextValue["updateSalesOrder"] = (id, o) => {
    setState((s) => ({
      ...s,
      salesOrders: s.salesOrders.map((x) => (x.sales_order_id === id ? { ...x, ...o } : x)),
    }))
  }

  const getSalesOrder: DataContextValue["getSalesOrder"] = (id) =>
    state.salesOrders.find((o) => o.sales_order_id === id)

  const addGRN: DataContextValue["addGRN"] = (g) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const sameMonth = state.grns.filter((x) => {
      const d = x.received_date || (x as { created_at?: string }).created_at
      return d && d.startsWith(`${year}-${month}`)
    }).length
    const grn_number = `GRN-${year}-${month}${String(sameMonth + 1).padStart(3, "0")}`
    const grn: GRN = {
      ...g,
      grn_id: generateId("grn"),
      grn_number,
      created_at: now.toISOString(),
    }
    setState((s) => ({ ...s, grns: [...s.grns, grn] }))
    return grn
  }

  const updateGRN: DataContextValue["updateGRN"] = (id, g) => {
    setState((s) => ({
      ...s,
      grns: s.grns.map((x) => (x.grn_id === id ? { ...x, ...g } : x)),
    }))
  }

  const getGRN: DataContextValue["getGRN"] = (id) =>
    state.grns.find((g) => g.grn_id === id)

  const addProcessTracking: DataContextValue["addProcessTracking"] = (p) => {
    const now = new Date().toISOString()
    const pt: ProcessTracking = {
      ...p,
      id: generateId("pt"),
      updated_at: now,
    }
    setState((s) => ({ ...s, processTrackings: [...s.processTrackings, pt] }))
    return pt
  }

  const updateProcessTracking: DataContextValue["updateProcessTracking"] = (id, p) => {
    const now = new Date().toISOString()
    setState((s) => ({
      ...s,
      processTrackings: s.processTrackings.map((x) =>
        x.id === id ? { ...x, ...p, updated_at: now } : x
      ),
    }))
  }

  const getProcessTrackingByOrderId: DataContextValue["getProcessTrackingByOrderId"] = (
    salesOrderId
  ) => state.processTrackings.find((p) => p.sales_order_id === salesOrderId)

  const addChallan: DataContextValue["addChallan"] = (c) => {
    const year = new Date().getFullYear()
    const sameYear = state.challans.filter(
      (x) => x.dispatch_date && x.dispatch_date.startsWith(String(year))
    ).length
    const challan_number = `CH-${year}-${String(sameYear + 1).padStart(3, "0")}`
    const challan: Challan = { ...c, challan_id: generateId("ch"), challan_number }
    setState((s) => ({ ...s, challans: [...s.challans, challan] }))
    return challan
  }

  const updateChallan: DataContextValue["updateChallan"] = (id, c) => {
    setState((s) => ({
      ...s,
      challans: s.challans.map((x) => (x.challan_id === id ? { ...x, ...c } : x)),
    }))
  }

  const getChallan: DataContextValue["getChallan"] = (id) =>
    state.challans.find((c) => c.challan_id === id)

  const addGatePass: DataContextValue["addGatePass"] = (g) => {
    const gatePass: GatePass = {
      ...g,
      gatepass_id: generateId("gp"),
      timestamp: g.timestamp || new Date().toISOString(),
    }
    setState((s) => ({ ...s, gatePasses: [...s.gatePasses, gatePass] }))
    return gatePass
  }

  const updateGatePass: DataContextValue["updateGatePass"] = (id, g) => {
    setState((s) => ({
      ...s,
      gatePasses: s.gatePasses.map((x) => (x.gatepass_id === id ? { ...x, ...g } : x)),
    }))
  }

  const getGatePass: DataContextValue["getGatePass"] = (id) =>
    state.gatePasses.find((g) => g.gatepass_id === id)

  const addInvoice: DataContextValue["addInvoice"] = (i) => {
    const year = new Date().getFullYear()
    const sameYear = state.invoices.filter(
      (x) => (x.invoice_date ?? x.created_at ?? "").toString().startsWith(String(year))
    ).length
    const invoice_number = `INV-${year}-${String(sameYear + 1).padStart(3, "0")}`
    const invoice: Invoice = { ...i, invoice_id: generateId("inv"), invoice_number }
    setState((s) => ({ ...s, invoices: [...s.invoices, invoice] }))
    return invoice
  }

  const updateInvoice: DataContextValue["updateInvoice"] = (id, i) => {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((x) => (x.invoice_id === id ? { ...x, ...i } : x)),
    }))
  }

  const getInvoice: DataContextValue["getInvoice"] = (id) =>
    state.invoices.find((i) => i.invoice_id === id)

  const addCertificate: DataContextValue["addCertificate"] = (c) => {
    const cert: Certificate = { ...c, certificate_id: generateId("cert") }
    setState((s) => ({ ...s, certificates: [...s.certificates, cert] }))
    return cert
  }

  const updateCertificate: DataContextValue["updateCertificate"] = (id, c) => {
    setState((s) => ({
      ...s,
      certificates: s.certificates.map((x) =>
        x.certificate_id === id ? { ...x, ...c } : x
      ),
    }))
  }

  const getCertificate: DataContextValue["getCertificate"] = (id) =>
    state.certificates.find((c) => c.certificate_id === id)

  const value: DataContextValue = {
    ...state,
    currentRole,
    setCurrentRole,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    addRate,
    updateRate,
    deleteRate,
    getRate,
    getRatesByCategory,
    getNextStickerNumber,
    addSalesOrder,
    updateSalesOrder,
    getSalesOrder,
    addGRN,
    updateGRN,
    getGRN,
    addProcessTracking,
    updateProcessTracking,
    getProcessTrackingByOrderId,
    addChallan,
    updateChallan,
    getChallan,
    addGatePass,
    updateGatePass,
    getGatePass,
    addInvoice,
    updateInvoice,
    getInvoice,
    addCertificate,
    updateCertificate,
    getCertificate,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = React.useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}

/** Permissions matrix per PRD §5 */
export function canAccess(role: string, module: string): boolean {
  if (role === "admin") return true
  const map: Record<string, string[]> = {
    dashboard: ["admin", "sales", "warehouse", "operations", "finance", "compliance"],
    customers: ["admin", "sales"],
    categories: ["admin", "sales"],
    rates: ["admin", "sales"],
    "sales-orders": ["admin", "sales"],
    grn: ["admin", "warehouse"],
    "process-tracking": ["admin", "operations"],
    challan: ["admin", "operations", "sales"],
    "gate-pass": ["admin", "operations", "sales"],
    invoices: ["admin", "finance"],
    certificates: ["admin", "compliance"],
  }
  return (map[module] ?? []).includes(role)
}
