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
import { Plus, PackageCheck, Search, Printer, Send, Eye, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type ModalMode = "create" | "edit" | "view" | null

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
  const selectedCategory = selectedOrder?.category_id
    ? data.getCategory(selectedOrder.category_id)
    : undefined

  // Open view when navigated with state.openGrnId (e.g. from Sales Order View > Linked GRNs > View)
  React.useEffect(() => {
    const openGrnId = (location.state as { openGrnId?: string } | null)?.openGrnId
    if (!openGrnId) return
    const g = data.getGRN(openGrnId)
    if (g) openView(g)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state])

  // Auto-fill from Sales Order
  React.useEffect(() => {
    if (!selectedOrder) return
    setRadiationDose(selectedCategory?.dose_count != null ? String(selectedCategory.dose_count) : "")
    setRadiationUnit(selectedCategory?.dose_unit ?? "kGy")
    const soQty = Number(selectedOrder.quantity ?? selectedOrder.items?.[0]?.quantity ?? 0)
    if (mode === "create" && !receivedQuantity) setReceivedQuantity(String(soQty))
  }, [selectedOrder, selectedCategory, mode])

  // Recompute total and GST when rate or qty or gst% change
  const totalAmount = (() => {
    const r = parseFloat(rate) || 0
    const q = parseFloat(receivedQuantity) || 0
    return r * q
  })()
  const gstAmount = (totalAmount * (parseFloat(gstPercentage) || 0)) / 100
  const totalWithGst = totalAmount + gstAmount

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
    setMode(null)
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
    setMode(null)
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
                    <TableHead>Product</TableHead>
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

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create GRN" : mode === "edit" ? "Edit GRN" : "GRN Details"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={mode === "edit" ? handleUpdateSubmit : handleSubmit}>
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
                    Product: {selectedOrder.product_name ?? selectedOrder.category_name} • Category: {selectedOrder.category_name} • Unit: {selectedOrder.unit ?? "—"}
                  </p>
                )}
              </div>
            </FormSection>

            <FormSection title="Section 2 – GRN Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>GRN Number</Label>
                  <Input value={mode === "create" ? "(Auto on save)" : (data.getGRN(selectedId ?? "")?.grn_number ?? "—")} readOnly className="bg-muted" />
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

            {!isView && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button type="submit">{mode === "edit" ? "Save" : "Create GRN"}</Button>
              </DialogFooter>
            )}
          </form>
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
