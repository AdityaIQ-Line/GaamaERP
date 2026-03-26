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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FormSection } from "@/components/patterns/form-section"
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
import { useLocation, useNavigate } from "react-router-dom"
import type { GRN } from "@/lib/gaama-types"
import { Eye, Plus, PackageCheck, Search, Printer, Send, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { PrintStickerDialog } from "@/components/patterns/print-sticker-dialog"
import { cn, latestOfDates, sortLatestFirst } from "@/lib/utils"

type ModalMode = "create" | "edit" | "view" | null
const PROCESSING_PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const

/** SO / GRN snapshot row: plain text or sub categories as badges (multi-value). */
type GrnSoSummaryRow =
  | { label: string; value: string }
  | { label: string; badgeValues: string[] }

function formatOrderStatusLabel(status: string | undefined): string {
  if (status == null || status === "") return "—"
  return String(status).replace(/_/g, " ")
}

function grnStatusBadgeClassName(status: string | undefined): string {
  const s = String(status ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
  if (s === "pending") return "border-0 bg-amber-100 text-amber-950 hover:bg-amber-100"
  if (s === "in progress") return "border-0 bg-primary/15 text-primary hover:bg-primary/15"
  if (s === "completed") return "border-0 bg-emerald-100 text-emerald-950 hover:bg-emerald-100"
  return "border-0 bg-secondary text-secondary-foreground hover:bg-secondary"
}

/** Split sub category text into badge labels (comma, semicolon, newline, or spaced pipe). */
function parseSubCategoryLabels(raw: string | undefined | null): string[] {
  if (raw == null) return []
  const s = String(raw).trim()
  if (!s) return []
  const parts = s
    .split(/\s*(?:[,;\n]|\s\|\s)\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length > 1 ? parts : [s]
}

export function GRNPage() {
  const data = useData()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Form state
  const [customerId, setCustomerId] = React.useState("")
  const [salesOrderId, setSalesOrderId] = React.useState("")
  const [customerChallanNumber, setCustomerChallanNumber] = React.useState("")
  const [purchaseOrderDate, setPurchaseOrderDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [receivedDate, setReceivedDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [receivedQuantity, setReceivedQuantity] = React.useState("")
  const [receivedBy, setReceivedBy] = React.useState("")
  const [netWeight, setNetWeight] = React.useState("")
  const [grossWeight, setGrossWeight] = React.useState("")
  const [radiationDose, setRadiationDose] = React.useState("")
  const [radiationUnit, setRadiationUnit] = React.useState("kGy")
  const [remarks, setRemarks] = React.useState("")
  const [rate, setRate] = React.useState("")
  const [gstPercentage, setGstPercentage] = React.useState("18")
  const [processingPriority, setProcessingPriority] = React.useState("")
  const [binDescription, setBinDescription] = React.useState("")
  const [sendForProcessingId, setSendForProcessingId] = React.useState<string | null>(null)
  const [printStickerId, setPrintStickerId] = React.useState<string | null>(null)

  const allowed = canAccess(data.currentRole, "grn")
  const grns = data.grns
  const customers = data.customers
  const orders = data.salesOrders

  const selectedOrder = salesOrderId ? data.getSalesOrder(salesOrderId) : undefined
  const editingGrn = mode === "edit" && selectedId ? data.getGRN(selectedId) : undefined
  const snapshotGrn =
    editingGrn ?? (mode === "view" && selectedId ? data.getGRN(selectedId) : undefined)
  const selectedCategory = selectedOrder?.category_id
    ? data.getCategory(selectedOrder.category_id)
    : snapshotGrn?.category_id
      ? data.getCategory(snapshotGrn.category_id)
      : undefined

  // Deep-link: view GRN, or open create with a sales order (Sales Order → GRN).
  React.useEffect(() => {
    const st = location.state as { openGrnId?: string; salesOrderId?: string } | null
    if (!st) return
    if (st.openGrnId) {
      const g = data.getGRN(st.openGrnId)
      if (g) openView(g)
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
    if (st.salesOrderId) {
      const so = data.getSalesOrder(st.salesOrderId)
      if (so) {
        setCustomerId(so.customer_id)
        setSalesOrderId(so.sales_order_id)
        setMode("create")
      }
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  // Create: auto-pick first open sales order for the selected customer.
  React.useEffect(() => {
    if (mode !== "create" || !customerId || salesOrderId) return
    const list = orders.filter((o) => {
      if (o.customer_id !== customerId) return false
      if (o.order_status === "Completed" || o.order_status === "Cancelled") return false
      const soQty = Number(o.quantity ?? o.items?.[0]?.quantity ?? 0) || 0
      const received =
        data.grns
          .filter((g) => g.sales_order_id === o.sales_order_id)
          .reduce((s, g) => s + (parseFloat(g.received_quantity ?? "0") || 0), 0) ?? 0
      return received < soQty
    })
    const first = sortLatestFirst(
      list,
      (o) => latestOfDates(o.created_at, o.order_date),
      (o) => o.sales_order_id
    )[0]
    if (first) setSalesOrderId(first.sales_order_id)
  }, [mode, customerId, salesOrderId, orders, data.grns])

  // Auto-fill from Sales Order (create) — most fields are read-only; user edits qty / weights only.
  React.useEffect(() => {
    if (!selectedOrder) return
    setRadiationDose(selectedCategory?.dose_count != null ? String(selectedCategory.dose_count) : "")
    setRadiationUnit(selectedCategory?.dose_unit ?? "kGy")
    const soQty = Number(selectedOrder.quantity ?? selectedOrder.items?.[0]?.quantity ?? 0)
    if (mode === "create") {
      if (!receivedQuantity) setReceivedQuantity(String(soQty))
      const lineRate = selectedOrder.items?.[0]?.rate
      if (lineRate != null && !Number.isNaN(lineRate)) setRate(String(lineRate))
      if (selectedOrder.order_date) {
        setPurchaseOrderDate(selectedOrder.order_date.slice(0, 10))
      }
      if (selectedOrder.net_weight) setNetWeight(selectedOrder.net_weight)
      if (selectedOrder.gross_weight) setGrossWeight(selectedOrder.gross_weight)
      setCustomerChallanNumber((prev) =>
        prev.trim()
          ? prev
          : `Ref-${selectedOrder.sales_order_number ?? selectedOrder.sales_order_id ?? "SO"}`
      )
      setReceivedBy((prev) => (prev.trim() ? prev : "Warehouse"))
      setProcessingPriority((prev) => (prev.trim() ? prev : "Medium"))
      setRemarks((prev) => (prev.trim() ? prev : (selectedOrder.notes ?? "")))
      setReceivedDate(new Date().toISOString().slice(0, 10))
    }
  }, [selectedOrder, selectedCategory, mode])

  // Recompute total and GST when rate or qty or gst% change
  const totalAmount = (() => {
    const r = parseFloat(rate) || 0
    const q = parseFloat(receivedQuantity) || 0
    return r * q
  })()
  const gstAmount = (totalAmount * (parseFloat(gstPercentage) || 0)) / 100
  const totalWithGst = totalAmount + gstAmount

  const activeGrnRecord =
    selectedId && (mode === "edit" || mode === "view") ? data.getGRN(selectedId) : undefined
  const inspectionStatusDisplay =
    mode === "create"
      ? "Pending"
      : (activeGrnRecord?.inspection_status?.trim()
          ? activeGrnRecord.inspection_status
          : formatOrderStatusLabel(activeGrnRecord?.status as string | undefined))
  const qualityRemarksDisplay = activeGrnRecord?.quality_remarks?.trim() || "—"
  const processingInstructionsDisplay = activeGrnRecord?.processing_instructions?.trim() || "—"
  const processingPriorityDisplay =
    (processingPriority || activeGrnRecord?.processing_priority || "").trim() || "—"
  const assignedBinDisplay = activeGrnRecord?.assigned_bin?.trim() || "—"
  const binDescriptionDisplay =
    (binDescription || activeGrnRecord?.bin_description || "").trim() || "—"
  const remarksStorageDisplay = (remarks || activeGrnRecord?.remarks || "").trim() || "—"

  const closeGrnForm = React.useCallback(() => {
    setMode(null)
    setSelectedId(null)
  }, [])

  const openCreate = () => {
    setCustomerId(customers[0]?.customer_id ?? "")
    setSalesOrderId("")
    setCustomerChallanNumber("")
    setPurchaseOrderDate(new Date().toISOString().slice(0, 10))
    setReceivedDate(new Date().toISOString().slice(0, 10))
    setReceivedQuantity("")
    setReceivedBy("")
    setNetWeight("")
    setGrossWeight("")
    setRadiationDose("")
    setRadiationUnit("kGy")
    setRemarks("")
    setRate("")
    setGstPercentage("18")
    setProcessingPriority("")
    setBinDescription("")
    setSelectedId(null)
    setMode("create")
  }

  const openEdit = (g: GRN) => {
    setCustomerId(g.customer_id ?? "")
    setSalesOrderId(g.sales_order_id ?? "")
    setCustomerChallanNumber(g.customer_challan_number ?? "")
    setPurchaseOrderDate(g.purchase_order_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setReceivedDate(g.received_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setReceivedQuantity(g.received_quantity ?? "")
    setReceivedBy(g.received_by ?? "")
    setNetWeight(g.net_weight ?? "")
    setGrossWeight(g.gross_weight ?? "")
    setRadiationDose(g.radiation_dose ?? "")
    setRadiationUnit(g.radiation_unit ?? "kGy")
    setRemarks(g.remarks ?? "")
    setRate(g.rate ?? g.pricing ?? "")
    setGstPercentage(g.gst_percentage ?? "18")
    setProcessingPriority(g.processing_priority ?? "")
    setBinDescription(g.bin_description ?? "")
    setSelectedId(g.grn_id)
    setMode("edit")
  }

  const openView = (g: GRN) => {
    setCustomerId(g.customer_id ?? "")
    setSalesOrderId(g.sales_order_id ?? "")
    setCustomerChallanNumber(g.customer_challan_number ?? "")
    setPurchaseOrderDate(g.purchase_order_date?.slice(0, 10) ?? "")
    setReceivedDate(g.received_date?.slice(0, 10) ?? "")
    setReceivedQuantity(g.received_quantity ?? "")
    setReceivedBy(g.received_by ?? "")
    setNetWeight(g.net_weight ?? "")
    setGrossWeight(g.gross_weight ?? "")
    setRadiationDose(g.radiation_dose ?? "")
    setRadiationUnit(g.radiation_unit ?? "kGy")
    setRemarks(g.remarks ?? "")
    setRate(g.rate ?? g.pricing ?? "")
    setGstPercentage(g.gst_percentage ?? "18")
    setProcessingPriority(g.processing_priority ?? "")
    setBinDescription(g.bin_description ?? "")
    setSelectedId(g.grn_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      alert("No customer is set. Add customers in master data, or open Create GRN from a Sales Order.")
      return
    }
    if (!salesOrderId) {
      alert("No sales order is linked. Use Go to GRN from a Sales Order or ensure an open order exists for the default customer.")
      return
    }
    if (!customerChallanNumber.trim()) {
      alert("Customer challan reference is missing. Select a sales order to auto-fill.")
      return
    }
    const qty = parseFloat(receivedQuantity) || 0
    if (qty <= 0) {
      alert("Received Quantity must be greater than 0.")
      return
    }
    if (!netWeight.trim() || !grossWeight.trim()) {
      alert("Net weight and gross weight are required.")
      return
    }
    if (!PROCESSING_PRIORITY_OPTIONS.includes(processingPriority as (typeof PROCESSING_PRIORITY_OPTIONS)[number])) {
      alert("Select a valid processing priority (High, Medium, or Low).")
      return
    }
    const net = parseFloat(netWeight)
    const gross = parseFloat(grossWeight)
    if (!isNaN(gross) && !isNaN(net) && gross < net) {
      alert("Gross weight must be greater than or equal to net weight.")
      return
    }

    const order = data.getSalesOrder(salesOrderId)
    const cust = data.getCustomer(customerId)
    const cat = order?.category_id ? data.getCategory(order.category_id) : undefined

    data.addGRN({
      sales_order_id: salesOrderId,
      sales_order_number: order?.sales_order_number ?? order?.order_number,
      customer_id: customerId,
      customer_name: cust?.customer_name,
      category_id: order?.category_id,
      category_name: order?.category_name ?? cat?.category_name,
      product_id: order?.product_id,
      product_name: order?.product_name,
      customer_challan_number: customerChallanNumber.trim(),
      received_quantity: String(qty),
      unit: order?.unit ?? "carton",
      net_weight: netWeight || undefined,
      gross_weight: grossWeight || undefined,
      purchase_order_date: purchaseOrderDate ? new Date(purchaseOrderDate).toISOString().slice(0, 10) : undefined,
      processing_priority: processingPriority || undefined,
      received_date: new Date(receivedDate).toISOString(),
      status: "Pending",
      rate: rate || undefined,
      pricing: rate ? String(totalAmount) : undefined,
      gst_percentage: gstPercentage || undefined,
      gst_amount: rate ? String(gstAmount.toFixed(2)) : undefined,
      total_amount: rate ? String(totalWithGst.toFixed(2)) : undefined,
      received_by: receivedBy.trim() || "Warehouse",
      radiation_dose: radiationDose || undefined,
      radiation_unit: radiationUnit,
      remarks: remarks || undefined,
      bin_description: binDescription || undefined,
      inspection_status: "Pending",
    })
    closeGrnForm()
    toast.success("GRN created.")
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    const qty = parseFloat(receivedQuantity) || 0
    if (qty <= 0) {
      alert("Received Quantity must be greater than 0.")
      return
    }
    if (!netWeight.trim() || !grossWeight.trim()) {
      alert("Net weight and gross weight are required.")
      return
    }
    const net = parseFloat(netWeight)
    const gross = parseFloat(grossWeight)
    if (!isNaN(gross) && !isNaN(net) && gross < net) {
      alert("Gross weight must be greater than or equal to net weight.")
      return
    }
    data.updateGRN(selectedId, {
      received_quantity: String(qty),
      net_weight: netWeight || undefined,
      gross_weight: grossWeight || undefined,
    })
    closeGrnForm()
    toast.success("GRN updated.")
  }

  const handleSendForProcessing = (grnId: string) => {
    setSendForProcessingId(grnId)
  }

  const handleSendForProcessingConfirm = () => {
    if (sendForProcessingId) {
      data.updateGRN(sendForProcessingId, { status: "In Progress" })
      setSendForProcessingId(null)
      toast.success("GRN sent for processing.")
    }
  }

  const printStickerGrn = printStickerId ? data.getGRN(printStickerId) : undefined
  const printStickerSo =
    printStickerGrn?.sales_order_id != null
      ? data.getSalesOrder(printStickerGrn.sales_order_id)
      : undefined

  const filteredGrns = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = grns.filter(
      (g) =>
        (g.grn_number ?? g.grn_id).toLowerCase().includes(term) ||
        (g.sales_order_number ?? "").toLowerCase().includes(term) ||
        (g.customer_name ?? "").toLowerCase().includes(term)
    )
    return sortLatestFirst(
      list,
      (g) => latestOfDates(g.received_date, g.created_at),
      (g) => g.grn_id
    )
  }, [grns, searchTerm])

  const soOrderedQty =
    Number(selectedOrder?.quantity ?? selectedOrder?.items?.[0]?.quantity ?? 0) || 0
  const soUnitLabel = selectedOrder?.unit ?? "carton"
  const stickerRangeDisplay =
    selectedOrder?.sticker_range_start != null && selectedOrder?.sticker_range_end != null
      ? `${selectedOrder.sticker_range_start} to ${selectedOrder.sticker_range_end}`
      : "—"
  const grnStickerRangeDisplay =
    snapshotGrn?.sticker_range_start != null && snapshotGrn?.sticker_range_end != null
      ? `${snapshotGrn.sticker_range_start} to ${snapshotGrn.sticker_range_end}`
      : "—"

  const inputPencil = "h-9 rounded-lg border border-input bg-background"
  const inputPencilMuted = "h-9 rounded-lg border-transparent bg-muted"
  const readOnlyFieldClass = cn(inputPencilMuted, "cursor-not-allowed text-muted-foreground opacity-90")
  const readOnlyTextareaClass =
    "min-h-[88px] w-full cursor-not-allowed resize-none rounded-lg border border-transparent bg-muted px-3 py-2 text-sm text-muted-foreground opacity-90"

  const renderSoSummaryCell = (row: GrnSoSummaryRow) => (
    <div key={row.label} className="space-y-1 min-w-0">
      <Label className="text-xs font-medium text-muted-foreground">{row.label}</Label>
      {"badgeValues" in row ? (
        <div
          className={cn(
            inputPencil,
            "flex h-auto min-h-8 flex-wrap items-center gap-1.5 py-1.5 text-sm opacity-90"
          )}
        >
          {row.badgeValues.length === 0 ? (
            <span className="px-1 text-muted-foreground">—</span>
          ) : (
            row.badgeValues.map((text, i) => (
              <Badge
                key={`${row.label}-${i}-${text}`}
                variant="secondary"
                className="max-w-full truncate font-normal"
                title={text}
              >
                {text}
              </Badge>
            ))
          )}
        </div>
      ) : (
        <Input readOnly value={row.value} className={cn(inputPencil, "h-8 text-sm opacity-90 min-w-0")} />
      )}
    </div>
  )

  const useFullGrnLayout = mode === "create" || mode === "edit" || mode === "view"
  const canEditQtyWeights = mode === "create" || mode === "edit"

  const grnEditorForm = (
    <form
      onSubmit={(e) => {
        if (mode === "view") {
          e.preventDefault()
          return
        }
        if (mode === "edit") handleUpdateSubmit(e)
        else handleSubmit(e)
      }}
      className={useFullGrnLayout ? "space-y-4" : undefined}
    >
      {useFullGrnLayout ? (
        <>
          {/* Customer & Sales Order (read-only on create/edit) */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Customer &amp; Sales Order</h2>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "Customer and order are fixed from your entry point (default customer and first open order, or Sales Order → GRN)."
                : mode === "view"
                  ? "Read-only GRN record."
                  : "Linked to this GRN (read-only)."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Customer Name</Label>
                <Input
                  readOnly
                  value={
                    data.getCustomer(customerId)?.customer_name ??
                    data.getGRN(selectedId ?? "")?.customer_name ??
                    "—"
                  }
                  className={readOnlyFieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Sales Order Number</Label>
                <Input
                  readOnly
                  value={
                    selectedOrder?.sales_order_number ??
                    selectedOrder?.order_number ??
                    data.getGRN(selectedId ?? "")?.sales_order_number ??
                    "—"
                  }
                  className={readOnlyFieldClass}
                />
              </div>
            </div>

            {selectedOrder ? (
              <div className="rounded-[10px] border border-primary/25 bg-primary/5 p-3 md:p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Sales Order Information</h3>
                  <Badge className="border-0 bg-primary text-primary-foreground hover:bg-primary">From sales order</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shown after you select a sales order. Use these values as reference when entering the GRN below.
                </p>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {(
                    [
                      {
                        label: "Sales Order No.",
                        value:
                          selectedOrder.sales_order_number ??
                          selectedOrder.order_number ??
                          selectedOrder.sales_order_id,
                      },
                      { label: "Order Date", value: selectedOrder.order_date?.slice(0, 10) ?? "—" },
                      {
                        label: "Expected Delivery",
                        value: selectedOrder.delivery_date?.slice(0, 10) ?? "—",
                      },
                      {
                        label: "Order Status",
                        value: formatOrderStatusLabel(selectedOrder.order_status as string | undefined),
                      },
                      {
                        label: "Customer Name",
                        value:
                          selectedOrder.customer_name ??
                          data.getCustomer(selectedOrder.customer_id)?.customer_name ??
                          "—",
                      },
                      {
                        label: "Sub category",
                        badgeValues: parseSubCategoryLabels(selectedOrder.product_name),
                      },
                      { label: "Product Category", value: selectedOrder.category_name ?? "—" },
                      {
                        label: "Order Basis",
                        value: selectedOrder.order_basis ?? "—",
                      },
                      {
                        label: "Measurement / Unit",
                        value: [selectedOrder.measurement_type, selectedOrder.unit].filter(Boolean).join(" · ") || "—",
                      },
                      { label: "Total Ordered Quantity", value: String(soOrderedQty) },
                      {
                        label: "Net Weight (SO)",
                        value: selectedOrder.net_weight ?? "—",
                      },
                      {
                        label: "Gross Weight (SO)",
                        value: selectedOrder.gross_weight ?? "—",
                      },
                      {
                        label: "Sticker Range (Mapped)",
                        value: stickerRangeDisplay,
                      },
                      {
                        label: "Rate / Unit (SO)",
                        value:
                          selectedOrder.items?.[0]?.rate != null
                            ? `₹${selectedOrder.items[0].rate}`
                            : "—",
                      },
                      {
                        label: "Order Value (₹)",
                        value:
                          selectedOrder.total_amount != null
                            ? selectedOrder.total_amount.toLocaleString("en-IN")
                            : "—",
                      },
                    ] satisfies GrnSoSummaryRow[]
                  ).map(renderSoSummaryCell)}
                </div>
              </div>
            ) : snapshotGrn ? (
              <div className="rounded-[10px] border border-primary/25 bg-primary/5 p-3 md:p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Sales Order Information</h3>
                  <Badge variant="secondary" className="border border-border bg-background">
                    From GRN snapshot
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Linked sales order record was not found. Values below are stored on this GRN for reference.
                </p>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {(
                    [
                      {
                        label: "Sales Order No.",
                        value:
                          snapshotGrn.sales_order_number ??
                          snapshotGrn.sales_order_id ??
                          "—",
                      },
                      { label: "Order Date", value: "—" },
                      { label: "Expected Delivery", value: "—" },
                      { label: "Order Status", value: "—" },
                      {
                        label: "Customer Name",
                        value:
                          snapshotGrn.customer_name ??
                          data.getCustomer(snapshotGrn.customer_id ?? "")?.customer_name ??
                          "—",
                      },
                      {
                        label: "Sub category",
                        badgeValues: parseSubCategoryLabels(snapshotGrn.product_name),
                      },
                      { label: "Product Category", value: snapshotGrn.category_name ?? "—" },
                      { label: "Order Basis", value: "—" },
                      {
                        label: "Measurement / Unit",
                        value: snapshotGrn.unit ?? "—",
                      },
                      { label: "Total Ordered Quantity", value: "—" },
                      {
                        label: "Net Weight (SO)",
                        value: snapshotGrn.net_weight ?? "—",
                      },
                      {
                        label: "Gross Weight (SO)",
                        value: snapshotGrn.gross_weight ?? "—",
                      },
                      {
                        label: "Sticker Range (Mapped)",
                        value: grnStickerRangeDisplay,
                      },
                      {
                        label: "Rate / Unit (SO)",
                        value:
                          snapshotGrn.rate != null && snapshotGrn.rate !== ""
                            ? `₹${snapshotGrn.rate}`
                            : "—",
                      },
                      {
                        label: "Order Value (₹)",
                        value:
                          snapshotGrn.total_amount != null && snapshotGrn.total_amount !== ""
                            ? Number(snapshotGrn.total_amount).toLocaleString("en-IN")
                            : "—",
                      },
                    ] satisfies GrnSoSummaryRow[]
                  ).map(renderSoSummaryCell)}
                </div>
              </div>
            ) : mode === "create" && customerId && !salesOrderId ? (
              <p className="text-sm text-muted-foreground rounded-[10px] border border-dashed border-border bg-muted/30 px-4 py-3">
                No open sales order with remaining quantity for this customer. Create or complete a sales order
                first, or use <span className="font-medium text-foreground">Go to GRN</span> from a specific order.
              </p>
            ) : null}
          </div>

          {/* Card: GRN Details */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">GRN Details</h2>
            <div className="grid h-fit grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> GRN Number
                </Label>
                <Input
                  readOnly
                  value={
                    mode === "create"
                      ? data.getNextGRNNumber()
                      : data.getGRN(selectedId ?? "")?.grn_number ?? selectedId ?? "—"
                  }
                  className={cn(inputPencilMuted, "text-muted-foreground")}
                />
                <p className="text-xs text-muted-foreground">
                  {mode === "create"
                    ? "Next number in sequence; confirmed when you save."
                    : "GRN number"}
                </p>
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">Purchase Order Date</Label>
                <Input type="date" readOnly value={purchaseOrderDate} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Customer Challan Number
                </Label>
                <Input readOnly value={customerChallanNumber} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Radiation Dose (Auto-filled)</Label>
                <Input readOnly value={radiationDose} className={cn(inputPencilMuted, "text-muted-foreground")} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">Radiation Unit</Label>
                <Input readOnly value={radiationUnit} className={cn(inputPencilMuted, "text-muted-foreground")} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">Received Date</Label>
                <Input type="date" readOnly value={receivedDate} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Received Quantity
                </Label>
                <Input
                  type="number"
                  min={0}
                  readOnly={!canEditQtyWeights}
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(e.target.value)}
                  placeholder={
                    selectedOrder ? `Max: ${soOrderedQty} ${soUnitLabel}` : "Enter quantity"
                  }
                  className={canEditQtyWeights ? inputPencil : readOnlyFieldClass}
                />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Received By
                </Label>
                <Input readOnly value={receivedBy} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Net Weight (kg)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  readOnly={!canEditQtyWeights}
                  value={netWeight}
                  onChange={(e) => setNetWeight(e.target.value)}
                  className={canEditQtyWeights ? inputPencil : readOnlyFieldClass}
                />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Gross Weight (kg)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  readOnly={!canEditQtyWeights}
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className={canEditQtyWeights ? inputPencil : readOnlyFieldClass}
                />
                <p className="text-xs text-muted-foreground">Must be &gt;= Net Weight</p>
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Processing Priority
                </Label>
                {mode === "create" ? (
                  <Select value={processingPriority} onValueChange={setProcessingPriority}>
                    <SelectTrigger className={inputPencil}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCESSING_PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input readOnly value={processingPriorityDisplay} className={readOnlyFieldClass} />
                )}
              </div>
            </div>
          </div>

          {/* Quality & processing (read-only) — Pencil G1ZMe */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Quality &amp; Processing Details</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Read-only</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Inspection Status</Label>
                <Input readOnly value={inspectionStatusDisplay} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Processing Priority</Label>
                <Input readOnly value={processingPriorityDisplay} className={readOnlyFieldClass} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Quality Remarks</Label>
              <Textarea readOnly value={qualityRemarksDisplay} rows={4} className={readOnlyTextareaClass} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Processing Instructions</Label>
              <Textarea readOnly value={processingInstructionsDisplay} rows={4} className={readOnlyTextareaClass} />
            </div>
          </div>

          {/* Pricing & GST (read-only) — Pencil UxqmB */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Pricing &amp; GST Details</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Read-only</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Total Amount (₹)</Label>
                <Input
                  readOnly
                  value={rate ? totalAmount.toFixed(2) : "—"}
                  className={readOnlyFieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">GST Rate (%)</Label>
                <Input readOnly value={gstPercentage ? `${gstPercentage}%` : "—"} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">GST Amount (₹)</Label>
                <Input
                  readOnly
                  value={rate ? gstAmount.toFixed(2) : "—"}
                  className={readOnlyFieldClass}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Total with GST (₹)</Label>
                <Input
                  readOnly
                  value={rate ? totalWithGst.toFixed(2) : "—"}
                  className={cn(readOnlyFieldClass, rate ? "font-semibold" : "")}
                />
              </div>
            </div>
          </div>

          {/* Processing & storage (read-only) — Pencil XaNZK */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Processing &amp; Storage Details</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Read-only</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Assigned BIN ID</Label>
                <Input readOnly value={assignedBinDisplay} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">BIN Description</Label>
                <Input readOnly value={binDescriptionDisplay} className={readOnlyFieldClass} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Remarks</Label>
              <Textarea readOnly value={remarksStorageDisplay} rows={4} className={readOnlyTextareaClass} />
            </div>
          </div>

          {canEditQtyWeights ? (
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md shadow-none"
                onClick={() => {
                  if (!window.confirm("Discard changes?")) return
                  closeGrnForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" className="h-9 rounded-md px-8 font-medium shadow-none">
                {mode === "create" ? "Create GRN" : "Save changes"}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <FormSection title="Customer & Sales Order" noSeparator>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input
                    readOnly
                    value={
                      data.getCustomer(customerId)?.customer_name ??
                      data.getGRN(selectedId ?? "")?.customer_name ??
                      "—"
                    }
                    className={readOnlyFieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sales Order</Label>
                  <Input
                    readOnly
                    value={
                      selectedOrder?.sales_order_number ??
                      selectedOrder?.order_number ??
                      data.getGRN(selectedId ?? "")?.sales_order_number ??
                      "—"
                    }
                    className={readOnlyFieldClass}
                  />
                </div>
              </div>
              {selectedOrder && (
                <p className="text-sm text-muted-foreground">
                  Sub category: {selectedOrder.product_name ?? selectedOrder.category_name} • Category:{" "}
                  {selectedOrder.category_name} • Unit: {selectedOrder.unit ?? "—"}
                </p>
              )}
            </div>
          </FormSection>

          <FormSection title="GRN Details" noSeparator>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>GRN Number</Label>
                <Input readOnly value={data.getGRN(selectedId ?? "")?.grn_number ?? "—"} className={readOnlyFieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Challan Number</Label>
                  <Input readOnly value={customerChallanNumber} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Order Date</Label>
                  <Input type="date" readOnly value={purchaseOrderDate} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Received Date</Label>
                  <Input type="date" readOnly value={receivedDate} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Received Quantity</Label>
                  <Input type="number" readOnly value={receivedQuantity} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Received By</Label>
                  <Input readOnly value={receivedBy} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Net Weight (kg)</Label>
                  <Input type="number" readOnly value={netWeight} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Gross Weight (kg)</Label>
                  <Input type="number" readOnly value={grossWeight} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Radiation Dose</Label>
                  <Input readOnly value={radiationDose} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Radiation Unit</Label>
                  <Input readOnly value={radiationUnit} className={readOnlyFieldClass} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Quality & Processing (read-only)" noSeparator>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inspection Status</Label>
                  <Input readOnly value={inspectionStatusDisplay} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>Processing Priority</Label>
                  <Input readOnly value={processingPriorityDisplay} className={readOnlyFieldClass} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quality Remarks</Label>
                <Textarea readOnly value={qualityRemarksDisplay} rows={3} className={readOnlyTextareaClass} />
              </div>
              <div className="space-y-2">
                <Label>Processing Instructions</Label>
                <Textarea readOnly value={processingInstructionsDisplay} rows={3} className={readOnlyTextareaClass} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Pricing & GST (read-only)" noSeparator>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Total Amount (₹)</Label>
                <Input readOnly value={rate ? totalAmount.toFixed(2) : "—"} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-2">
                <Label>GST Rate</Label>
                <Input readOnly value={gstPercentage ? `${gstPercentage}%` : "—"} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-2">
                <Label>GST Amount (₹)</Label>
                <Input readOnly value={rate ? gstAmount.toFixed(2) : "—"} className={readOnlyFieldClass} />
              </div>
              <div className="space-y-2">
                <Label>Total with GST (₹)</Label>
                <Input readOnly value={rate ? totalWithGst.toFixed(2) : "—"} className={readOnlyFieldClass} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Processing & Storage (read-only)" noSeparator>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned BIN ID</Label>
                  <Input readOnly value={assignedBinDisplay} className={readOnlyFieldClass} />
                </div>
                <div className="space-y-2">
                  <Label>BIN Description</Label>
                  <Input readOnly value={binDescriptionDisplay} className={readOnlyFieldClass} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea readOnly value={remarksStorageDisplay} rows={3} className={readOnlyTextareaClass} />
              </div>
            </div>
          </FormSection>

        </>
      )}
    </form>
  )

  const viewHeaderGrn = mode === "view" && selectedId ? data.getGRN(selectedId) : undefined

  if (allowed && (mode === "create" || mode === "edit" || mode === "view")) {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title={
                mode === "create" ? "Create GRN" : mode === "edit" ? "Edit GRN" : "View GRN"
              }
              noBorder
              backButton={{
                onClick: () => {
                  if (mode === "view") {
                    closeGrnForm()
                    return
                  }
                  if (!window.confirm("Discard changes?")) return
                  closeGrnForm()
                },
              }}
              actions={
                mode === "view" && viewHeaderGrn ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md shadow-none"
                      onClick={() => openEdit(viewHeaderGrn)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit GRN
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md shadow-none"
                      onClick={() => setPrintStickerId(viewHeaderGrn.grn_id)}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print Sticker
                    </Button>
                    {viewHeaderGrn.status === "Pending" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-md shadow-none"
                        onClick={() => handleSendForProcessing(viewHeaderGrn.grn_id)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send for Processing
                      </Button>
                    ) : null}
                  </div>
                ) : undefined
              }
            />
            {mode === "view" && viewHeaderGrn ? (
              <div className="mx-6 mt-2 rounded-md bg-gradient-to-r from-primary to-primary/75 px-5 py-4 text-primary-foreground shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
                      Goods Receipt Note
                    </p>
                    <h2 className="truncate text-xl font-semibold tracking-tight">
                      {viewHeaderGrn.grn_number ?? viewHeaderGrn.grn_id}
                    </h2>
                    <p className="text-sm text-primary-foreground/90">
                      Sales order:{" "}
                      {viewHeaderGrn.sales_order_number ?? viewHeaderGrn.sales_order_id ?? "—"}
                    </p>
                  </div>
                  <Badge className={cn("shrink-0 font-medium", grnStatusBadgeClassName(viewHeaderGrn.status))}>
                    {formatOrderStatusLabel(viewHeaderGrn.status)}
                  </Badge>
                </div>
              </div>
            ) : null}
            <div className="space-y-4 px-6 py-4 h-full">{grnEditorForm}</div>
          </div>
        </div>
        <AlertDialog open={sendForProcessingId !== null} onOpenChange={(open) => !open && setSendForProcessingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send for Processing</AlertDialogTitle>
              <AlertDialogDescription>
                Send this GRN to Process Tracking? Status will be set to In Progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSendForProcessingConfirm}>Send</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <PrintStickerDialog
          open={printStickerId !== null}
          onOpenChange={(o) => {
            if (!o) setPrintStickerId(null)
          }}
          grn={printStickerGrn}
          salesOrder={printStickerSo}
          siblingGrns={data.grns}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="GRN (Goods Receipt Note)"
        actions={
          allowed ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create GRN
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : grns.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageCheck className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No GRN records</EmptyTitle>
              <EmptyDescription>Create a GRN from an approved Sales Order.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Create GRN</Button>
          </Empty>
        ) : (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by GRN number, SO, or customer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN Number</TableHead>
                    <TableHead>Sales Order No</TableHead>
                    <TableHead>Date of Receipt</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Product Category</TableHead>
                    <TableHead>Received Quantity</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrns.map((g) => (
                    <TableRow key={g.grn_id}>
                      <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                      <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                      <TableCell>{g.received_date?.slice(0, 10) ?? "—"}</TableCell>
                      <TableCell>{g.customer_name ?? "—"}</TableCell>
                      <TableCell>{g.category_name ?? "—"}</TableCell>
                      <TableCell>
                        {g.received_quantity ?? "—"}
                        {g.unit ? ` ${g.unit}` : ""}
                      </TableCell>
                      <TableCell>{g.received_by?.trim() ? g.received_by : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" title="View" onClick={() => openView(g)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(g)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Print Sticker" onClick={() => setPrintStickerId(g.grn_id)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {g.status === "Pending" && (
                          <Button variant="ghost" size="sm" title="Send for Processing" onClick={() => handleSendForProcessing(g.grn_id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={sendForProcessingId !== null} onOpenChange={(open) => !open && setSendForProcessingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send for Processing</AlertDialogTitle>
            <AlertDialogDescription>
              Send this GRN to Process Tracking? Status will be set to In Progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendForProcessingConfirm}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PrintStickerDialog
        open={printStickerId !== null}
        onOpenChange={(o) => {
          if (!o) setPrintStickerId(null)
        }}
        grn={printStickerGrn}
        salesOrder={printStickerSo}
        siblingGrns={data.grns}
      />
    </PageShell>
  )
}
