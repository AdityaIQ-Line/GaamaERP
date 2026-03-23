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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Plus, PackageCheck, Search, Printer, Send, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { cn } from "@/lib/utils"

type ModalMode = "create" | "edit" | "view" | null

function formatOrderStatusLabel(status: string | undefined): string {
  if (status == null || status === "") return "—"
  return String(status).replace(/_/g, " ")
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
  const [vehicleNumber, setVehicleNumber] = React.useState("")
  const [sendForProcessingId, setSendForProcessingId] = React.useState<string | null>(null)
  const [printStickerId, setPrintStickerId] = React.useState<string | null>(null)

  const allowed = canAccess(data.currentRole, "grn")
  const grns = data.grns
  const customers = data.customers
  const orders = data.salesOrders

  // Sales orders available for GRN: same customer, status not Completed/Cancelled, total received < SO quantity
  const totalReceivedByOrder = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const g of data.grns) {
      if (!g.sales_order_id) continue
      const qty = parseFloat(g.received_quantity ?? "0") || 0
      map[g.sales_order_id] = (map[g.sales_order_id] ?? 0) + qty
    }
    return map
  }, [data.grns])

  const availableOrders = React.useMemo(() => {
    return orders.filter((o) => {
      if (o.customer_id !== customerId) return false
      if (o.order_status === "Completed" || o.order_status === "Cancelled") return false
      const soQty = Number(o.quantity ?? o.items?.[0]?.quantity ?? 0) || 0
      const received = totalReceivedByOrder[o.sales_order_id] ?? 0
      return received < soQty
    })
  }, [orders, customerId, totalReceivedByOrder])

  const selectedOrder = salesOrderId ? data.getSalesOrder(salesOrderId) : undefined
  const editingGrn = mode === "edit" && selectedId ? data.getGRN(selectedId) : undefined
  const selectedCategory = selectedOrder?.category_id
    ? data.getCategory(selectedOrder.category_id)
    : editingGrn?.category_id
      ? data.getCategory(editingGrn.category_id)
      : undefined

  // Open view when navigated with state.openGrnId (e.g. from Sales Order View > Linked GRNs > View)
  React.useEffect(() => {
    const openGrnId = (location.state as { openGrnId?: string } | null)?.openGrnId
    if (!openGrnId) return
    const g = data.getGRN(openGrnId)
    if (g) openView(g)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state])

  // Auto-fill from Sales Order (create)
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
    setVehicleNumber("")
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
    setVehicleNumber(g.vehicle_number ?? "")
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
    setVehicleNumber(g.vehicle_number ?? "")
    setSelectedId(g.grn_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      alert("Select a customer.")
      return
    }
    if (!salesOrderId) {
      alert("Select a Sales Order.")
      return
    }
    if (!customerChallanNumber.trim()) {
      alert("Customer Challan Number is required.")
      return
    }
    const qty = parseFloat(receivedQuantity) || 0
    if (qty <= 0) {
      alert("Received Quantity must be greater than 0.")
      return
    }
    if (!receivedBy.trim()) {
      alert("Received By is required.")
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
      vehicle_number: vehicleNumber || undefined,
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
      received_by: receivedBy.trim(),
      radiation_dose: radiationDose || undefined,
      radiation_unit: radiationUnit,
      remarks: remarks || undefined,
      bin_description: binDescription || undefined,
    })
    closeGrnForm()
    toast.success("GRN created.")
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    const qty = parseFloat(receivedQuantity) || 0
    data.updateGRN(selectedId, {
      customer_challan_number: customerChallanNumber,
      purchase_order_date: purchaseOrderDate ? new Date(purchaseOrderDate).toISOString().slice(0, 10) : undefined,
      received_quantity: String(qty),
      received_by: receivedBy,
      net_weight: netWeight || undefined,
      gross_weight: grossWeight || undefined,
      radiation_dose: radiationDose || undefined,
      radiation_unit: radiationUnit,
      remarks: remarks || undefined,
      rate: rate || undefined,
      pricing: rate ? String(totalAmount) : undefined,
      gst_percentage: gstPercentage || undefined,
      gst_amount: rate ? String(gstAmount.toFixed(2)) : undefined,
      total_amount: rate ? String(totalWithGst.toFixed(2)) : undefined,
      processing_priority: processingPriority || undefined,
      bin_description: binDescription || undefined,
      vehicle_number: vehicleNumber || undefined,
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

  const isView = mode === "view"
  const filteredGrns = grns.filter((g) => {
    const term = searchTerm.toLowerCase()
    return (
      (g.grn_number ?? g.grn_id).toLowerCase().includes(term) ||
      (g.sales_order_number ?? "").toLowerCase().includes(term) ||
      (g.customer_name ?? "").toLowerCase().includes(term)
    )
  })

  const soOrderedQty =
    Number(selectedOrder?.quantity ?? selectedOrder?.items?.[0]?.quantity ?? 0) || 0
  const soUnitLabel = selectedOrder?.unit ?? "carton"
  const stickerRangeDisplay =
    selectedOrder?.sticker_range_start != null && selectedOrder?.sticker_range_end != null
      ? `${selectedOrder.sticker_range_start} to ${selectedOrder.sticker_range_end}`
      : "—"
  const grnStickerRangeDisplay =
    editingGrn?.sticker_range_start != null && editingGrn?.sticker_range_end != null
      ? `${editingGrn.sticker_range_start} to ${editingGrn.sticker_range_end}`
      : "—"

  const selectTriggerPencil =
    "h-9 w-full rounded-lg border border-input bg-muted/50 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
  const inputPencil = "h-9 rounded-lg border border-input bg-background"
  const inputPencilMuted = "h-9 rounded-lg border-transparent bg-muted"

  const useFullGrnLayout = mode === "create" || mode === "edit"

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
          {/* Card: Select Customer & Sales Order — matches Pencil node 4f5Wf; edit: read-only (same data as create) */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Select Customer &amp; Sales Order</h2>
            {mode === "create" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">
                    <span className="text-destructive">*</span> Customer Name
                  </Label>
                  <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setSalesOrderId(""); }}>
                    <SelectTrigger className={selectTriggerPencil}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.customer_id} value={c.customer_id}>
                          {c.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-foreground">
                    <span className="text-destructive">*</span> Sales Order Number
                  </Label>
                  <Select value={salesOrderId} onValueChange={setSalesOrderId}>
                    <SelectTrigger className={selectTriggerPencil}>
                      <SelectValue placeholder="Select sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map((o) => (
                        <SelectItem key={o.sales_order_id} value={o.sales_order_id}>
                          {o.sales_order_number ?? o.order_number} ({o.product_name ?? o.category_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
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
                    className={cn(inputPencilMuted, "text-muted-foreground")}
                  />
                  <p className="text-xs text-muted-foreground">Linked to this GRN (read-only)</p>
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
                    className={cn(inputPencilMuted, "text-muted-foreground")}
                  />
                  <p className="text-xs text-muted-foreground">Linked to this GRN (read-only)</p>
                </div>
              </div>
            )}

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
                  {[
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
                    { label: "Sub category", value: selectedOrder.product_name ?? "—" },
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
                  ].map((row) => (
                    <div key={row.label} className="space-y-1 min-w-0">
                      <Label className="text-xs font-medium text-muted-foreground">{row.label}</Label>
                      <Input readOnly value={row.value} className={cn(inputPencil, "h-8 text-sm opacity-90 min-w-0")} />
                    </div>
                  ))}
                </div>
              </div>
            ) : editingGrn ? (
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
                  {[
                    {
                      label: "Sales Order No.",
                      value:
                        editingGrn.sales_order_number ??
                        editingGrn.sales_order_id ??
                        "—",
                    },
                    { label: "Order Date", value: "—" },
                    { label: "Expected Delivery", value: "—" },
                    { label: "Order Status", value: "—" },
                    {
                      label: "Customer Name",
                      value:
                        editingGrn.customer_name ??
                        data.getCustomer(editingGrn.customer_id ?? "")?.customer_name ??
                        "—",
                    },
                    { label: "Sub category", value: editingGrn.product_name ?? "—" },
                    { label: "Product Category", value: editingGrn.category_name ?? "—" },
                    { label: "Order Basis", value: "—" },
                    {
                      label: "Measurement / Unit",
                      value: editingGrn.unit ?? "—",
                    },
                    { label: "Total Ordered Quantity", value: "—" },
                    {
                      label: "Net Weight (SO)",
                      value: editingGrn.net_weight ?? "—",
                    },
                    {
                      label: "Gross Weight (SO)",
                      value: editingGrn.gross_weight ?? "—",
                    },
                    {
                      label: "Sticker Range (Mapped)",
                      value: grnStickerRangeDisplay,
                    },
                    {
                      label: "Rate / Unit (SO)",
                      value:
                        editingGrn.rate != null && editingGrn.rate !== ""
                          ? `₹${editingGrn.rate}`
                          : "—",
                    },
                    {
                      label: "Order Value (₹)",
                      value:
                        editingGrn.total_amount != null && editingGrn.total_amount !== ""
                          ? Number(editingGrn.total_amount).toLocaleString("en-IN")
                          : "—",
                    },
                  ].map((row) => (
                    <div key={row.label} className="space-y-1 min-w-0">
                      <Label className="text-xs font-medium text-muted-foreground">{row.label}</Label>
                      <Input readOnly value={row.value} className={cn(inputPencil, "h-8 text-sm opacity-90 min-w-0")} />
                    </div>
                  ))}
                </div>
              </div>
            ) : mode === "create" && customerId ? (
              <p className="text-sm text-muted-foreground rounded-[10px] border border-dashed border-border bg-muted/30 px-4 py-3">
                Select a <span className="font-medium text-foreground">Sales Order Number</span> to load sales
                order details and GRN entry fields.
              </p>
            ) : null}
          </div>

          {selectedOrder || mode === "edit" ? (
            <>
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
                      ? "(Auto-generated on save)"
                      : data.getGRN(selectedId ?? "")?.grn_number ?? selectedId ?? "—"
                  }
                  className={cn(inputPencilMuted, "text-muted-foreground")}
                />
                <p className="text-xs text-muted-foreground">
                  {mode === "create" ? "Auto-generated" : "GRN number"}
                </p>
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">Purchase Order Date</Label>
                <Input type="date" value={purchaseOrderDate} onChange={(e) => setPurchaseOrderDate(e.target.value)} className={inputPencil} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Customer Challan Number
                </Label>
                <Input value={customerChallanNumber} onChange={(e) => setCustomerChallanNumber(e.target.value)} className={inputPencil} />
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
                <Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className={inputPencil} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Received Quantity
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(e.target.value)}
                  placeholder={
                    selectedOrder ? `Max: ${soOrderedQty} ${soUnitLabel}` : "Enter quantity"
                  }
                  className={inputPencil}
                />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Received By
                </Label>
                <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className={inputPencil} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">Vehicle Number</Label>
                <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputPencil} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Net Weight (kg)
                </Label>
                <Input type="number" min={0} step="any" value={netWeight} onChange={(e) => setNetWeight(e.target.value)} className={inputPencil} />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-xs font-medium">
                  <span className="text-destructive">*</span> Gross Weight (kg)
                </Label>
                <Input type="number" min={0} step="any" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} className={inputPencil} />
                <p className="text-xs text-muted-foreground">Must be &gt;= Net Weight</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="min-h-[100px] rounded-lg border border-input bg-background resize-y"
              />
            </div>
          </div>

          {/* Card: Pricing & GST */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Pricing &amp; GST Details</h2>
            <p className="text-sm text-muted-foreground">
              Pricing information will be auto-fetched when creating Challan. Rate per unit is optional.
            </p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Rate per Unit (₹) <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter rate"
                  className={inputPencilMuted}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Amount (₹)</Label>
                <Input
                  readOnly
                  value={rate ? totalAmount.toFixed(2) : ""}
                  placeholder="Enter amount"
                  className={cn(inputPencilMuted, "text-muted-foreground")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  <span className="text-destructive">*</span> GST Rate (%)
                </Label>
                <Select value={gstPercentage} onValueChange={setGstPercentage}>
                  <SelectTrigger className={selectTriggerPencil}>
                    <SelectValue placeholder="Select GST %" />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "5", "12", "18", "28"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">GST Amount (₹)</Label>
                <Input
                  readOnly
                  value={rate ? gstAmount.toFixed(2) : ""}
                  placeholder="Calculated automatically"
                  className={cn(inputPencilMuted, !rate && "text-muted-foreground")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Total with GST (₹)</Label>
                <Input
                  readOnly
                  value={rate ? totalWithGst.toFixed(2) : ""}
                  placeholder="Calculated automatically"
                  className={cn(inputPencilMuted, "font-semibold", !rate && "text-muted-foreground font-normal")}
                />
              </div>
            </div>
          </div>

          {/* Card: Processing & Storage */}
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Processing &amp; Storage Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Processing Priority</Label>
                <Select value={processingPriority || "__none__"} onValueChange={(v) => setProcessingPriority(v === "__none__" ? "" : v)}>
                  <SelectTrigger className={selectTriggerPencil}>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Storage BIN Description</Label>
                <Input
                  value={binDescription}
                  onChange={(e) => setBinDescription(e.target.value)}
                  placeholder="Enter bin description for clarity"
                  className={inputPencilMuted}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!window.confirm("Discard changes?")) return
                closeGrnForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" className="h-9 rounded-lg px-8 font-medium shadow-none">
              {mode === "create" ? "Create GRN" : "Save changes"}
            </Button>
          </div>
            </>
          ) : null}
        </>
      ) : (
        <>
          <FormSection title="Section 1 – Customer & Sales Order" noSeparator>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setSalesOrderId(""); }} disabled={isView}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.customer_id} value={c.customer_id}>
                          {c.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sales Order *</Label>
                  <Select value={salesOrderId} onValueChange={setSalesOrderId} disabled={isView}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map((o) => (
                        <SelectItem key={o.sales_order_id} value={o.sales_order_id}>
                          {o.sales_order_number ?? o.order_number} ({o.product_name ?? o.category_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedOrder && (
                <p className="text-sm text-muted-foreground">
                  Sub category: {selectedOrder.product_name ?? selectedOrder.category_name} • Category: {selectedOrder.category_name} • Unit: {selectedOrder.unit ?? "—"}
                </p>
              )}
            </div>
          </FormSection>

          <FormSection title="Section 2 – GRN Details" noSeparator>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>GRN Number</Label>
                <Input value={data.getGRN(selectedId ?? "")?.grn_number ?? "—"} readOnly className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Challan Number *</Label>
                  <Input
                    value={customerChallanNumber}
                    onChange={(e) => setCustomerChallanNumber(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Order Date</Label>
                  <Input
                    type="date"
                    value={purchaseOrderDate}
                    onChange={(e) => setPurchaseOrderDate(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Received Date</Label>
                  <Input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Received Quantity *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={receivedQuantity}
                    onChange={(e) => setReceivedQuantity(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Received By *</Label>
                  <Input
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Weight</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={netWeight}
                    onChange={(e) => setNetWeight(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gross Weight</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Radiation Dose</Label>
                  <Input
                    value={radiationDose}
                    onChange={(e) => setRadiationDose(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Radiation Unit</Label>
                  <Input value={radiationUnit} onChange={(e) => setRadiationUnit(e.target.value)} readOnly={isView} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} readOnly={isView} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Section 3 – Pricing & GST" noSeparator>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Rate (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  readOnly={isView}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input value={rate ? totalAmount.toFixed(2) : "—"} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>GST %</Label>
                <Input
                  type="number"
                  min={0}
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  readOnly={isView}
                />
              </div>
              <div className="space-y-2">
                <Label>GST Amount</Label>
                <Input value={rate ? gstAmount.toFixed(2) : "—"} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Total with GST</Label>
                <Input value={rate ? totalWithGst.toFixed(2) : "—"} readOnly className="bg-muted" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Section 4 – Processing" noSeparator>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Processing Priority</Label>
                <Input
                  value={processingPriority}
                  onChange={(e) => setProcessingPriority(e.target.value)}
                  readOnly={isView}
                />
              </div>
              <div className="space-y-2">
                <Label>Bin Description</Label>
                <Input
                  value={binDescription}
                  onChange={(e) => setBinDescription(e.target.value)}
                  readOnly={isView}
                />
              </div>
            </div>
          </FormSection>

          {isView && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeGrnForm}>
                Close
              </Button>
            </DialogFooter>
          )}
        </>
      )}
    </form>
  )

  if (allowed && (mode === "create" || mode === "edit")) {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title={mode === "create" ? "Create GRN" : "Edit GRN"}
              noBorder
              backButton={{
                onClick: () => {
                  if (!window.confirm("Discard changes?")) return
                  closeGrnForm()
                },
              }}
            />
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
        <Dialog open={printStickerId !== null} onOpenChange={(open) => !open && setPrintStickerId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Print Sticker</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Print sticker for GRN: {printStickerId ? data.getGRN(printStickerId)?.grn_number ?? printStickerId : ""}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrintStickerId(null)}>Cancel</Button>
              <Button onClick={() => { window.print(); setPrintStickerId(null); }}><Printer className="h-4 w-4 mr-2" />Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                    <TableHead>GRN No.</TableHead>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Sub category</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrns.map((g) => (
                    <TableRow key={g.grn_id}>
                      <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                      <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                      <TableCell>{g.customer_name ?? "—"}</TableCell>
                      <TableCell>{g.product_name ?? g.category_name ?? "—"}</TableCell>
                      <TableCell>{g.received_quantity ?? "—"} {g.unit ?? ""}</TableCell>
                      <TableCell>{g.received_date?.slice(0, 10) ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
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

      <Dialog open={mode === "view"} onOpenChange={(open) => !open && closeGrnForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GRN Details</DialogTitle>
          </DialogHeader>
          {grnEditorForm}
        </DialogContent>
      </Dialog>

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

      <Dialog open={printStickerId !== null} onOpenChange={(open) => !open && setPrintStickerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Sticker</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Print sticker for GRN: {printStickerId ? data.getGRN(printStickerId)?.grn_number ?? printStickerId : ""}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintStickerId(null)}>Cancel</Button>
            <Button onClick={() => { window.print(); setPrintStickerId(null); }}><Printer className="h-4 w-4 mr-2" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
