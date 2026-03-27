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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { Challan, ChallanItem, GRN } from "@/lib/gaama-types"
import { FileText, Search, Printer, Download, Eye, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"
import { latestOfDates, sortLatestFirst } from "@/lib/utils"

type Tab = "pending" | "delivery"
type ModalMode = "create" | "edit" | "view" | null

const DISPATCH_THROUGH_OPTIONS = ["Vehicle", "By Person", "By Post"] as const

function parseGrnQty(s: string | undefined): number {
  return parseFloat(String(s ?? "").replace(/,/g, "")) || 0
}

function formatInr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

function exportChallansToCsv(rows: Array<Record<string, string | number>>, filename: string) {
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

function exportChallansToPdf(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const headCells = headers.map((h) => `<th style="border:1px solid #ddd;padding:8px;text-align:left;background:#f5f5f5">${escapeHtml(String(h))}</th>`).join("")
  const bodyRows = rows
    .map(
      (r) =>
        `<tr>${headers.map((h) => `<td style="border:1px solid #ddd;padding:8px">${escapeHtml(String(r[h] ?? ""))}</td>`).join("")}</tr>`
    )
    .join("")
  const title = `Challans - ${new Date().toISOString().slice(0, 10)}`
  const html = `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title></head><body style="font-family:system-ui,sans-serif;padding:16px"><h1>${escapeHtml(title)}</h1><table style="border-collapse:collapse;width:100%"><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`
  const w = window.open("", "_blank")
  if (!w) {
    toast.error("Allow popups to export PDF.")
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
  }, 250)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatDateReadable(iso: string | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function numberToWordsEn(num: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const two = (n: number): string => (n < 20 ? a[n] : `${b[Math.floor(n / 10)]}${n % 10 ? ` ${a[n % 10]}` : ""}`)
  const three = (n: number): string => {
    if (n < 100) return two(n)
    const rem = n % 100
    return `${a[Math.floor(n / 100)]} Hundred${rem ? ` ${two(rem)}` : ""}`
  }
  if (!Number.isFinite(num) || num <= 0) return "Zero"
  if (num < 1000) return three(num)
  if (num < 1000000) {
    const rem = num % 1000
    return `${three(Math.floor(num / 1000))} Thousand${rem ? ` ${three(rem)}` : ""}`
  }
  const rem = num % 1000000
  return `${three(Math.floor(num / 1000000))} Million${rem ? ` ${numberToWordsEn(rem)}` : ""}`
}

export function ChallanPage() {
  const data = useData()
  const [tab, setTab] = React.useState<Tab>("pending")
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedChallanId, setSelectedChallanId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const [selectedGrnIds, setSelectedGrnIds] = React.useState<Set<string>>(new Set())
  const [createShippingAddress, setCreateShippingAddress] = React.useState("")
  const [createDispatchDate, setCreateDispatchDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [createVehicleDetails, setCreateVehicleDetails] = React.useState("")
  const [createDriverName, setCreateDriverName] = React.useState("")
  const [createActiveGrnId, setCreateActiveGrnId] = React.useState<string | null>(null)
  const [createFinalDispatchQty, setCreateFinalDispatchQty] = React.useState<Record<string, string>>({})
  const [createPartialDispatch, setCreatePartialDispatch] = React.useState<Record<string, boolean>>({})
  const [createDeliveryNoteDate, setCreateDeliveryNoteDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [createTermsOfDelivery, setCreateTermsOfDelivery] = React.useState("")
  const [createDispatchedThrough, setCreateDispatchedThrough] = React.useState("Vehicle")
  const [createIncludeGstInTotal, setCreateIncludeGstInTotal] = React.useState(true)
  const [createOtherReferences, setCreateOtherReferences] = React.useState("")
  const [createHsnSacCode, setCreateHsnSacCode] = React.useState("")

  const [editForm, setEditForm] = React.useState<Partial<Challan>>({})
  const [editInitialSnapshot, setEditInitialSnapshot] = React.useState("")

  const allowed = canAccess(data.currentRole, "challan")
  const grns = data.grns
  const challans = data.challans

  const grnIdsInChallans = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of challans) {
      const nums = (c.grn_numbers ?? "").split(",").map((s) => s.trim()).filter(Boolean)
      for (const g of grns) {
        if (nums.includes(g.grn_number ?? g.grn_id)) set.add(g.grn_id)
      }
    }
    return set
  }, [challans, grns])

  const pendingGrns = React.useMemo(() => {
    const list = grns.filter((g) => g.status === "Completed" && !grnIdsInChallans.has(g.grn_id))
    return sortLatestFirst(
      list,
      (g) => latestOfDates(g.received_date, g.created_at),
      (g) => g.grn_id
    )
  }, [grns, grnIdsInChallans])

  const openCreateFromGrns = (grnIds: string[]) => {
    const ids = [...grnIds]
    setSelectedGrnIds(new Set(ids))
    setCreateActiveGrnId(ids[0] ?? null)
    const initQty: Record<string, string> = {}
    for (const id of ids) {
      const g = data.getGRN(id)
      if (g) initQty[id] = String(g.received_quantity ?? "").trim() || "0"
    }
    setCreateFinalDispatchQty(initQty)
    setCreatePartialDispatch({})
    setCreateShippingAddress("")
    setCreateDispatchDate(new Date().toISOString().slice(0, 10))
    setCreateDeliveryNoteDate(new Date().toISOString().slice(0, 10))
    setCreateTermsOfDelivery("")
    setCreateDispatchedThrough("Vehicle")
    setCreateIncludeGstInTotal(true)
    setCreateOtherReferences("")
    setCreateHsnSacCode("")
    setCreateVehicleDetails("")
    setCreateDriverName("")
    setMode("create")
  }

  const selectedGrnList = Array.from(selectedGrnIds)
  const selectedGrnKey = selectedGrnList.join("|")

  React.useEffect(() => {
    if (mode !== "create" || selectedGrnKey === "") return
    const list = selectedGrnKey.split("|").filter(Boolean)
    if (list.length === 0) return
    setCreateActiveGrnId((prev) => {
      if (prev && list.includes(prev)) return prev
      return list[0]!
    })
  }, [mode, selectedGrnKey])

  const removeGrnFromCreate = (grnId: string) => {
    setSelectedGrnIds((prev) => {
      const n = new Set(prev)
      n.delete(grnId)
      return n
    })
    setCreateFinalDispatchQty((p) => {
      const { [grnId]: _, ...rest } = p
      return rest
    })
    setCreatePartialDispatch((p) => {
      const { [grnId]: _, ...rest } = p
      return rest
    })
  }

  React.useEffect(() => {
    if (mode !== "create") return
    if (selectedGrnIds.size === 0) {
      setMode(null)
      toast.message("Add GRNs from Pending to continue.")
    }
  }, [mode, selectedGrnIds.size])

  const firstGrn = selectedGrnList.length > 0 ? data.getGRN(selectedGrnList[0]) : undefined
  const customerForAddress = firstGrn?.customer_id ? data.getCustomer(firstGrn.customer_id) : undefined
  const customerTermsOfDelivery = customerForAddress?.terms_of_delivery?.trim() ?? ""
  const shippingOptions = customerForAddress?.shipping_addresses_typed?.length
    ? customerForAddress.shipping_addresses_typed.map((a) => a.address)
    : customerForAddress?.billing_address
      ? [customerForAddress.billing_address]
      : []

  const handleAddShippingAddress = () => {
    if (!customerForAddress) {
      toast.error("Select a customer-linked GRN first to add shipping address.")
      return
    }
    const entered = window.prompt("Enter new shipping address")
    const addr = entered?.trim()
    if (!addr) return
    const existing = customerForAddress.shipping_addresses_typed ?? []
    if (existing.some((a) => a.address.trim().toLowerCase() === addr.toLowerCase())) {
      setCreateShippingAddress(addr)
      toast.message("Address already exists for this customer.")
      return
    }
    data.updateCustomer(customerForAddress.customer_id, {
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

  const handleGenerateChallan = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGrnList.length === 0) {
      toast.error("Select at least one GRN.")
      return
    }
    if (!createTermsOfDelivery.trim()) {
      toast.error("Terms of Delivery is required.")
      return
    }
    if (!createDispatchedThrough.trim()) {
      toast.error("Dispatch Through is required.")
      return
    }
    if (!createHsnSacCode.trim()) {
      toast.error("HSN/SAC Code is required.")
      return
    }
    if (!createShippingAddress.trim()) {
      toast.error("Select or enter shipping address.")
      return
    }
    const grnList = selectedGrnList.map((id) => data.getGRN(id)).filter(Boolean) as GRN[]
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
    const soId = grnList[0]?.sales_order_id ?? ""
    const so = data.getSalesOrder(soId)
    if (!so?.order_date?.trim()) {
      toast.error("Customer Order Date is required and must come from Sales Order.")
      return
    }
    const items: ChallanItem[] = grnList.map((g) => ({
      item_id: `ci_${g.grn_id}`,
      category_id: g.category_id ?? "",
      quantity: parseGrnQty(createFinalDispatchQty[g.grn_id] ?? g.received_quantity),
    }))
    const totalDispatched = items.reduce((s, it) => s + it.quantity, 0)
    let computedBase = 0
    for (const g of grnList) {
      const recv = parseGrnQty(g.received_quantity)
      const finalQ = parseGrnQty(createFinalDispatchQty[g.grn_id] ?? g.received_quantity)
      if (recv <= 0) continue
      computedBase += grnLineAmountBeforeGst(g) * (finalQ / recv)
    }
    const gstPctStr = grnList.find((g) => g.gst_percentage && String(g.gst_percentage).trim() !== "")?.gst_percentage ?? "0"
    const gstPct = parseFloat(gstPctStr) || 0
    const gstAmt = (computedBase * gstPct) / 100
    const total = computedBase + (createIncludeGstInTotal ? gstAmt : 0)
    data.addChallan({
      sales_order_id: soId,
      sales_order_number: so?.sales_order_number ?? so?.order_number,
      grn_numbers: grnList.map((g) => g.grn_number ?? g.grn_id).join(", "),
      customer_id: grnList[0]?.customer_id,
      customer_name: grnList[0]?.customer_name,
      product_category: grnList[0]?.category_name,
      quantity: String(totalDispatched),
      units: grnList[0]?.unit,
      dispatch_date: new Date(createDispatchDate).toISOString(),
      delivery_note_date: createDeliveryNoteDate,
      customer_order_date: so?.order_date?.slice(0, 10) ?? undefined,
      terms_of_delivery: createTermsOfDelivery.trim(),
      dispatched_through: createDispatchedThrough,
      delivery_note: createOtherReferences.trim() || undefined,
      hsn_sac_code: createHsnSacCode.trim(),
      items,
      shipping_address: createShippingAddress,
      status: "Generated",
      vehicle_details: createVehicleDetails || undefined,
      driver_name: createDriverName,
      base_amount: String(computedBase.toFixed(2)),
      gst_percentage: gstPctStr !== "0" ? gstPctStr : undefined,
      gst_amount: String(gstAmt.toFixed(2)),
      total_amount: String(total.toFixed(2)),
      include_gst: createIncludeGstInTotal,
    })
    toast.success("Challan generated.")
    setMode(null)
    setSelectedGrnIds(new Set())
    setTab("delivery")
  }

  const [printAfterViewOpen, setPrintAfterViewOpen] = React.useState(false)

  React.useEffect(() => {
    if (mode !== "create") return
    if (customerTermsOfDelivery.length === 0) return
    setCreateTermsOfDelivery((prev) => (prev.trim().length > 0 ? prev : customerTermsOfDelivery))
  }, [mode, customerTermsOfDelivery])

  const closeChallanDetail = React.useCallback(() => {
    setMode(null)
    setSelectedChallanId(null)
    setPrintAfterViewOpen(false)
  }, [])

  React.useEffect(() => {
    if (mode !== "view" || !printAfterViewOpen || !selectedChallanId) return
    if (!data.getChallan(selectedChallanId)) return
    const t = window.setTimeout(() => {
      window.print()
      setPrintAfterViewOpen(false)
    }, 450)
    return () => window.clearTimeout(t)
  }, [mode, printAfterViewOpen, selectedChallanId])

  const openView = (c: Challan) => {
    setPrintAfterViewOpen(false)
    setSelectedChallanId(c.challan_id)
    setEditForm(c)
    setMode("view")
  }

  const openViewThenPrint = (c: Challan) => {
    setSelectedChallanId(c.challan_id)
    setEditForm(c)
    setMode("view")
    setPrintAfterViewOpen(true)
  }

  const openEdit = (c: Challan) => {
    setSelectedChallanId(c.challan_id)
    const next = { ...c }
    setEditForm(next)
    setEditInitialSnapshot(JSON.stringify(next))
    setMode("edit")
  }

  const hasEditChanges =
    mode === "edit" && JSON.stringify(editForm) !== editInitialSnapshot

  const closeEditChallan = () => {
    if (hasEditChanges && !window.confirm("Discard changes?")) return
    closeChallanDetail()
  }

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChallanId) return
    data.updateChallan(selectedChallanId, editForm)
    toast.success("Challan updated.")
    setEditInitialSnapshot("")
    setMode(null)
    setSelectedChallanId(null)
  }

  const filteredChallans = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = challans.filter(
      (c) =>
        (c.challan_number ?? c.challan_id).toLowerCase().includes(term) ||
        (c.customer_name ?? "").toLowerCase().includes(term) ||
        (c.grn_numbers ?? "").toLowerCase().includes(term)
    )
    return sortLatestFirst(
      list,
      (c) => latestOfDates(c.dispatch_date, c.created_at),
      (c) => c.challan_id
    )
  }, [challans, searchTerm])

  const cancelCreateChallan = () => {
    if (!window.confirm("Discard changes?")) return
    setMode(null)
    setSelectedGrnIds(new Set())
  }

  const activeGrnForSummary =
    (createActiveGrnId ? data.getGRN(createActiveGrnId) : undefined) || firstGrn
  const summarySo = activeGrnForSummary?.sales_order_id
    ? data.getSalesOrder(activeGrnForSummary.sales_order_id)
    : undefined
  const soOrderedQty =
    Number(summarySo?.quantity ?? summarySo?.items?.[0]?.quantity ?? 0) || 0
  const createTitleSo =
    activeGrnForSummary?.sales_order_number ??
    summarySo?.sales_order_number ??
    summarySo?.order_number ??
    "—"

  const readOnlyMuted =
    "h-9 cursor-not-allowed rounded-md border-transparent bg-muted text-muted-foreground opacity-90"

  const createFormTotals = (() => {
    let totalFinal = 0
    let totalRecv = 0
    let totalRemainingAmt = 0
    for (const id of selectedGrnList) {
      const g = data.getGRN(id)
      if (!g) continue
      const recv = parseGrnQty(g.received_quantity)
      const finalQ = parseGrnQty(createFinalDispatchQty[id] ?? g.received_quantity)
      const lineAmt = grnLineAmountBeforeGst(g)
      totalFinal += finalQ
      totalRecv += recv
      if (recv > 0) totalRemainingAmt += lineAmt * ((recv - finalQ) / recv)
    }
    return { totalFinal, totalRecv, totalRemainingAmt }
  })()

  const renderChallanJobWorkDocument = (c: Challan) => {
    const grnRefs = (c.grn_numbers ?? "").split(",").map((s) => s.trim()).filter(Boolean)
    const relatedGrns = grnRefs
      .map((ref) => data.grns.find((g) => (g.grn_number ?? g.grn_id) === ref))
      .filter((g): g is GRN => Boolean(g))
    const rows = relatedGrns.length > 0 ? relatedGrns : []
    const base = parseFloat(c.base_amount ?? "0") || 0
    const gst = parseFloat(c.gst_amount ?? "0") || 0
    const total = parseFloat(c.total_amount ?? "0") || base + gst
    const amountWords = `Rupees ${numberToWordsEn(Math.round(total))} Only`
    return (
      <div className="rounded-md border border-border bg-background shadow-sm">
        <div className="border-b border-border px-6 py-5 sm:px-8 sm:py-6">
          <h1 className="text-center text-xl font-bold tracking-wide sm:text-2xl">JOB WORK CHALLAN</h1>
        </div>

        <div className="m-4 border border-foreground/80 p-4 sm:m-8">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-primary text-lg font-bold text-primary-foreground">
              Q
            </div>
            <div className="min-w-0 space-y-1 text-sm">
              <p className="text-lg font-bold leading-tight sm:text-xl">QLine Healthcare Pvt. Ltd</p>
              <p className="text-muted-foreground">C-7, Amausi Industrial Area, Nadarganj, Lucknow, UP-226008</p>
              <p className="text-muted-foreground">GSTIN: 09AAKFP4281G1ZY | PAN: AAKFP4281G</p>
              <p className="text-muted-foreground">Phone: +91 9876543210 | Email: info@qlinehealthcare.com</p>
            </div>
          </div>
        </div>

        <div className="mx-4 grid grid-cols-1 border border-foreground/80 sm:mx-8 lg:grid-cols-2">
          <div className="space-y-2 border-foreground/80 p-4 lg:border-r">
            <p className="text-lg font-bold">Dispatch To</p>
            <p className="text-lg font-semibold">{c.customer_name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{c.shipping_address ?? "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-y-3 p-4 text-sm">
            <div>
              <p className="font-semibold">Challan No.</p>
              <p>{c.challan_number ?? c.challan_id}</p>
            </div>
            <div>
              <p className="font-semibold">Challan Date</p>
              <p>{formatDateReadable(c.created_at ?? c.dispatch_date)}</p>
            </div>
            <div>
              <p className="font-semibold">Sales Order No.</p>
              <p>{c.sales_order_number ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold">GRN No(s).</p>
              <p>{c.grn_numbers ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Delivery Note Date</p>
              <p>{formatDateReadable(c.delivery_note_date ?? c.dispatch_date)}</p>
            </div>
            <div>
              <p className="font-semibold">Customer Order Date</p>
              <p>{c.customer_order_date ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Dispatched Through</p>
              <p>{c.dispatched_through ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Terms of Delivery</p>
              <p>{c.terms_of_delivery ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Status</p>
              <Badge variant="secondary">{c.status ?? "—"}</Badge>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-0 overflow-x-auto border-x border-b border-foreground/80 sm:mx-8">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Sl No.</TableHead>
                <TableHead>Description of Services</TableHead>
                <TableHead>HSN/SAC</TableHead>
                <TableHead>Gross Weight (Kg)</TableHead>
                <TableHead>Net Weight (Kg)</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((g, i) => (
                  <TableRow key={g.grn_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{`Irradiation Services - ${g.product_name ?? g.category_name ?? "Items"}`}</TableCell>
                    <TableCell>{c.hsn_sac_code ?? "—"}</TableCell>
                    <TableCell>{g.gross_weight ?? "—"}</TableCell>
                    <TableCell>{g.net_weight ?? "—"}</TableCell>
                    <TableCell>
                      {(c.items?.[i]?.quantity ?? (parseFloat(g.received_quantity ?? "0") || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>{g.unit ?? c.units ?? "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell className="font-medium">Irradiation Services</TableCell>
                  <TableCell>{c.hsn_sac_code ?? "—"}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>{c.quantity ?? "—"}</TableCell>
                  <TableCell>{c.units ?? "—"}</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-muted/30">
                <TableCell />
                <TableCell className="text-right font-semibold">Total</TableCell>
                <TableCell />
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell className="font-semibold">{c.quantity ?? "—"}</TableCell>
                <TableCell className="font-semibold">{c.units ?? "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mx-4 flex flex-col gap-4 border-x border-b border-foreground/80 p-4 sm:mx-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="text-sm">
            <p className="font-semibold">Amount in words:</p>
            <p>{amountWords}</p>
          </div>
          <div className="w-full max-w-[360px] space-y-2 text-sm sm:shrink-0">
            <div className="flex justify-between">
              <span>Base Amount:</span>
              <span className="font-semibold">{formatInr(base)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST:</span>
              <span className="font-semibold">{formatInr(gst)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total Amount:</span>
              <span>{formatInr(total)}</span>
            </div>
          </div>
        </div>

        <div className="mx-4 border-x border-b border-foreground/80 p-4 text-sm sm:mx-8">
          <p className="mb-2 text-base font-bold">Terms & Conditions:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Goods once dispatched will not be taken back.</li>
            <li>Please collect the products within 48 hours after processing.</li>
            <li>This challan is for job work purposes only.</li>
            <li>Subject to Lucknow jurisdiction.</li>
          </ul>
        </div>

        <div className="mx-4 grid grid-cols-1 border-x border-b border-foreground/80 sm:mx-8 md:grid-cols-2">
          <div className="border-foreground/80 p-4 text-sm md:border-r">
            <p className="font-semibold">Receiver&apos;s Signature</p>
            <p className="mt-8 text-muted-foreground">Name: _________________</p>
            <p className="text-muted-foreground">Date: _________________</p>
          </div>
          <div className="p-4 text-right text-sm">
            <p>for QLine Healthcare Pvt Ltd</p>
            <p className="mt-12 font-semibold">Authorised Signatory</p>
          </div>
        </div>

        <div className="mx-4 mb-4 border-x border-b border-foreground/80 p-3 text-center text-xs sm:mx-8 sm:mb-8">
          <p className="font-semibold">SUBJECT TO LUCKNOW JURISDICTION</p>
          <p>This is a Computer Generated Document</p>
        </div>
      </div>
    )
  }

  const challanCreateForm = (
    <div className="space-y-6">
      <form onSubmit={handleGenerateChallan} className="space-y-6">
        {/* Order summary — Pencil Ipx7D */}
        <div className="rounded-md border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Product Category</p>
              <p className="text-sm font-medium text-foreground">
                {activeGrnForSummary?.category_name ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Product Name</p>
              <p className="text-sm font-medium text-foreground">
                {activeGrnForSummary?.product_name ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Ordered Quantity</p>
              <p className="text-sm font-medium text-foreground">{soOrderedQty || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Units</p>
              <p className="text-sm font-medium text-foreground">
                {summarySo?.unit ?? activeGrnForSummary?.unit ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Select GRN */}
        <div className="rounded-md border border-border bg-card p-5 shadow-sm md:p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Select GRN</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label className="text-sm font-medium">Choose Active GRN</Label>
              <Select
                value={createActiveGrnId ?? selectedGrnList[0] ?? ""}
                onValueChange={(v) => setCreateActiveGrnId(v)}
              >
                <SelectTrigger className="h-9 rounded-md shadow-none">
                  <SelectValue placeholder="Select GRN" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGrnList.map((id) => {
                    const g = data.getGRN(id)
                    return (
                      <SelectItem key={id} value={id}>
                        {g?.grn_number ?? g?.grn_id ?? id}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="default"
              className="h-9 rounded-md shadow-none sm:shrink-0"
              onClick={() => {
                setMode(null)
                setTab("pending")
              }}
            >
              Add GRN
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="whitespace-nowrap text-xs font-medium">GRN No</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Received Quantity</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Gross Weight (Kg)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Net Weight (Kg)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Amount (₹)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">GST %</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Total Amount (₹)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium text-destructive">
                    * Final Dispatch Quantity
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Remaining Dispatch Quantity</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Remaining Pricing (₹)</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium">Edit icon</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedGrnList.map((id) => {
                  const g = data.getGRN(id)
                  if (!g) return null
                  const recv = parseGrnQty(g.received_quantity)
                  const finalStr = createFinalDispatchQty[id] ?? g.received_quantity ?? ""
                  const finalQ = parseGrnQty(finalStr)
                  const remaining = Math.max(0, recv - finalQ)
                  const lineAmt = grnLineAmountBeforeGst(g)
                  const remainingPrice = recv > 0 ? lineAmt * (remaining / recv) : 0
                  const gstPct = g.gst_percentage ?? "—"
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
                      <TableCell className="whitespace-nowrap">
                        {formatInr(grnLineAmountBeforeGst(g))}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{gstPct}</TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">{totalDisplay}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <Input
                            id={`challan-final-qty-${id}`}
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
                      <TableCell className="whitespace-nowrap">{formatInr(remainingPrice)}</TableCell>
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
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-md"
                          onClick={() =>
                            document.getElementById(`challan-final-qty-${id}`)?.focus()
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="ml-1 rounded-md"
                          onClick={() => removeGrnFromCreate(id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-primary">
              <p className="font-medium">Dispatch totals</p>
              <p className="mt-1 text-muted-foreground">
                Final dispatch (sum):{" "}
                <span className="font-medium text-foreground">{createFormTotals.totalFinal}</span>
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">Remaining</p>
              <p className="mt-1 text-muted-foreground">
                Quantity (sum of remaining):{" "}
                <span className="font-medium text-foreground">
                  {Math.max(0, createFormTotals.totalRecv - createFormTotals.totalFinal).toFixed(2)}
                </span>
              </p>
              <p className="text-muted-foreground">
                Pricing (est.):{" "}
                <span className="font-medium text-foreground">
                  {formatInr(createFormTotals.totalRemainingAmt)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="rounded-md border border-border bg-card p-5 shadow-sm md:p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Additional Details</h2>

          <div className="rounded-md border border-primary/25 bg-primary/5 p-4 space-y-2">
            <Label className="text-sm font-medium text-destructive">
              * Customer Challan Numbers (from GRNs)
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedGrnList.some((id) => data.getGRN(id)?.customer_challan_number?.trim()) ? (
                selectedGrnList.map((id) => {
                  const g = data.getGRN(id)
                  const ref = g?.customer_challan_number?.trim()
                  if (!ref || !g) return null
                  return (
                    <Badge key={id} variant="secondary" className="font-normal">
                      {g.grn_number ?? id}: {ref}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> Challan Number
              </Label>
              <Input readOnly value={data.getNextChallanNumber()} className={readOnlyMuted} />
            </div>
            <div className="space-y-2">
              <Label>
                Delivery Note Date
              </Label>
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
              <Input
                readOnly
                value={summarySo?.order_date?.slice(0, 10) ?? ""}
                className={readOnlyMuted}
              />
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
              <div className="flex h-9 items-center gap-3 rounded-md border border-border px-3">
                <Switch
                  checked={createIncludeGstInTotal}
                  onCheckedChange={(v) => setCreateIncludeGstInTotal(Boolean(v))}
                  aria-label="Include GST in total amount"
                />
                <span className="text-sm text-muted-foreground">
                  {createIncludeGstInTotal ? "GST included in challan total" : "GST excluded from challan total"}
                </span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Other References</Label>
              <Textarea
                value={createOtherReferences}
                onChange={(e) => setCreateOtherReferences(e.target.value)}
                placeholder="Enter other references"
                rows={3}
                className="min-h-[80px] resize-none rounded-md"
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
            <div className="space-y-2">
              <Label>
                <span className="text-destructive">*</span> Shipping Address
              </Label>
              <div className="flex items-center justify-end pb-1">
                <Button type="button" variant="outline" size="sm" onClick={handleAddShippingAddress}>
                  Add New
                </Button>
              </div>
              {shippingOptions.length > 0 ? (
                <Select value={createShippingAddress} onValueChange={setCreateShippingAddress}>
                  <SelectTrigger className="h-9 rounded-md shadow-none">
                    <SelectValue placeholder="Select address" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingOptions.map((addr, i) => (
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
            <div className="space-y-2">
              <Label>Dispatch Date</Label>
              <Input
                type="date"
                value={createDispatchDate}
                onChange={(e) => setCreateDispatchDate(e.target.value)}
                className="h-9 rounded-md shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Details</Label>
              <Input
                value={createVehicleDetails}
                onChange={(e) => setCreateVehicleDetails(e.target.value)}
                className="h-9 rounded-md shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Driver Name</Label>
              <Input
                value={createDriverName}
                onChange={(e) => setCreateDriverName(e.target.value)}
                className="h-9 rounded-md shadow-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md shadow-none"
              onClick={cancelCreateChallan}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-9 rounded-md px-8 shadow-none">
              Generate Challan
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
              title={`Create Challan | ${createTitleSo}`}
              noBorder
              backButton={{ onClick: cancelCreateChallan }}
            />
            <div className="space-y-4 px-6 py-4 h-full">
            {challanCreateForm}
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  if (allowed && mode === "view" && selectedChallanId) {
    const viewChallan = data.getChallan(selectedChallanId)
    if (!viewChallan) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <PageHeaderWithBack title="Challan" noBorder backButton={{ onClick: closeChallanDetail }} />
            <div className="px-6 py-4 text-muted-foreground">Challan not found.</div>
          </div>
        </PageShell>
      )
    }
    const title = `Job Work Challan - ${viewChallan.challan_number ?? viewChallan.challan_id}`
    return (
      <PageShell>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="print:hidden">
            <PageHeaderWithBack
              title={title}
              noBorder
              backButton={{ onClick: closeChallanDetail }}
              actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-md shadow-none"
                  onClick={() => openEdit(viewChallan)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-md shadow-none"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </>
            }
            />
          </div>
          <div className="flex-1 overflow-auto bg-muted/30 print:bg-background">
            <div className="mx-auto w-full max-w-[920px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
              {renderChallanJobWorkDocument(viewChallan)}
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  if (allowed && mode === "edit" && selectedChallanId) {
    const editChallan = data.getChallan(selectedChallanId)
    if (!editChallan) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <PageHeaderWithBack title="Edit Challan" noBorder backButton={{ onClick: closeChallanDetail }} />
            <div className="px-6 py-4 text-muted-foreground">Challan not found.</div>
          </div>
        </PageShell>
      )
    }
    return (
      <PageShell>
        <div className="flex flex-1 flex-col overflow-auto">
            <PageHeaderWithBack title="Edit Challan" noBorder backButton={{ onClick: closeEditChallan }} />
          <form onSubmit={handleEditSave} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-6 px-6 py-4">
              <div className="rounded-md border border-border bg-muted/30 p-4 md:p-5">
                <h3 className="text-base font-semibold text-foreground">Challan Information (Read-Only)</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Challan Number</Label>
                    <Input readOnly value={editForm.challan_number ?? editForm.challan_id ?? "—"} className={readOnlyMuted} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Sales Order No.</Label>
                    <Input readOnly value={editForm.sales_order_number ?? "—"} className={readOnlyMuted} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Product Category</Label>
                    <Input readOnly value={editForm.product_category ?? "—"} className={readOnlyMuted} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <Input readOnly value={formatDateReadable(editForm.created_at ?? editForm.dispatch_date)} className={readOnlyMuted} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Total Quantity</Label>
                    <Input readOnly value={editForm.quantity ?? "—"} className={readOnlyMuted} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <Input readOnly value={editForm.units ?? "—"} className={readOnlyMuted} />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-card p-4 md:p-5">
                <h3 className="text-base font-semibold text-foreground">Customer Details (Editable)</h3>
                <div className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <Label>Customer Name *</Label>
                    <Input
                      value={editForm.customer_name ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, customer_name: e.target.value }))}
                      className="h-9 rounded-md shadow-none"
                    />
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-4">
                    <h4 className="text-sm font-semibold text-foreground">Dispatch To Address</h4>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Address</Label>
                        <Input
                          value={editForm.dispatch_to ?? editForm.shipping_address ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              dispatch_to: e.target.value,
                              shipping_address: e.target.value,
                            }))
                          }
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>City</Label>
                        <Input
                          value={editForm.dispatch_city ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, dispatch_city: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Pincode</Label>
                        <Input
                          value={editForm.dispatch_pincode ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, dispatch_pincode: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input
                          value={editForm.dispatch_phone ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, dispatch_phone: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                          value={editForm.dispatch_email ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, dispatch_email: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>GSTIN</Label>
                        <Input
                          value={editForm.dispatch_gstin ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, dispatch_gstin: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-muted/20 p-4">
                    <h4 className="text-sm font-semibold text-foreground">Party Address</h4>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Party Name</Label>
                        <Input
                          value={editForm.party ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, party: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>City</Label>
                        <Input
                          value={editForm.party_city ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, party_city: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Pincode</Label>
                        <Input
                          value={editForm.party_pincode ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, party_pincode: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input
                          value={editForm.party_phone ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, party_phone: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input
                          value={editForm.party_email ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, party_email: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>GSTIN</Label>
                        <Input
                          value={editForm.party_gstin ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, party_gstin: e.target.value }))}
                          className="h-9 rounded-md shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-background px-6 py-4">
              <Button type="button" variant="outline" className="h-9 rounded-md shadow-none" onClick={closeEditChallan}>
                Cancel
              </Button>
              <Button type="submit" className="h-9 rounded-md shadow-none">
                Save
              </Button>
            </div>
          </form>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {!allowed ? (
        <>
          <PageHeader title="Challan Management" />
          <div className="flex-1 overflow-auto px-6 py-4">
            <p className="text-muted-foreground">You do not have permission to view this module.</p>
          </div>
        </>
      ) : (
        <>
          <PageHeaderWithTabs
            title="Challan Management"
            tabs={[
              { value: "pending", label: "Pending", badge: pendingGrns.length },
              { value: "delivery", label: "Delivery", badge: challans.length },
            ]}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
          />
          <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
            {tab === "pending" && (
              <>
                {pendingGrns.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileText className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No pending GRNs</EmptyTitle>
                      <EmptyDescription>Completed GRNs not yet in a challan will appear here.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sales Order</TableHead>
                          <TableHead>GRN No.</TableHead>
                          <TableHead>Product Category</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingGrns.map((g) => (
                          <TableRow key={g.grn_id}>
                            <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                            <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                            <TableCell>{g.category_name ?? "—"}</TableCell>
                            <TableCell>{g.customer_name ?? "—"}</TableCell>
                            <TableCell>{g.received_quantity ?? "—"}</TableCell>
                            <TableCell>{g.unit ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-md shadow-none"
                                onClick={() => openCreateFromGrns([g.grn_id])}
                              >
                                Create Challan
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

            {tab === "delivery" && (
              <>
                {challans.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileText className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No challans</EmptyTitle>
                      <EmptyDescription>Generate challans from the Pending tab.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search challans"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {filteredChallans.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              exportChallansToCsv(
                                filteredChallans.map((c) => ({
                                  "Challan Number": c.challan_number ?? c.challan_id,
                                  "Sales Order": c.sales_order_number ?? "",
                                  "GRN No.": c.grn_numbers ?? "",
                                  "Product Category": c.product_category ?? "",
                                  Customer: c.customer_name ?? "",
                                  "Created Date/Time":
                                    (c.created_at ?? c.dispatch_date)?.slice(0, 19).replace("T", " ") ?? "",
                                  Quantity: c.quantity ?? "",
                                  Units: c.units ?? "",
                                })),
                                `challans-${new Date().toISOString().slice(0, 10)}.csv`
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              exportChallansToPdf(
                                filteredChallans.map((c) => ({
                                  "Challan No": c.challan_number ?? c.challan_id,
                                  Customer: c.customer_name ?? "",
                                  "GRN Numbers": c.grn_numbers ?? "",
                                  "Dispatch Date": c.dispatch_date?.slice(0, 10) ?? "",
                                  Status: c.status ?? "",
                                  "Total Amount": c.total_amount ?? "",
                                }))
                              )
                            }
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Export PDF
                          </Button>
                        </>
                      )}
                    </div>
                    {filteredChallans.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileText className="size-4" />
                          </EmptyMedia>
                          <EmptyTitle>No matching challans</EmptyTitle>
                          <EmptyDescription>Try a different search term.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Challan Number</TableHead>
                              <TableHead>Sales Order</TableHead>
                              <TableHead>GRN No.</TableHead>
                              <TableHead>Product Category</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Created Date/Time</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Units</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredChallans.map((c) => (
                              <TableRow key={c.challan_id}>
                                <TableCell className="font-medium">{c.challan_number ?? c.challan_id}</TableCell>
                                <TableCell>{c.sales_order_number ?? "—"}</TableCell>
                                <TableCell className="max-w-[220px] truncate" title={c.grn_numbers ?? undefined}>
                                  {c.grn_numbers ?? "—"}
                                </TableCell>
                                <TableCell>{c.product_category ?? "—"}</TableCell>
                                <TableCell>{c.customer_name ?? "—"}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {(c.created_at ?? c.dispatch_date)?.slice(0, 19).replace("T", " ") ?? "—"}
                                </TableCell>
                                <TableCell>{c.quantity ?? "—"}</TableCell>
                                <TableCell>{c.units ?? "—"}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(c)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" title="Print" onClick={() => openViewThenPrint(c)}>
                                    <Printer className="h-4 w-4" />
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
