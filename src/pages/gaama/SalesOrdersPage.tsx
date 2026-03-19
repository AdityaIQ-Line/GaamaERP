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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
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
import type { SalesOrder, SalesOrderItem } from "@/lib/gaama-types"
import { Plus, ShoppingCart, Search, PackageCheck, Eye, Pencil, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"

type ModalMode = "create" | "edit" | "view" | null

const MEASUREMENT_TYPES = ["carton", "bag", "weight"]
const ORDER_BASIS_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "vehicle", label: "Vehicle" },
  { value: "weight", label: "Weight" },
]
const WEIGHT_TYPE_OPTIONS = [
  { value: "net", label: "Net" },
  { value: "gross", label: "Gross" },
]

const orderStatusColors: Record<string, "default" | "secondary" | "outline"> = {
  Draft: "secondary",
  Approved: "outline",
  draft: "secondary",
  confirmed: "outline",
  in_production: "default",
  dispatched: "default",
  invoiced: "default",
  closed: "secondary",
  Completed: "default",
  Cancelled: "secondary",
}

export function SalesOrdersPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Form state (single-product)
  const [orderDate, setOrderDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [deliveryDate, setDeliveryDate] = React.useState("")
  const [customerId, setCustomerId] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [productId, setProductId] = React.useState("")
  const [measurementType, setMeasurementType] = React.useState("carton")
  const [quantity, setQuantity] = React.useState<string>("")
  const [netWeight, setNetWeight] = React.useState("")
  const [grossWeight, setGrossWeight] = React.useState("")
  const [orderBasis, setOrderBasis] = React.useState<"standard" | "vehicle" | "weight">("standard")
  const [weightTypeForInvoicing, setWeightTypeForInvoicing] = React.useState<"net" | "gross">("net")
  const [stickerRangeStart, setStickerRangeStart] = React.useState<string>("")
  const [stickerRangeEnd, setStickerRangeEnd] = React.useState<string>("")
  const [notes, setNotes] = React.useState("")
  const [approveTargetId, setApproveTargetId] = React.useState<string | null>(null)

  const allowed = canAccess(data.currentRole, "sales-orders")
  const orders = data.salesOrders
  const categories = data.categories
  const customers = data.customers

  const selectedCategory = categoryId ? data.getCategory(categoryId) : undefined
  const products = selectedCategory?.subcategories ?? []
  const selectedCustomer = customerId ? data.getCustomer(customerId) : undefined

  // When category changes, clear product
  React.useEffect(() => {
    if (!categoryId) {
      setProductId("")
      return
    }
    const subs = data.getCategory(categoryId)?.subcategories ?? []
    if (!subs.some((s) => s.id === productId)) setProductId("")
  }, [categoryId, data, productId])

  // Sticker range: when quantity and measurement is carton/bag, set start from getNextStickerNumber and end = start + qty - 1
  const qtyNum = Number(quantity) || 0
  const isStickerType = measurementType === "carton" || measurementType === "bag"
  React.useEffect(() => {
    if (!isStickerType || qtyNum <= 0) return
    const start = data.getNextStickerNumber()
    setStickerRangeStart(String(start))
    setStickerRangeEnd(String(start + qtyNum - 1))
  }, [isStickerType, qtyNum, measurementType, quantity])

  const openCreate = () => {
    setOrderDate(new Date().toISOString().slice(0, 10))
    setDeliveryDate("")
    setCustomerId(customers[0]?.customer_id ?? "")
    setCategoryId(categories[0]?.category_id ?? "")
    setProductId("")
    setMeasurementType("carton")
    setQuantity("")
    setNetWeight("")
    setGrossWeight("")
    setOrderBasis("standard")
    setWeightTypeForInvoicing("net")
    setStickerRangeStart("")
    setStickerRangeEnd("")
    setNotes("")
    setSelectedId(null)
    setMode("create")
  }

  const openEdit = (o: SalesOrder) => {
    setOrderDate(o.order_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setDeliveryDate(o.delivery_date?.slice(0, 10) ?? "")
    setCustomerId(o.customer_id)
    setCategoryId(o.category_id ?? "")
    setProductId(o.product_id ?? "")
    setMeasurementType((o.measurement_type as "carton" | "bag" | "weight") ?? "carton")
    setQuantity(o.quantity ?? String(o.items?.[0]?.quantity ?? ""))
    setNetWeight(o.net_weight ?? "")
    setGrossWeight(o.gross_weight ?? "")
    setOrderBasis(o.order_basis ?? "standard")
    setWeightTypeForInvoicing(o.weight_type_for_invoicing ?? "net")
    setStickerRangeStart(o.sticker_range_start != null ? String(o.sticker_range_start) : "")
    setStickerRangeEnd(o.sticker_range_end != null ? String(o.sticker_range_end) : "")
    setNotes(o.notes ?? "")
    setSelectedId(o.sales_order_id)
    setMode("edit")
  }

  const openView = (o: SalesOrder) => {
    setOrderDate(o.order_date?.slice(0, 10) ?? "")
    setDeliveryDate(o.delivery_date?.slice(0, 10) ?? "")
    setCustomerId(o.customer_id)
    setCategoryId(o.category_id ?? "")
    setProductId(o.product_id ?? "")
    setMeasurementType((o.measurement_type as "carton" | "bag" | "weight") ?? "carton")
    setQuantity(o.quantity ?? String(o.items?.[0]?.quantity ?? ""))
    setNetWeight(o.net_weight ?? "")
    setGrossWeight(o.gross_weight ?? "")
    setOrderBasis(o.order_basis ?? "standard")
    setWeightTypeForInvoicing(o.weight_type_for_invoicing ?? "net")
    setStickerRangeStart(o.sticker_range_start != null ? String(o.sticker_range_start) : "")
    setStickerRangeEnd(o.sticker_range_end != null ? String(o.sticker_range_end) : "")
    setNotes(o.notes ?? "")
    setSelectedId(o.sales_order_id)
    setMode("view")
  }

  const buildPayload = (status: "Draft" | "Approved") => {
    const cat = data.getCategory(categoryId)
    const cust = data.getCustomer(customerId)
    const productName = products.find((p) => p.id === productId)?.name ?? ""
    const unit = measurementType === "weight" ? "kg" : measurementType === "carton" ? "carton" : "bag"
    const rate = data.getRatesByCategory(categoryId)[0]
    const rateVal = rate?.rate_value ?? 0
    const qty = qtyNum || 0
    const totalAmount = qty * rateVal
    const item: SalesOrderItem = {
      item_id: `item_${Date.now()}`,
      category_id: categoryId,
      quantity: qty,
      rate: rateVal,
      total_price: totalAmount,
    }
    return {
      customer_id: customerId,
      customer_name: cust?.customer_name,
      order_date: new Date(orderDate).toISOString(),
      delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      order_status: status,
      items: [item],
      total_amount: totalAmount,
      tax_amount: totalAmount * 0.18,
      category_id: categoryId,
      category_name: cat?.category_name,
      product_id: productId,
      product_name: productName,
      quantity: String(qty),
      unit,
      measurement_type: measurementType,
      order_basis: orderBasis,
      weight_type_for_invoicing: orderBasis === "weight" ? weightTypeForInvoicing : undefined,
      net_weight: netWeight || undefined,
      gross_weight: grossWeight || undefined,
      sticker_range_start: isStickerType && stickerRangeStart ? Number(stickerRangeStart) : undefined,
      sticker_range_end: isStickerType && stickerRangeEnd ? Number(stickerRangeEnd) : undefined,
      is_vehicle_basis: orderBasis === "vehicle",
      notes: notes || undefined,
    }
  }

  const validate = (): string | null => {
    if (!customerId) return "Select a customer."
    if (!orderDate) return "Order date is required."
    if (!categoryId) return "Select a category."
    if (!productId) return "Select a product."
    if (!quantity || qtyNum <= 0) return "Quantity must be greater than 0."
    const net = parseFloat(netWeight)
    const gross = parseFloat(grossWeight)
    if (grossWeight && netWeight && !isNaN(gross) && !isNaN(net) && gross < net)
      return "Gross weight must be ≥ net weight."
    return null
  }

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      alert(err)
      return
    }
    if (mode === "create") {
      data.addSalesOrder(buildPayload("Draft"))
      setMode(null)
      toast.success("Order saved as draft.")
    } else if (mode === "edit" && selectedId) {
      data.updateSalesOrder(selectedId, buildPayload("Draft"))
      setMode(null)
      toast.success("Order updated.")
    }
  }

  const handleSaveAndApprove = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      alert(err)
      return
    }
    if (mode === "create") {
      data.addSalesOrder(buildPayload("Approved"))
      setMode(null)
      toast.success("Order saved and approved.")
    } else if (mode === "edit" && selectedId) {
      data.updateSalesOrder(selectedId, buildPayload("Approved"))
      setMode(null)
      toast.success("Order approved.")
    }
  }

  const handleApproveFromList = (orderId: string) => {
    setApproveTargetId(orderId)
  }

  const handleApproveConfirm = () => {
    if (!approveTargetId) return
    const o = data.getSalesOrder(approveTargetId)
    if (o && (o.order_status === "Draft" || o.order_status === "draft")) {
      data.updateSalesOrder(approveTargetId, { order_status: "Approved" })
      toast.success("Order approved.")
    }
    setApproveTargetId(null)
  }

  const isView = mode === "view"
  const filteredOrders = orders.filter((o) => {
    const soNum = o.sales_order_number ?? o.order_number ?? o.sales_order_id
    const custName = data.getCustomer(o.customer_id)?.customer_name ?? ""
    const term = searchTerm.toLowerCase()
    return (
      (soNum ?? "").toLowerCase().includes(term) ||
      custName.toLowerCase().includes(term) ||
      (o.order_status ?? "").toLowerCase().includes(term)
    )
  })

  const grnsForOrder = (salesOrderId: string) =>
    data.grns.filter((g) => g.sales_order_id === salesOrderId)

  return (
    <PageShell>
      <PageHeader
        title="Sales Orders"
        actions={
          allowed ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Sales Order
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : orders.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingCart className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No sales orders</EmptyTitle>
              <EmptyDescription>Create a sales order so production can begin.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Create Sales Order</Button>
          </Empty>
        ) : (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o) => (
                    <TableRow key={o.sales_order_id}>
                      <TableCell className="font-medium">
                        {o.sales_order_number ?? o.order_number ?? o.sales_order_id}
                      </TableCell>
                      <TableCell>{o.customer_name ?? data.getCustomer(o.customer_id)?.customer_name ?? o.customer_id}</TableCell>
                      <TableCell>{o.order_date?.slice(0, 10)}</TableCell>
                      <TableCell>
                        <Badge variant={orderStatusColors[o.order_status] ?? "secondary"}>
                          {o.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{(o.total_amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" title="View" onClick={() => openView(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(o)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {(o.order_status === "Draft" || o.order_status === "draft") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Approve"
                            onClick={() => handleApproveFromList(o.sales_order_id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title={`GRNs (${grnsForOrder(o.sales_order_id).length})`} asChild>
                          <Link to="/grn" state={{ salesOrderId: o.sales_order_id }}>
                            <PackageCheck className="h-4 w-4" />
                          </Link>
                        </Button>
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
              {mode === "create" ? "Create Sales Order" : mode === "edit" ? "Edit Order" : "Order Details"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveDraft(e); }}>
            <FormSection title="Order" noSeparator>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sales Order Number</Label>
                    <Input
                      value={mode === "create" ? "(Auto on save)" : (data.getSalesOrder(selectedId ?? "")?.sales_order_number ?? data.getSalesOrder(selectedId ?? "")?.order_number ?? "—")}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      readOnly={isView}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Customer *</Label>
                    <Select value={customerId} onValueChange={setCustomerId} disabled={isView}>
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
                    {selectedCustomer && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.billing_address}
                        {selectedCustomer.email ? ` • ${selectedCustomer.email}` : ""}
                        {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} disabled={isView}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select value={productId} onValueChange={setProductId} disabled={isView}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Measurement Type *</Label>
                    <Select value={measurementType} onValueChange={(v: "carton" | "bag" | "weight") => setMeasurementType(v)} disabled={isView}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEASUREMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={measurementType === "weight" ? "kg" : measurementType}
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
                      placeholder="kg"
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
                      placeholder="kg"
                      readOnly={isView}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order basis</Label>
                    <Select value={orderBasis} onValueChange={(v: "standard" | "vehicle" | "weight") => setOrderBasis(v)} disabled={isView}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_BASIS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {orderBasis === "weight" && (
                    <div className="space-y-2">
                      <Label>Weight type for invoicing</Label>
                      <Select value={weightTypeForInvoicing} onValueChange={(v: "net" | "gross") => setWeightTypeForInvoicing(v)} disabled={isView}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEIGHT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {(measurementType === "carton" || measurementType === "bag") && (
                    <>
                      <div className="space-y-2">
                        <Label>Sticker range start</Label>
                        <Input
                          value={stickerRangeStart}
                          onChange={(e) => setStickerRangeStart(e.target.value)}
                          readOnly={isView}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sticker range end</Label>
                        <Input
                          value={stickerRangeEnd}
                          onChange={(e) => setStickerRangeEnd(e.target.value)}
                          readOnly={isView}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2 col-span-2">
                    <Label>Delivery Date</Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      readOnly={isView}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes"
                      readOnly={isView}
                    />
                  </div>
                </div>
              </div>
            </FormSection>
            {isView && selectedId && (() => {
              const linkedGrns = data.grns.filter((g) => g.sales_order_id === selectedId)
              if (linkedGrns.length === 0) return null
              return (
                <FormSection title="Linked GRNs" noSeparator>
                  <div className="space-y-2 py-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GRN No</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedGrns.map((g) => (
                          <TableRow key={g.grn_id}>
                            <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                            <TableCell>{g.product_name ?? g.category_name ?? "—"}</TableCell>
                            <TableCell>{g.received_quantity ?? "—"} {g.unit ?? ""}</TableCell>
                            <TableCell>{g.status ?? "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to="/grn" state={{ openGrnId: g.grn_id }}>
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </FormSection>
              )
            })()}
            {!isView && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveDraft}>
                  Save as Draft
                </Button>
                <Button type="button" onClick={handleSaveAndApprove}>
                  Save & Approve
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={approveTargetId !== null} onOpenChange={(open) => !open && setApproveTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve order</AlertDialogTitle>
            <AlertDialogDescription>
              Approve this sales order? It will be available for GRN creation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
