import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { Invoice, Challan, GRN } from "@/lib/gaama-types"
import { Receipt, Search, Printer, Download, Eye, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"
import { latestOfDates, sortLatestFirst } from "@/lib/utils"

type Tab = "pending" | "invoices"
type ModalMode = "create" | "edit" | "view" | null

const DISPATCH_THROUGH_OPTIONS = ["Vehicle", "By Person", "By Post"] as const

function parseGrnQty(s: string | undefined): number {
  return parseFloat(String(s ?? "").replace(/,/g, "")) || 0
}

function grnLineAmountBeforeGst(g: GRN): number {
  const qty = parseGrnQty(g.received_quantity)
  const rate = parseFloat(g.rate ?? "0") || 0
  if (rate > 0 && qty > 0) return rate * qty
  const total = parseFloat(g.total_amount ?? g.pricing ?? "0") || 0
  const gstPct = parseFloat(g.gst_percentage ?? "0") || 0
  if (total > 0 && gstPct >= 0) return total / (1 + gstPct / 100)
  return total
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function nextInvoiceNumberPreview(invoices: Invoice[]): string {
  const year = new Date().getFullYear()
  const sameYear = invoices.filter((x) =>
    (x.invoice_date ?? x.created_at ?? "").toString().startsWith(String(year))
  ).length
  return `INV-${year}-${String(sameYear + 1).padStart(3, "0")}`
}

function grnIdsFromChallan(challan: Challan, grns: GRN[]): string[] {
  const refs = (challan.grn_numbers ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const ids: string[] = []
  for (const ref of refs) {
    const g = grns.find((x) => (x.grn_number ?? x.grn_id) === ref)
    if (g) ids.push(g.grn_id)
  }
  return ids
}

function exportInvoicesToCsv(rows: Array<Record<string, string | number>>, filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function InvoicesPage() {
  const data = useData()
  const [tab, setTab] = React.useState<Tab>("pending")
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const [createChallanId, setCreateChallanId] = React.useState("")
  const [createFinalDispatchQty, setCreateFinalDispatchQty] = React.useState<Record<string, string>>({})
  const [createPartialDispatch, setCreatePartialDispatch] = React.useState<Record<string, boolean>>({})
  const [createDeliveryNoteDate, setCreateDeliveryNoteDate] = React.useState("")
  const [createDispatchedThrough, setCreateDispatchedThrough] = React.useState("Vehicle")
  const [createIncludeGstInTotal, setCreateIncludeGstInTotal] = React.useState(true)
  const [createDiscount, setCreateDiscount] = React.useState("0")
  const [createHandlingCharge, setCreateHandlingCharge] = React.useState("0")
  const [createTransportationCharge, setCreateTransportationCharge] = React.useState("0")
  const [createHsnSacCode, setCreateHsnSacCode] = React.useState("")
  const [createShippingAddress, setCreateShippingAddress] = React.useState("")
  const [createOtherReference, setCreateOtherReference] = React.useState("")
  const [createTermsOfDelivery, setCreateTermsOfDelivery] = React.useState("")
  const [includeHandlingCharge, setIncludeHandlingCharge] = React.useState(false)
  const [includeTransportationCharge, setIncludeTransportationCharge] = React.useState(false)
  const [form, setForm] = React.useState({
    sales_order_id: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    amount: 0,
    tax: 0,
    grand_total: 0,
    payment_status: "pending" as Invoice["payment_status"],
  })

  const allowed = canAccess(data.currentRole, "invoices")
  const invoices = data.invoices
  const challans = data.challans

  const challanNumbersInInvoices = React.useMemo(() => {
    const set = new Set<string>()
    for (const i of invoices) {
      const nums = (i.challan_numbers ?? "").split(",").map((s) => s.trim()).filter(Boolean)
      nums.forEach((n) => set.add(n))
    }
    return set
  }, [invoices])

  const pendingChallans = React.useMemo(() => {
    const list = challans.filter(
      (c) =>
        c.status === "Delivered" &&
        !challanNumbersInInvoices.has(c.challan_number ?? c.challan_id)
    )
    return sortLatestFirst(
      list,
      (c) => latestOfDates(c.dispatch_date, c.created_at),
      (c) => c.challan_id
    )
  }, [challans, challanNumbersInInvoices])

  const openCreateFromChallan = (challan: Challan) => {
    const soId = challan.sales_order_id
    const grnIds = grnIdsFromChallan(challan, data.grns)
    const initQty: Record<string, string> = {}
    for (let i = 0; i < grnIds.length; i++) {
      const gid = grnIds[i]!
      const fromItem = challan.items?.[i]?.quantity
      const g = data.getGRN(gid)
      initQty[gid] =
        fromItem != null
          ? String(fromItem)
          : String(g?.received_quantity ?? "").trim() || "0"
    }
    setCreateChallanId(challan.challan_id)
    setCreateFinalDispatchQty(initQty)
    setCreatePartialDispatch({})
    setCreateDeliveryNoteDate(
      challan.delivery_note_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
    )
    setCreateDispatchedThrough(challan.dispatched_through ?? "Vehicle")
    setCreateIncludeGstInTotal(challan.include_gst !== false)
    setCreateDiscount("0")
    setCreateHandlingCharge("0")
    setCreateTransportationCharge("0")
    setCreateHsnSacCode(challan.hsn_sac_code ?? "")
    setCreateShippingAddress(challan.shipping_address ?? "")
    setCreateOtherReference(challan.delivery_note ?? "")
    setCreateTermsOfDelivery(challan.terms_of_delivery ?? "")
    setIncludeHandlingCharge(false)
    setIncludeTransportationCharge(false)
    const basePreview = parseFloat(challan.base_amount ?? "0") || 0
    const gstPctPreview = parseFloat(challan.gst_percentage ?? "18") || 0
    const taxPreview = (basePreview * gstPctPreview) / 100
    setForm({
      sales_order_id: soId,
      invoice_date: new Date().toISOString().slice(0, 10),
      amount: basePreview,
      tax: taxPreview,
      grand_total: basePreview + taxPreview,
      payment_status: "pending",
    })
    setMode("create")
  }

  const selectedCreateChallan = createChallanId ? data.getChallan(createChallanId) : undefined
  const createGrnIdList = React.useMemo(() => {
    if (!selectedCreateChallan) return [] as string[]
    return grnIdsFromChallan(selectedCreateChallan, data.grns)
  }, [selectedCreateChallan, data.grns])

  const invoiceFromGrnTotals = React.useMemo(() => {
    let computedBase = 0
    let gstPctStr = ""
    for (const id of createGrnIdList) {
      const g = data.grns.find((x) => x.grn_id === id)
      if (!g) continue
      const recv = parseGrnQty(g.received_quantity)
      const finalQ = parseGrnQty(createFinalDispatchQty[id] ?? g.received_quantity)
      if (recv <= 0) continue
      computedBase += grnLineAmountBeforeGst(g) * (finalQ / recv)
      const gGst = g.gst_percentage
      if (gGst != null && String(gGst).trim() !== "") gstPctStr = String(gGst)
    }
    if (createGrnIdList.length === 0 && selectedCreateChallan) {
      return {
        computedBase: parseFloat(selectedCreateChallan.base_amount ?? "0") || 0,
        gstPctStr: String(selectedCreateChallan.gst_percentage ?? "18"),
      }
    }
    return {
      computedBase,
      gstPctStr: gstPctStr || String(selectedCreateChallan?.gst_percentage ?? "18"),
    }
  }, [createGrnIdList, createFinalDispatchQty, data.grns, selectedCreateChallan])

  const selectedCreateCustomer =
    selectedCreateChallan?.customer_id
      ? data.getCustomer(selectedCreateChallan.customer_id)
      : form.sales_order_id
        ? data.getCustomer(data.getSalesOrder(form.sales_order_id)?.customer_id ?? "")
        : undefined
  const customerTermsOfDelivery = selectedCreateCustomer?.terms_of_delivery?.trim() ?? ""

  React.useEffect(() => {
    if (mode !== "create") return
    if (!customerTermsOfDelivery) return
    setCreateTermsOfDelivery((prev) => (prev.trim().length > 0 ? prev : customerTermsOfDelivery))
  }, [mode, customerTermsOfDelivery])

  const createShippingOptions =
    selectedCreateCustomer?.shipping_addresses_typed?.length
      ? selectedCreateCustomer.shipping_addresses_typed.map((a) => a.address)
      : selectedCreateCustomer?.billing_address
        ? [selectedCreateCustomer.billing_address]
        : []

  const handleAddShippingAddress = () => {
    if (!selectedCreateCustomer) {
      toast.error("Customer not found for this challan.")
      return
    }
    const entered = window.prompt("Enter new shipping address")
    const addr = entered?.trim()
    if (!addr) return
    const existing = selectedCreateCustomer.shipping_addresses_typed ?? []
    if (existing.some((a) => a.address.trim().toLowerCase() === addr.toLowerCase())) {
      setCreateShippingAddress(addr)
      toast.message("Address already exists for this customer.")
      return
    }
    data.updateCustomer(selectedCreateCustomer.customer_id, {
      shipping_addresses_typed: [
        ...existing,
        {
          id: `ship_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          address: addr,
          is_default: existing.length === 0,
        },
      ],
    })
    setCreateShippingAddress(addr)
    toast.success("Shipping address added.")
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const challan = data.getChallan(createChallanId)
    const so = data.getSalesOrder(form.sales_order_id)
    const grnList = createGrnIdList.map((id) => data.getGRN(id)).filter(Boolean) as GRN[]

    if (grnList.length === 0) {
      toast.error("No GRNs linked to this challan. Cannot create invoice.")
      return
    }
    for (const g of grnList) {
      const recv = parseGrnQty(g.received_quantity)
      const finalQ = parseGrnQty(createFinalDispatchQty[g.grn_id] ?? g.received_quantity)
      if (finalQ <= 0) {
        toast.error(`Final dispatch quantity must be greater than 0 for ${g.grn_number ?? g.grn_id}.`)
        return
      }
      if (finalQ > recv) {
        toast.error(`Final dispatch cannot exceed received quantity for ${g.grn_number ?? g.grn_id}.`)
        return
      }
    }
    if (!so?.order_date?.trim()) {
      toast.error("Customer Order Date is required from Sales Order.")
      return
    }
    if (
      !DISPATCH_THROUGH_OPTIONS.includes(createDispatchedThrough as (typeof DISPATCH_THROUGH_OPTIONS)[number])
    ) {
      toast.error("Select Dispatch Through.")
      return
    }

    const base = invoiceFromGrnTotals.computedBase
    const gstPct = parseFloat(invoiceFromGrnTotals.gstPctStr) || 0
    const discount = parseFloat(createDiscount) || 0
    const handling = includeHandlingCharge ? parseFloat(createHandlingCharge) || 0 : 0
    const transportation = includeTransportationCharge ? parseFloat(createTransportationCharge) || 0 : 0
    const subTotal = Math.max(0, base - discount + handling + transportation)
    const tax = (subTotal * gstPct) / 100
    const grandTotal = subTotal + (createIncludeGstInTotal ? tax : 0)
    const totalDispatched = grnList.reduce(
      (s, g) => s + parseGrnQty(createFinalDispatchQty[g.grn_id] ?? g.received_quantity),
      0
    )

    if (!createShippingAddress.trim()) {
      toast.error("Shipping address is required.")
      return
    }
    if (!createHsnSacCode.trim()) {
      toast.error("HSN/SAC code is required.")
      return
    }
    if (!createTermsOfDelivery.trim()) {
      toast.error("Terms of delivery is required.")
      return
    }

    data.addInvoice({
      sales_order_id: form.sales_order_id,
      sales_order_number: so?.sales_order_number ?? so?.order_number,
      challan_numbers: challan?.challan_number ?? createChallanId,
      customer_id: so?.customer_id,
      customer_name: so?.customer_name,
      category_id: so?.category_id,
      category_name: so?.category_name,
      product_id: so?.product_id,
      product_name: so?.product_name,
      quantity: String(totalDispatched),
      unit: so?.unit ?? grnList[0]?.unit,
      invoice_date: new Date(form.invoice_date).toISOString(),
      amount: subTotal,
      tax,
      grand_total: grandTotal,
      payment_status: "pending",
      status: "Generated",
      base_amount: String(base),
      gst_percentage: String(gstPct),
      total_gst_amount: String(tax.toFixed(2)),
      total_amount: String(grandTotal.toFixed(2)),
      discount_amount: String(discount),
      handling_charge: String(handling),
      transportation_charge: String(transportation),
      hsn_sac_code: createHsnSacCode.trim(),
      shipping_address: createShippingAddress.trim(),
      other_reference: createOtherReference.trim() || undefined,
      terms_of_delivery: createTermsOfDelivery.trim(),
      delivery_note_date: createDeliveryNoteDate.trim()
        ? new Date(createDeliveryNoteDate).toISOString().slice(0, 10)
        : undefined,
      customer_order_date: so.order_date.slice(0, 10),
      dispatched_through: createDispatchedThrough,
      include_gst: createIncludeGstInTotal,
    })
    toast.success("Invoice created.")
    setMode(null)
    setTab("invoices")
  }

  const [printAfterViewOpen, setPrintAfterViewOpen] = React.useState(false)

  const closeInvoiceDetail = React.useCallback(() => {
    setMode(null)
    setSelectedId(null)
    setPrintAfterViewOpen(false)
  }, [])

  React.useEffect(() => {
    if (mode !== "view" || !printAfterViewOpen || !selectedId) return
    if (!data.getInvoice(selectedId)) return
    const t = window.setTimeout(() => {
      window.print()
      setPrintAfterViewOpen(false)
    }, 450)
    return () => window.clearTimeout(t)
  }, [mode, printAfterViewOpen, selectedId])

  const openView = (i: Invoice) => {
    setPrintAfterViewOpen(false)
    setForm({
      sales_order_id: i.sales_order_id,
      invoice_date: (i.invoice_date ?? i.created_at ?? "").toString().slice(0, 10),
      amount: i.amount,
      tax: i.tax,
      grand_total: i.grand_total,
      payment_status: i.payment_status,
    })
    setSelectedId(i.invoice_id)
    setMode("view")
  }

  const openViewThenPrint = (i: Invoice) => {
    setForm({
      sales_order_id: i.sales_order_id,
      invoice_date: (i.invoice_date ?? i.created_at ?? "").toString().slice(0, 10),
      amount: i.amount,
      tax: i.tax,
      grand_total: i.grand_total,
      payment_status: i.payment_status,
    })
    setSelectedId(i.invoice_id)
    setMode("view")
    setPrintAfterViewOpen(true)
  }

  const openEdit = (i: Invoice) => {
    setForm({
      sales_order_id: i.sales_order_id,
      invoice_date: (i.invoice_date ?? i.created_at ?? "").toString().slice(0, 10),
      amount: i.amount,
      tax: i.tax,
      grand_total: i.grand_total,
      payment_status: i.payment_status,
    })
    setSelectedId(i.invoice_id)
    setMode("edit")
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    data.updateInvoice(selectedId, {
      payment_status: form.payment_status,
      invoice_date: form.invoice_date ? new Date(form.invoice_date).toISOString() : undefined,
    })
    toast.success("Invoice updated.")
    closeInvoiceDetail()
  }

  const filteredInvoices = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = invoices.filter(
      (i) =>
        (i.invoice_number ?? i.invoice_id).toLowerCase().includes(term) ||
        (i.sales_order_number ?? i.sales_order_id).toLowerCase().includes(term) ||
        (i.customer_name ?? "").toLowerCase().includes(term)
    )
    return sortLatestFirst(
      list,
      (i) => latestOfDates(i.invoice_date, i.created_at, i.requested_date_time),
      (i) => i.invoice_id
    )
  }, [invoices, searchTerm])

  const { computedBase: invoiceGrnBase, gstPctStr: invoiceGstPctStr } = invoiceFromGrnTotals
  const createGstPercentage = parseFloat(invoiceGstPctStr) || 0
  const createBaseAmount = invoiceGrnBase
  const createDiscountAmount = parseFloat(createDiscount) || 0
  const createHandlingAmount = parseFloat(createHandlingCharge) || 0
  const createTransportationAmount = parseFloat(createTransportationCharge) || 0
  const createSubTotal = Math.max(
    0,
    createBaseAmount - createDiscountAmount + createHandlingAmount + createTransportationAmount
  )
  const createTaxAmount = (createSubTotal * createGstPercentage) / 100
  const createGrandTotal = createSubTotal + (createIncludeGstInTotal ? createTaxAmount : 0)

  const readOnlyCreate =
    "h-9 cursor-not-allowed rounded-md border-transparent bg-muted text-sm text-muted-foreground opacity-90"

  const createSo = form.sales_order_id ? data.getSalesOrder(form.sales_order_id) : undefined

  const invoiceCreateForm = (
    <div className="space-y-6">
      <form onSubmit={handleCreateSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-semibold text-foreground">Challan &amp; sales order</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sales Order</Label>
              <Input readOnly value={form.sales_order_id} className={readOnlyCreate} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Challan Number</Label>
              <Input
                readOnly
                value={selectedCreateChallan?.challan_number ?? selectedCreateChallan?.challan_id ?? "—"}
                className={readOnlyCreate}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Invoice Date</Label>
              <Input
                type="date"
                value={form.invoice_date}
                onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))}
                className="h-9 rounded-md shadow-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">GRN lines</h2>
          <p className="text-xs text-muted-foreground">
            Amount, GST%, and Total Amount are read-only from each GRN. Adjust final dispatch quantity as needed.
          </p>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="whitespace-nowrap text-xs font-medium">GRN No.</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Received Quantity</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Gross Weight (kg)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Net Weight (kg)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Amount (₹)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">GST%</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Total Amount</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium text-destructive">
                    * Final Dispatch Quantity
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Remaining Dispatch Quantity</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Edit icon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {createGrnIdList.map((id) => {
                  const g = data.getGRN(id)
                  if (!g) return null
                  const recv = parseGrnQty(g.received_quantity)
                  const finalStr = createFinalDispatchQty[id] ?? g.received_quantity ?? ""
                  const finalQ = parseGrnQty(finalStr)
                  const remaining = Math.max(0, recv - finalQ)
                  const lineAmt = grnLineAmountBeforeGst(g)
                  const totalDisplay =
                    g.total_amount != null && g.total_amount !== ""
                      ? formatInr(parseFloat(g.total_amount) || 0)
                      : "—"
                  return (
                    <TableRow key={id}>
                      <TableCell className="whitespace-nowrap font-medium text-primary">
                        {g.grn_number ?? g.grn_id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {g.received_quantity ?? "—"} {g.unit ?? ""}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{g.gross_weight ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{g.net_weight ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatInr(lineAmt)}</TableCell>
                      <TableCell className="whitespace-nowrap">{g.gst_percentage ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">{totalDisplay}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <Input
                            id={`inv-final-qty-${id}`}
                            type="number"
                            min={0}
                            step="any"
                            className="h-9 rounded-md shadow-none"
                            value={finalStr}
                            onChange={(e) =>
                              setCreateFinalDispatchQty((p) => ({ ...p, [id]: e.target.value }))
                            }
                          />
                          <span className="shrink-0 text-xs text-muted-foreground">{g.unit ?? ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                        {remaining.toFixed(2)} {g.unit ?? ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!createPartialDispatch[id]}
                            onCheckedChange={(c) =>
                              setCreatePartialDispatch((p) => ({ ...p, [id]: !!c }))
                            }
                            aria-label={`Partial dispatch for ${g.grn_number ?? id}`}
                          />
                          <span className="text-xs text-muted-foreground">Partial Dispatch</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => document.getElementById(`inv-final-qty-${id}`)?.focus()}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Invoice details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> Invoice Number
              </Label>
              <Input readOnly value={nextInvoiceNumberPreview(invoices)} className={readOnlyCreate} />
              <p className="text-xs text-muted-foreground">Auto-generated on save.</p>
            </div>
            <div className="space-y-2">
              <Label>Delivery Note Date</Label>
              <Input
                type="date"
                value={createDeliveryNoteDate}
                onChange={(e) => setCreateDeliveryNoteDate(e.target.value)}
                className="h-9 rounded-md shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> Customer Order Date
              </Label>
              <Input readOnly value={createSo?.order_date?.slice(0, 10) ?? ""} className={readOnlyCreate} />
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> Terms of Delivery
              </Label>
              <Input
                value={createTermsOfDelivery}
                onChange={(e) => setCreateTermsOfDelivery(e.target.value)}
                placeholder="Auto fetched from Customer Master"
                className="h-9 rounded-md shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> Dispatch Through
              </Label>
              <Select value={createDispatchedThrough} onValueChange={setCreateDispatchedThrough}>
                <SelectTrigger className="h-9 rounded-md shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPATCH_THROUGH_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Include GST in Total Amount</Label>
              <div className="flex h-auto min-h-9 items-center gap-3 rounded-md border border-border px-3 py-2">
                <Checkbox
                  checked={createIncludeGstInTotal}
                  onCheckedChange={(v) => setCreateIncludeGstInTotal(Boolean(v))}
                  aria-label="Include GST in total amount"
                />
                <span className="text-sm text-muted-foreground">
                  {createIncludeGstInTotal ? "GST included in invoice total" : "GST excluded from invoice total"}
                </span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Other References</Label>
              <Textarea
                value={createOtherReference}
                onChange={(e) => setCreateOtherReference(e.target.value)}
                placeholder="Optional"
                rows={3}
                className="min-h-[80px] resize-y rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> HSN/SAC Code
              </Label>
              <Input
                value={createHsnSacCode}
                onChange={(e) => setCreateHsnSacCode(e.target.value)}
                className="h-9 rounded-md shadow-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>
                  <span className="text-destructive">*</span> Shipping Address
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddShippingAddress}>
                  Add New
                </Button>
              </div>
              {createShippingOptions.length > 0 ? (
                <Select value={createShippingAddress} onValueChange={setCreateShippingAddress}>
                  <SelectTrigger className="h-9 rounded-md shadow-none">
                    <SelectValue placeholder="Select shipping address" />
                  </SelectTrigger>
                  <SelectContent>
                    {createShippingOptions.map((addr, i) => (
                      <SelectItem key={i} value={addr}>
                        {addr.length > 60 ? addr.slice(0, 60) + "…" : addr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Textarea
                value={createShippingAddress}
                onChange={(e) => setCreateShippingAddress(e.target.value)}
                placeholder="Shipping address"
                rows={2}
                className="rounded-md"
              />
            </div>
          </div>

          <FormSection title="Optional pricing adjustments" noSeparator>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount (₹) from GRNs</Label>
                <Input readOnly value={createBaseAmount.toFixed(2)} className={readOnlyCreate} />
              </div>
              <div className="space-y-2">
                <Label>GST%</Label>
                <Input readOnly value={invoiceGstPctStr} className={readOnlyCreate} />
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={createDiscount}
                  onChange={(e) => setCreateDiscount(e.target.value)}
                  className="h-9 rounded-md shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Handling Charge</Label>
                <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <Switch
                    checked={includeHandlingCharge}
                    onCheckedChange={(v) => setIncludeHandlingCharge(Boolean(v))}
                  />
                  <span className="text-sm text-muted-foreground">Apply</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={createHandlingCharge}
                  onChange={(e) => setCreateHandlingCharge(e.target.value)}
                  disabled={!includeHandlingCharge}
                  className={!includeHandlingCharge ? "bg-muted" : "h-9 rounded-md shadow-none"}
                />
              </div>
              <div className="space-y-2">
                <Label>Transportation Charge</Label>
                <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <Switch
                    checked={includeTransportationCharge}
                    onCheckedChange={(v) => setIncludeTransportationCharge(Boolean(v))}
                  />
                  <span className="text-sm text-muted-foreground">Apply</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={createTransportationCharge}
                  onChange={(e) => setCreateTransportationCharge(e.target.value)}
                  disabled={!includeTransportationCharge}
                  className={!includeTransportationCharge ? "bg-muted" : "h-9 rounded-md shadow-none"}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax (GST)</Label>
                <Input readOnly value={createTaxAmount.toFixed(2)} className={readOnlyCreate} />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input readOnly value={createGrandTotal.toFixed(2)} className={readOnlyCreate} />
              </div>
            </div>
          </FormSection>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md shadow-none"
              onClick={() => {
                if (!window.confirm("Discard changes?")) return
                setMode(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-9 rounded-md px-8 shadow-none">
              Create Invoice
            </Button>
          </div>
        </div>
      </form>
    </div>
  )

  if (allowed && mode === "create") {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title="Create Invoice"
              noBorder
              backButton={{
                onClick: () => {
                  if (!window.confirm("Discard changes?")) return
                  setMode(null)
                },
              }}
            />
            <div className="space-y-4 px-6 py-4 h-full">{invoiceCreateForm}</div>
          </div>
        </div>
      </PageShell>
    )
  }

  const readOnlyInvoiceClass =
    "h-9 cursor-not-allowed rounded-md border-transparent bg-muted text-muted-foreground"

  if (allowed && mode === "view" && selectedId) {
    const inv = data.getInvoice(selectedId)
    if (!inv) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <div className="w-full h-full">
              <PageHeaderWithBack title="Invoice" noBorder backButton={{ onClick: closeInvoiceDetail }} />
              <div className="px-6 py-4 text-muted-foreground">Invoice not found.</div>
            </div>
          </div>
        </PageShell>
      )
    }
    const title = `Invoice · ${inv.invoice_number ?? inv.invoice_id}`
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <div className="print:hidden">
              <PageHeaderWithBack
                title={title}
                noBorder
                backButton={{ onClick: closeInvoiceDetail }}
                actions={
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-md shadow-none"
                      onClick={() => openEdit(inv)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button type="button" className="h-9 rounded-md shadow-none" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </>
                }
              />
            </div>
            <div className="space-y-4 px-6 py-4 h-full print:py-2">
              <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm md:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Invoice summary</h2>
                  <Badge variant="secondary" className="font-normal capitalize">
                    {form.payment_status}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Sales order</Label>
                    <Input readOnly value={inv.sales_order_number ?? inv.sales_order_id} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Challan number(s)</Label>
                    <Input readOnly value={inv.challan_numbers ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Customer</Label>
                    <Input readOnly value={inv.customer_name ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <Input readOnly value={inv.category_name ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <Input readOnly value={inv.quantity ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <Input readOnly value={inv.unit ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Invoice date</Label>
                    <Input readOnly value={form.invoice_date} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <Input readOnly value={String(form.amount)} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tax</Label>
                    <Input readOnly value={String(form.tax)} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">HSN/SAC Code</Label>
                    <Input readOnly value={inv.hsn_sac_code ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Shipping address</Label>
                    <Input readOnly value={inv.shipping_address ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Discount</Label>
                    <Input readOnly value={inv.discount_amount ?? "0"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Handling charge</Label>
                    <Input readOnly value={inv.handling_charge ?? "0"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Transportation charge</Label>
                    <Input readOnly value={inv.transportation_charge ?? "0"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Terms of delivery</Label>
                    <Input readOnly value={inv.terms_of_delivery ?? "—"} className={readOnlyInvoiceClass} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Grand total</Label>
                    <Input readOnly value={String(form.grand_total)} className={readOnlyInvoiceClass} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  if (allowed && mode === "edit" && selectedId) {
    const inv = data.getInvoice(selectedId)
    if (!inv) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <div className="w-full h-full">
              <PageHeaderWithBack title="Edit Invoice" noBorder backButton={{ onClick: closeInvoiceDetail }} />
              <div className="px-6 py-4 text-muted-foreground">Invoice not found.</div>
            </div>
          </div>
        </PageShell>
      )
    }
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title={`Edit invoice · ${inv.invoice_number ?? inv.invoice_id}`}
              noBorder
              backButton={{
                onClick: () => {
                  if (!window.confirm("Discard changes?")) return
                  closeInvoiceDetail()
                },
              }}
            />
            <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-4 px-6 py-4">
                <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm md:p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Invoice information</h2>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Amounts are read-only. Update payment status and invoice date if needed.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Sales order</Label>
                      <Input readOnly value={inv.sales_order_number ?? inv.sales_order_id} className={readOnlyInvoiceClass} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Invoice date</Label>
                      <Input
                        type="date"
                        value={form.invoice_date}
                        onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))}
                        className="h-9 rounded-md border-border bg-muted/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <Input type="number" value={form.amount || ""} readOnly className={readOnlyInvoiceClass} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tax</Label>
                      <Input type="number" value={form.tax || ""} readOnly className={readOnlyInvoiceClass} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Grand total</Label>
                      <Input type="number" value={form.grand_total || ""} readOnly className={readOnlyInvoiceClass} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-medium">Payment status</Label>
                      <Select
                        value={form.payment_status}
                        onValueChange={(v: Invoice["payment_status"]) => setForm((f) => ({ ...f, payment_status: v }))}
                      >
                        <SelectTrigger className="h-9 max-w-md bg-muted/60 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!window.confirm("Discard changes?")) return
                    closeInvoiceDetail()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {!allowed ? (
        <>
          <PageHeader title="Invoice Management" />
          <div className="flex-1 overflow-auto px-6 py-4">
            <p className="text-muted-foreground">You do not have permission to view this module.</p>
          </div>
        </>
      ) : (
        <>
          <PageHeaderWithTabs
            title="Invoice Management"
            tabs={[
              { value: "pending", label: "Pending Generation", badge: pendingChallans.length },
              { value: "invoices", label: "Invoices", badge: invoices.length },
            ]}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
          />
          <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
            {tab === "pending" && (
              <>
                {pendingChallans.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Receipt className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No pending items</EmptyTitle>
                      <EmptyDescription>Delivered challans not yet invoiced will appear here.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Sl.No</TableHead>
                          <TableHead>Sales Order No.</TableHead>
                          <TableHead>Challan No.</TableHead>
                          <TableHead>Product Category</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Requested Date/Time</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingChallans.map((c, idx) => (
                          <TableRow key={c.challan_id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{c.sales_order_number ?? c.sales_order_id}</TableCell>
                            <TableCell className="font-medium">{c.challan_number ?? c.challan_id}</TableCell>
                            <TableCell>{c.product_category ?? "—"}</TableCell>
                            <TableCell>{c.customer_name ?? "—"}</TableCell>
                            <TableCell>{c.quantity ?? "—"}</TableCell>
                            <TableCell>{c.units ?? "—"}</TableCell>
                            <TableCell>
                              {c.created_at
                                ? new Date(c.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
                                : c.dispatch_date
                                  ? new Date(c.dispatch_date).toLocaleString(undefined, { dateStyle: "short" })
                                  : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openCreateFromChallan(c)}>
                                Create Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}

            {tab === "invoices" && (
              <>
                {invoices.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Receipt className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No invoices</EmptyTitle>
                      <EmptyDescription>Create invoices from the Pending Generation tab.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search invoices"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {filteredInvoices.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            exportInvoicesToCsv(
                              filteredInvoices.map((i) => ({
                                "Invoice No": i.invoice_number ?? i.invoice_id,
                                "Sales Order": i.sales_order_number ?? i.sales_order_id,
                                Category: i.category_name ?? "",
                                Customer: i.customer_name ?? "",
                                Quantity: i.quantity ?? "",
                                Unit: i.unit ?? "",
                                "Created At": (i.created_at ?? i.invoice_date ?? "").toString().slice(0, 10),
                                "Total Amount": i.grand_total ?? i.total_amount ?? "",
                              })),
                              `invoices-${new Date().toISOString().slice(0, 10)}.csv`
                            )
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      )}
                    </div>
                    {filteredInvoices.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Receipt className="size-4" />
                          </EmptyMedia>
                          <EmptyTitle>No matching invoices</EmptyTitle>
                          <EmptyDescription>Try a different search term.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice Number</TableHead>
                              <TableHead>Sales Order No.</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead>Created At</TableHead>
                              <TableHead>Total Amount</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredInvoices.map((i) => (
                              <TableRow key={i.invoice_id}>
                                <TableCell className="font-medium">{i.invoice_number ?? i.invoice_id}</TableCell>
                                <TableCell>{i.sales_order_number ?? i.sales_order_id}</TableCell>
                                <TableCell>{i.category_name ?? "—"}</TableCell>
                                <TableCell>{i.customer_name ?? "—"}</TableCell>
                                <TableCell>{i.quantity ?? "—"}</TableCell>
                                <TableCell>{i.unit ?? "—"}</TableCell>
                                <TableCell>{(i.created_at ?? i.invoice_date ?? "").toString().slice(0, 10)}</TableCell>
                                <TableCell>₹{(i.grand_total ?? Number(i.total_amount) ?? 0).toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" title="View" onClick={() => openView(i)}><Eye className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" title="Print" onClick={() => openViewThenPrint(i)}><Printer className="h-4 w-4" /></Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Export"
                                    onClick={() => toast.info("Open the invoice, then use Print to save as PDF.")}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </PageShell>
  )
}
