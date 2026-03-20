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
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

type ModalMode = "create" | "edit" | "view" | null

const MEASUREMENT_TYPES = ["carton", "bag", "weight"]
const ORDER_BASIS_OPTIONS = [
  { value: "standard", label: "Standard (Carton/Bag)" },
  { value: "vehicle", label: "Vehicle" },
  { value: "weight", label: "Weight" },
]
const MEASUREMENT_LABELS: Record<string, string> = {
  carton: "Carton",
  bag: "Bag",
  weight: "Weight",
}
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
  /** Empty = use qty × rate from Rate Master on save (Pencil: Value of Goods). */
  const [valueOfGoods, setValueOfGoods] = React.useState("")
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
    setValueOfGoods("")
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
    setValueOfGoods(o.total_amount != null ? String(o.total_amount) : "")
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
    setValueOfGoods(o.total_amount != null ? String(o.total_amount) : "")
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
    const computedTotal = qty * rateVal
    const parsedGoods = valueOfGoods.trim() === "" ? NaN : Number(valueOfGoods)
    const totalAmount =
      !isNaN(parsedGoods) && parsedGoods >= 0 ? parsedGoods : computedTotal
    const lineRate = qty > 0 ? totalAmount / qty : rateVal
    const item: SalesOrderItem = {
      item_id: `item_${Date.now()}`,
      category_id: categoryId,
      quantity: qty,
      rate: lineRate,
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

  const handleSaveDraft = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
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

  const handleSaveAndApprove = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
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

  const previewRateVal = categoryId ? data.getRatesByCategory(categoryId)[0]?.rate_value ?? 0 : 0
  const computedValueOfGoods = (qtyNum || 0) * previewRateVal

  const orderBasisHelp =
    orderBasis === "vehicle"
      ? 'Invoice will use "By Vehicle" pricing from Rate Master.'
      : orderBasis === "weight"
        ? 'Invoice will use "By Weight" pricing from Rate Master.'
        : 'Invoice will use "By Carton/Bag" pricing from Rate Master.'

  const salesOrderEditorContent = (
    <div className="space-y-6">
            {/* Pencil oCP5D — top card: SO number + date */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sales Order Number</Label>
                  <Input
                    value={
                      mode === "create"
                        ? "(Auto on save)"
                        : data.getSalesOrder(selectedId ?? "")?.sales_order_number ??
                          data.getSalesOrder(selectedId ?? "")?.order_number ??
                          "—"
                    }
                    readOnly
                    className="h-9 font-mono text-sm bg-muted/40 opacity-90"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    readOnly={isView}
                    className="h-9 bg-muted/60 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Customer Field Details */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Customer Field Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 min-w-0">
                  <Label>
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Select value={customerId} onValueChange={setCustomerId} disabled={isView}>
                    <SelectTrigger className="h-9 min-w-0 bg-muted/60 border-border">
                      <SelectValue placeholder="Search and select customer" />
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
                <div className="space-y-2 min-w-0">
                  <Label>Customer Address</Label>
                  <Input
                    value={selectedCustomer?.billing_address ?? ""}
                    readOnly
                    placeholder="—"
                    className="h-9 min-w-0 bg-muted/60 border-border"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Customer Email</Label>
                  <Input
                    value={selectedCustomer?.email ?? ""}
                    readOnly
                    placeholder="—"
                    className="h-9 min-w-0 bg-muted/60 border-border"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Customer Phone</Label>
                  <Input
                    value={selectedCustomer?.phone ?? ""}
                    readOnly
                    placeholder="—"
                    className="h-9 bg-muted/60 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 min-w-0">
                  <Label>
                    Measurement Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={measurementType}
                    onValueChange={(v: "carton" | "bag" | "weight") => setMeasurementType(v)}
                    disabled={isView}
                  >
                    <SelectTrigger className="h-9 bg-muted/60 border-border">
                      <SelectValue placeholder="Select measurement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {MEASUREMENT_LABELS[t] ?? t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={measurementType ? "Enter quantity" : "Select measurement type first"}
                    readOnly={isView}
                    className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2 min-w-0">
                  <Label>Value of Goods (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={valueOfGoods}
                    onChange={(e) => setValueOfGoods(e.target.value)}
                    placeholder="Enter value of goods"
                    readOnly={isView}
                    className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
                  />
                  {!isView && valueOfGoods.trim() === "" && categoryId && (
                    <p className="text-xs text-muted-foreground">
                      From Rate Master: ₹{computedValueOfGoods.toLocaleString("en-IN")} (qty × rate)
                    </p>
                  )}
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>
                    Product Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isView}>
                    <SelectTrigger className="h-9 bg-muted/60 border-border">
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
                  <p className="text-xs text-primary">From Category Master</p>
                </div>

                <div className="space-y-2 min-w-0">
                  <Label>
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Select value={productId} onValueChange={setProductId} disabled={isView || !categoryId}>
                    <SelectTrigger
                      className={`h-9 bg-muted/60 border-border ${!categoryId ? "opacity-50" : ""}`}
                    >
                      <SelectValue placeholder={categoryId ? "Select product" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-primary">From Category Master</p>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>
                    Gross Weight (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    placeholder="Enter gross weight"
                    readOnly={isView}
                    className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2 min-w-0">
                  <Label>
                    Net Weight (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={netWeight}
                    onChange={(e) => setNetWeight(e.target.value)}
                    placeholder="Enter net weight"
                    readOnly={isView}
                    className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    readOnly={isView}
                    className="h-9 bg-muted/60 border-border"
                  />
                </div>

                <div className="space-y-2 min-w-0 sm:col-span-2 lg:col-span-2">
                  <Label>
                    Order Basis <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={orderBasis}
                    onValueChange={(v: "standard" | "vehicle" | "weight") => setOrderBasis(v)}
                    disabled={isView}
                  >
                    <SelectTrigger className="h-9 w-full bg-muted/60 border-border">
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
                  <p className="text-xs text-primary">{orderBasisHelp}</p>
                </div>

                {orderBasis === "weight" && (
                  <div className="space-y-2 min-w-0 sm:col-span-2 lg:col-span-2">
                    <Label>Weight type for invoicing</Label>
                    <Select
                      value={weightTypeForInvoicing}
                      onValueChange={(v: "net" | "gross") => setWeightTypeForInvoicing(v)}
                      disabled={isView}
                    >
                      <SelectTrigger className="h-9 w-full bg-muted/60 border-border">
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

              </div>
            </div>

            {isView && selectedId && (() => {
              const linkedGrns = data.grns.filter((g) => g.sales_order_id === selectedId)
              if (linkedGrns.length === 0) return null
              return (
                <div className="rounded-lg border border-border bg-card p-6">
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
                              <TableCell>
                                {g.received_quantity ?? "—"} {g.unit ?? ""}
                              </TableCell>
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
                </div>
              )
            })()}

            {isView ? (
              <DialogFooter className="border-t border-border pt-6 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setMode(null)}>
                  Close
                </Button>
              </DialogFooter>
            ) : (
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  if (!window.confirm("Discard changes?")) return
                  setMode(null)
                }}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveDraft}>
                  Save
                </Button>
                <Button type="button" variant="default" onClick={handleSaveAndApprove}>
                  Save & Approve
                </Button>
              </div>
            )}
          </div>
  )

  if (allowed && mode === "create") {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title="Create Sales Order"
              noBorder
              backButton={{
                onClick: () => {
                  if (!window.confirm("Discard changes?")) return
                  setMode(null)
                },
              }}
            />
            <div className="space-y-4 px-6 py-4 h-full">{salesOrderEditorContent}</div>
          </div>
        </div>
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative max-w-xs flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or customer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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

      <Dialog open={mode === "edit" || mode === "view"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] gap-0 overflow-y-auto border-border p-6 sm:p-6">
          <DialogHeader className="space-y-0 pb-6 text-left">
            <DialogTitle className="text-lg font-semibold">
              {mode === "edit" ? "Edit Sales Order" : "Order Details"}
            </DialogTitle>
          </DialogHeader>
          {salesOrderEditorContent}
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
