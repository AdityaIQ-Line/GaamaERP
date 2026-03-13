import * as React from "react"
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
  getCustomer: (id: string) => Customer | undefined
  addCategory: (c: Omit<Category, "category_id" | "created_at">) => Category
  updateCategory: (id: string, c: Partial<Category>) => void
  getCategory: (id: string) => Category | undefined
  addRate: (r: Omit<Rate, "rate_id">) => Rate
  updateRate: (id: string, r: Partial<Rate>) => void
  getRate: (id: string) => Rate | undefined
  getRatesByCategory: (categoryId: string) => Rate[]
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

function loadState(storageKey: string): DataState {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw) as DataState
      return {
        customers: parsed.customers ?? [],
        categories: parsed.categories ?? [],
        rates: parsed.rates ?? [],
        salesOrders: parsed.salesOrders ?? [],
        grns: parsed.grns ?? [],
        processTrackings: parsed.processTrackings ?? [],
        challans: parsed.challans ?? [],
        gatePasses: parsed.gatePasses ?? [],
        invoices: parsed.invoices ?? [],
        certificates: parsed.certificates ?? [],
      }
    }
  } catch {
    // ignore
  }
  return getInitialState()
}

function getInitialState(): DataState {
  const now = new Date().toISOString()
  return {
    customers: [
      {
        customer_id: "cust_1",
        customer_name: "ABC Industries",
        company_name: "ABC Industries Pvt Ltd",
        email: "contact@abc.com",
        phone: "+91 9876543210",
        billing_address: "123 Industrial Area, Mumbai",
        shipping_addresses: ["123 Industrial Area, Mumbai"],
        gst_number: "27AABCU9603R1ZM",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ],
    categories: [
      { category_id: "cat_1", category_name: "Steel Plates", description: "Heavy duty steel", created_at: now },
      { category_id: "cat_2", category_name: "Fasteners", description: "Bolts and nuts", created_at: now },
    ],
    rates: [
      { rate_id: "rate_1", category_id: "cat_1", rate_value: 45000, currency: "INR", effective_date: now },
      { rate_id: "rate_2", category_id: "cat_2", rate_value: 120, currency: "INR", effective_date: now },
    ],
    salesOrders: [],
    grns: [],
    processTrackings: [],
    challans: [],
    gatePasses: [],
    invoices: [],
    certificates: [],
  }
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
    localStorage.setItem(storageKey, JSON.stringify(state))
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

  const getCategory: DataContextValue["getCategory"] = (id) =>
    state.categories.find((c) => c.category_id === id)

  const addRate: DataContextValue["addRate"] = (r) => {
    const rate: Rate = { ...r, rate_id: generateId("rate") }
    setState((s) => ({ ...s, rates: [...s.rates, rate] }))
    return rate
  }

  const updateRate: DataContextValue["updateRate"] = (id, r) => {
    setState((s) => ({
      ...s,
      rates: s.rates.map((x) => (x.rate_id === id ? { ...x, ...r } : x)),
    }))
  }

  const getRate: DataContextValue["getRate"] = (id) =>
    state.rates.find((r) => r.rate_id === id)

  const getRatesByCategory: DataContextValue["getRatesByCategory"] = (categoryId) =>
    state.rates.filter((r) => r.category_id === categoryId)

  const addSalesOrder: DataContextValue["addSalesOrder"] = (o) => {
    const now = new Date().toISOString()
    const order: SalesOrder = {
      ...o,
      sales_order_id: generateId("so"),
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
    const grn: GRN = { ...g, grn_id: generateId("grn") }
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
    const challan: Challan = { ...c, challan_id: generateId("ch") }
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
    const invoice: Invoice = { ...i, invoice_id: generateId("inv") }
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
    getCustomer,
    addCategory,
    updateCategory,
    getCategory,
    addRate,
    updateRate,
    getRate,
    getRatesByCategory,
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
