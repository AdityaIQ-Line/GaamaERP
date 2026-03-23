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
import type {
  SalesOrder,
  SalesOrderItem,
  Rate,
  PricingType,
  OrderStatus,
} from "@/lib/gaama-types"
import {
  Plus,
  ShoppingCart,
  Search,
  PackageCheck,
  Package,
  Eye,
  Pencil,
  Info,
  Calendar,
  CircleCheck,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Link } from "react-router-dom"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { cn, latestOfDates, sortLatestFirst } from "@/lib/utils"

type ModalMode = "create" | "edit" | "view" | null

/** Carton / bag only — weight-based orders use Order basis → Weight (saved as measurement_type weight). */
const MEASUREMENT_TYPES_DROPDOWN = ["carton", "bag"] as const
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

function salesOrderListQuantity(o: SalesOrder): string {
  if (o.quantity != null && String(o.quantity).trim() !== "") return String(o.quantity)
  if (o.items?.length) {
    const sum = o.items.reduce((acc, it) => acc + (it.quantity ?? 0), 0)
    return sum > 0 ? String(sum) : "—"
  }
  return "—"
}

function salesOrderListUnit(o: SalesOrder): string {
  const u = o.unit?.trim()
  if (u) return MEASUREMENT_LABELS[u] ?? u
  const mt = o.measurement_type?.trim()
  if (mt) return MEASUREMENT_LABELS[mt] ?? mt
  return "—"
}

function parseLooseQuantity(s: string | number | undefined | null): number {
  if (s == null) return 0
  const n = Number(String(s).replace(/,/g, "").trim())
  return Number.isFinite(n) ? n : 0
}
const WEIGHT_TYPE_OPTIONS = [
  { value: "net", label: "Net" },
  { value: "gross", label: "Gross" },
]

/** Pencil gr162 / IQLDS — read-only field row on sales order view page */
function SalesOrderViewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="break-words text-sm font-medium text-foreground">{children ?? "—"}</div>
    </div>
  )
}

/** Prefer customer-specific rate, then generic; newest effective date wins. */
function pickRateForSalesOrder(
  getRatesByCategory: (categoryId: string) => Rate[],
  categoryId: string,
  customerId: string
): Rate | undefined {
  const rates = getRatesByCategory(categoryId)
  if (rates.length === 0) return undefined
  const eff = (r: Rate) =>
    new Date(r.effective_from ?? r.effective_date ?? 0).getTime()
  const sorted = [...rates].sort((a, b) => eff(b) - eff(a))
  const forCustomer = sorted.find((r) => r.customer_id === customerId)
  if (forCustomer) return forCustomer
  const generic = sorted.find((r) => !r.customer_id)
  return generic ?? sorted[0]
}

/** Stored on the order / payload (includes weight when order basis is weight). */
function payloadMeasurementType(
  orderBasis: "standard" | "vehicle" | "weight",
  formMeasurement: "carton" | "bag"
): "carton" | "bag" | "weight" {
  return orderBasis === "weight" ? "weight" : formMeasurement
}

/** Load order into form: dropdown never uses "weight". */
function measurementTypeForForm(stored: string | undefined): "carton" | "bag" {
  return stored === "bag" ? "bag" : "carton"
}

/** Align order basis + measurement with Rate Master pricing type (Pencil / Gaama flow). */
function defaultsFromPricingType(pricing: PricingType | undefined): {
  orderBasis: "standard" | "vehicle" | "weight"
  measurementType: "carton" | "bag"
} {
  switch (pricing) {
    case "By Weight":
      return { orderBasis: "weight", measurementType: "carton" }
    case "By Vehicle":
      return { orderBasis: "vehicle", measurementType: "carton" }
    case "By Bag":
      return { orderBasis: "standard", measurementType: "bag" }
    case "By Carton":
    default:
      return { orderBasis: "standard", measurementType: "carton" }
  }
}

function addDaysToIsoDate(isoDateYmd: string, days: number): string {
  const d = new Date(`${isoDateYmd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const orderStatusColors: Record<string, "default" | "secondary" | "outline"> = {
  Draft: "secondary",
  Approved: "outline",
  approved: "outline",
  draft: "secondary",
  confirmed: "outline",
  in_production: "default",
  dispatched: "default",
  invoiced: "default",
  closed: "secondary",
  Completed: "default",
  Cancelled: "secondary",
}

/**
 * String-only paths for status checks — avoids TS2367 when `OrderStatus` omits runtime values
 * (e.g. older unions without `Approved` / `approved`) or disallows comparing to "".
 */
function orderStatusToComparableString(status: unknown): string {
  if (status === undefined || status === null) return ""
  return String(status).trim()
}

function isSalesOrderApprovedStatus(status: unknown): boolean {
  return orderStatusToComparableString(status).toLowerCase() === "approved"
}

function isSalesOrderDraftStatus(status: unknown): boolean {
  return orderStatusToComparableString(status).toLowerCase() === "draft"
}

export function SalesOrdersPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  /** Pencil 9gQna, LCOkp, ngBRc — list filters */
  const [filterCustomerId, setFilterCustomerId] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")
  const [filterOrderDate, setFilterOrderDate] = React.useState("")

  // Form state (single-product)
  const [orderDate, setOrderDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [deliveryDate, setDeliveryDate] = React.useState("")
  const [customerId, setCustomerId] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [productId, setProductId] = React.useState("")
  const [measurementType, setMeasurementType] = React.useState<"carton" | "bag">("carton")
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

  const allowed = canAccess(data.currentRole, "sales-orders")
  const orders = data.salesOrders
  const categories = data.categories
  const customers = data.customers

  const selectedCategory = categoryId ? data.getCategory(categoryId) : undefined
  const products = selectedCategory?.subcategories ?? []
  const selectedCustomer = customerId ? data.getCustomer(customerId) : undefined

  // When category changes: clear or auto-pick first product from Category Master (create only).
  React.useEffect(() => {
    if (!categoryId) {
      setProductId("")
      return
    }
    const subs = data.getCategory(categoryId)?.subcategories ?? []
    if (!subs.some((s) => s.id === productId)) {
      if (mode === "create" && subs.length > 0) {
        setProductId(subs[0].id)
      } else {
        setProductId("")
      }
    }
  }, [categoryId, data, productId, mode])

  // Create flow: customer + category → Rate Master drives order basis & measurement type.
  React.useEffect(() => {
    if (mode !== "create" || !categoryId) return
    const rate = pickRateForSalesOrder(
      (id) => data.getRatesByCategory(id),
      categoryId,
      customerId
    )
    const { orderBasis: ob, measurementType: mt } = defaultsFromPricingType(rate?.pricing_type)
    setOrderBasis(ob)
    setMeasurementType(mt)
  }, [mode, categoryId, customerId, data.rates])

  const qtyNum = Number(quantity) || 0
  const isStickerType =
    orderBasis !== "weight" && (measurementType === "carton" || measurementType === "bag")

  /** Pencil f7Kvs: ending sticker = start + quantity − 1 (create flow). */
  const computedStickerEnd = React.useMemo(() => {
    if (!isStickerType || qtyNum <= 0) return ""
    const s = parseInt(stickerRangeStart, 10)
    if (Number.isNaN(s)) return ""
    return String(s + qtyNum - 1)
  }, [isStickerType, qtyNum, stickerRangeStart])

  // Create: carton/bag + qty → auto-fill start once (next available); end is always derived from qty (computedStickerEnd).
  React.useEffect(() => {
    if (mode !== "create") return
    if (!isStickerType || qtyNum <= 0) {
      setStickerRangeStart("")
      setStickerRangeEnd("")
      return
    }
    setStickerRangeStart((prev) =>
      prev.trim() === "" ? String(data.getNextStickerNumber()) : prev
    )
  }, [mode, isStickerType, qtyNum, measurementType, data.salesOrders])

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10)
    setOrderDate(today)
    setDeliveryDate(addDaysToIsoDate(today, 14))
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
    setMeasurementType(measurementTypeForForm(o.measurement_type))
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
    setMeasurementType(measurementTypeForForm(o.measurement_type))
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

  const closeOrderForm = React.useCallback(() => {
    setMode(null)
    setSelectedId(null)
  }, [])

  const buildPayload = (status: "Draft" | "Approved" | "preserve") => {
    const existing = selectedId ? data.getSalesOrder(selectedId) : undefined
    const order_status: OrderStatus =
      status === "preserve" && existing
        ? existing.order_status
        : status === "Draft"
          ? "Draft"
          : "Approved"
    const cat = data.getCategory(categoryId)
    const cust = data.getCustomer(customerId)
    const productName = products.find((p) => p.id === productId)?.name ?? ""
    const measurementForPayload = payloadMeasurementType(orderBasis, measurementType)
    const unit =
      measurementForPayload === "weight"
        ? "kg"
        : measurementForPayload === "carton"
          ? "carton"
          : "bag"
    const rate = pickRateForSalesOrder(
      (id) => data.getRatesByCategory(id),
      categoryId,
      customerId
    )
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
      order_status,
      items: [item],
      total_amount: totalAmount,
      tax_amount: totalAmount * 0.18,
      category_id: categoryId,
      category_name: cat?.category_name,
      product_id: productId,
      product_name: productName,
      quantity: String(qty),
      unit,
      measurement_type: measurementForPayload,
      order_basis: orderBasis,
      weight_type_for_invoicing: orderBasis === "weight" ? weightTypeForInvoicing : undefined,
      net_weight: netWeight || undefined,
      gross_weight: grossWeight || undefined,
      sticker_range_start:
        isStickerType && stickerRangeStart.trim() !== "" && !Number.isNaN(Number(stickerRangeStart))
          ? Number(stickerRangeStart)
          : undefined,
      sticker_range_end:
        isStickerType && mode === "create"
          ? computedStickerEnd.trim() !== "" && !Number.isNaN(Number(computedStickerEnd))
            ? Number(computedStickerEnd)
            : undefined
          : stickerRangeEnd.trim() !== "" && !Number.isNaN(Number(stickerRangeEnd))
            ? Number(stickerRangeEnd)
            : undefined,
      is_vehicle_basis: orderBasis === "vehicle",
      notes: notes || undefined,
    }
  }

  const validate = (): string | null => {
    if (!customerId) return "Select a customer."
    if (!orderDate) return "Order date is required."
    if (!categoryId) return "Select a category."
    if (!productId) return "Select a sub category."
    if (!quantity || qtyNum <= 0) return "Quantity must be greater than 0."
    const net = parseFloat(netWeight)
    const gross = parseFloat(grossWeight)
    if (grossWeight && netWeight && !isNaN(gross) && !isNaN(net) && gross < net)
      return "Gross weight must be ≥ net weight."
    if (mode === "create" && isStickerType && qtyNum > 0) {
      if (stickerRangeStart.trim() === "" || Number.isNaN(Number(stickerRangeStart))) {
        return "Sticker range start is required for carton/bag orders."
      }
      if (computedStickerEnd === "" || Number.isNaN(Number(computedStickerEnd))) {
        return "Sticker range end could not be calculated. Check quantity and start number."
      }
    }
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
      closeOrderForm()
      toast.success("Order saved as draft.")
    }
  }

  const handleEditSaveChanges = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    if (mode === "edit" && selectedId) {
      data.updateSalesOrder(selectedId, buildPayload("preserve"))
      closeOrderForm()
      toast.success("Sales order updated.")
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
      closeOrderForm()
      toast.success("Order saved and approved.")
    } else if (mode === "edit" && selectedId) {
      data.updateSalesOrder(selectedId, buildPayload("Approved"))
      closeOrderForm()
      toast.success("Order approved.")
    }
  }

  const handleApproveFromList = (o: SalesOrder) => {
    if (!isSalesOrderDraftStatus(o.order_status)) return
    data.updateSalesOrder(o.sales_order_id, { order_status: "Approved" })
    toast.success("Order approved.")
  }

  const orderStatusOptions = React.useMemo(() => {
    const s = new Set<string>()
    for (const o of orders) {
      const raw = orderStatusToComparableString(o.order_status)
      if (raw.length > 0) s.add(raw)
    }
    return [...s].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [orders])

  React.useEffect(() => {
    if (filterStatus !== "all" && !orderStatusOptions.includes(filterStatus)) {
      setFilterStatus("all")
    }
  }, [filterStatus, orderStatusOptions])

  React.useEffect(() => {
    if (
      filterCustomerId !== "all" &&
      !customers.some((c) => c.customer_id === filterCustomerId)
    ) {
      setFilterCustomerId("all")
    }
  }, [filterCustomerId, customers])

  const filteredOrders = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    const filtered = orders.filter((o) => {
      if (filterCustomerId !== "all" && o.customer_id !== filterCustomerId) return false
      if (filterStatus !== "all" && orderStatusToComparableString(o.order_status) !== filterStatus)
        return false
      if (filterOrderDate) {
        const d = o.order_date?.slice(0, 10) ?? ""
        if (d !== filterOrderDate) return false
      }
      const soNum = o.sales_order_number ?? o.order_number ?? o.sales_order_id
      const custName = customers.find((c) => c.customer_id === o.customer_id)?.customer_name ?? ""
      if (!term) return true
      return (
        (soNum ?? "").toLowerCase().includes(term) ||
        custName.toLowerCase().includes(term) ||
        orderStatusToComparableString(o.order_status).toLowerCase().includes(term)
      )
    })
    return sortLatestFirst(
      filtered,
      (o) => latestOfDates(o.created_at, o.order_date),
      (o) => o.sales_order_id
    )
  }, [
    orders,
    customers,
    filterCustomerId,
    filterStatus,
    filterOrderDate,
    searchTerm,
  ])

  const grnsForOrder = (salesOrderId: string) =>
    data.grns.filter((g) => g.sales_order_id === salesOrderId)

  const previewRateVal = categoryId
    ? pickRateForSalesOrder((id) => data.getRatesByCategory(id), categoryId, customerId)
        ?.rate_value ?? 0
    : 0
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
                    value={data.getNextSalesOrderNumber()}
                    readOnly
                    className="h-9 font-mono text-sm bg-muted/40"
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
                  <Select value={customerId} onValueChange={setCustomerId}>
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
              <div>
                <h2 className="text-lg font-semibold">Order Details</h2>
                {mode === "create" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Measurement type and order basis fill from the matching{" "}
                    <span className="text-foreground font-medium">Rate Master</span> row for the
                    selected customer and category (same logic as value of goods). Sub category defaults to
                    the first item in{" "}
                    <span className="text-foreground font-medium">Category Master</span> when
                    available.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 min-w-0">
                  <Label>
                    Measurement Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={measurementType}
                    onValueChange={(v) => setMeasurementType(v as "carton" | "bag")}
                  >
                    <SelectTrigger className="h-9 bg-muted/60 border-border">
                      <SelectValue placeholder="Select measurement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_TYPES_DROPDOWN.map((t) => (
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
                    className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
                  />
                  {valueOfGoods.trim() === "" && categoryId && (
                    <p className="text-xs text-muted-foreground">
                      From Rate Master: ₹{computedValueOfGoods.toLocaleString("en-IN")} (qty × rate)
                    </p>
                  )}
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>
                    Product Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
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
                    Sub category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={productId} onValueChange={setProductId} disabled={!categoryId}>
                    <SelectTrigger
                      className={`h-9 bg-muted/60 border-border ${!categoryId ? "opacity-50" : ""}`}
                    >
                      <SelectValue placeholder={categoryId ? "Select sub category" : "Select category first"} />
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
                    className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Net weight must be{" "}
                    <span className="font-medium text-foreground" aria-label="less than or equal to">
                      ≤
                    </span>{" "}
                    gross weight.
                  </p>
                </div>
                <div className="space-y-2 min-w-0">
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
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

            {/* Sticker Range — fields: Pencil f7Kvs; summary: Pencil xzzpc */}
            {isStickerType && (
              <div className="rounded-[10px] border border-border bg-card p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Sticker Range</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-8">
                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium text-foreground">Starting sticker number</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={stickerRangeStart}
                      disabled
                      placeholder={qtyNum > 0 ? "Auto-filled" : "Enter quantity first"}
                      className="h-9 rounded-lg border border-input bg-muted/40 opacity-90"
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-filled from the next number after the{" "}
                      <span className="font-medium text-foreground">last used</span> sticker on any sales
                      order. This value cannot be edited.
                    </p>
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium text-foreground">Ending Sticker Number</Label>
                    <Input
                      type="number"
                      disabled
                      value={computedStickerEnd}
                      placeholder="Auto-calculated"
                      className="h-9 rounded-lg border border-input bg-muted/40 opacity-90"
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-calculated:{" "}
                      <span className="font-medium text-foreground">Starting sticker number + Quantity − 1</span>.
                    </p>
                  </div>
                </div>

                {/* Pencil xzzpc — Sticker Range Information */}
                {(() => {
                  const endDisplay = computedStickerEnd
                  const startNum = parseInt(stickerRangeStart, 10)
                  const endNum = parseInt(endDisplay, 10)
                  const hasRange =
                    !Number.isNaN(startNum) &&
                    !Number.isNaN(endNum) &&
                    qtyNum > 0
                  const unitWord = measurementType === "bag" ? "bags" : "cartons"
                  return (
                    <div
                      className="rounded-[10px] border border-primary/25 bg-primary/5 pt-[17px] pr-[17px] pb-2 pl-[17px]"
                      style={{ backgroundColor: "#f0fdfaff" }}
                    >
                      <div className="flex gap-3 items-start">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#009689] text-white"
                          aria-hidden
                        >
                          <Info className="h-4 w-4 stroke-[2.5]" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                          <p className="text-sm font-semibold text-foreground">Sticker Range Information</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {qtyNum > 0 ? (
                              <>
                                Total stickers: {qtyNum} {unitWord}
                              </>
                            ) : (
                              <>Total stickers: — (enter quantity)</>
                            )}
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {hasRange ? (
                              <>
                                Range: {startNum} to {endNum}
                              </>
                            ) : (
                              <>Range: —</>
                            )}
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            These serial numbers will be mapped to this sales order.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!window.confirm("Discard changes?")) return
                  closeOrderForm()
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                Save
              </Button>
              <Button type="button" variant="default" onClick={handleSaveAndApprove}>
                Save & Approve
              </Button>
            </div>
          </div>
  )

  /** Pencil gr162 SalesOrderView — IQLDS: PageShell, scroll body px-6 py-4, cards (see page-layouts.md § IQLine) */
  if (allowed && mode === "view" && selectedId) {
    const viewOrder = data.getSalesOrder(selectedId)
    if (!viewOrder) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <div className="w-full h-full">
              <PageHeaderWithBack
                title="Sales Order"
                noBorder
                backButton={{ onClick: closeOrderForm }}
              />
              <div className="px-6 py-4">
                <p className="text-muted-foreground">Sales order not found.</p>
              </div>
            </div>
          </div>
        </PageShell>
      )
    }
    const viewCust = data.getCustomer(viewOrder.customer_id)
    const viewCat = viewOrder.category_id ? data.getCategory(viewOrder.category_id) : undefined
    const viewSoNum =
      viewOrder.sales_order_number ?? viewOrder.order_number ?? viewOrder.sales_order_id
    const viewLinkedGrns = sortLatestFirst(
      grnsForOrder(selectedId),
      (g) => latestOfDates(g.received_date, g.created_at),
      (g) => g.grn_id
    )
    const viewMt = ((): "carton" | "bag" | "weight" => {
      const mt = viewOrder.measurement_type?.trim()
      if (mt === "carton" || mt === "bag" || mt === "weight") return mt
      const u = viewOrder.unit?.trim().toLowerCase()
      if (u === "kg") return "weight"
      if (u === "bag") return "bag"
      if (u === "carton") return "carton"
      return "carton"
    })()
    const viewStickerType = viewMt === "carton" || viewMt === "bag"
    const viewRate = viewOrder.category_id
      ? pickRateForSalesOrder(
          (id) => data.getRatesByCategory(id),
          viewOrder.category_id,
          viewOrder.customer_id,
        )
      : undefined
    const viewQty =
      viewOrder.quantity ?? (viewOrder.items?.[0]?.quantity != null ? String(viewOrder.items[0].quantity) : "—")
    const viewProductName =
      viewOrder.product_name ??
      viewCat?.subcategories?.find((s) => s.id === viewOrder.product_id)?.name ??
      "—"
    const viewOrderBasisLabel =
      ORDER_BASIS_OPTIONS.find((o) => o.value === (viewOrder.order_basis ?? "standard"))?.label ??
      viewOrder.order_basis ??
      "—"
    const viewWtLabel =
      viewOrder.weight_type_for_invoicing === "gross"
        ? "Gross"
        : viewOrder.weight_type_for_invoicing === "net"
          ? "Net"
          : "—"
    const viewOrderBasisHelp =
      viewOrder.order_basis === "vehicle"
        ? 'Invoice will use "By Vehicle" pricing from Rate Master.'
        : viewOrder.order_basis === "weight"
          ? 'Invoice will use "By Weight" pricing from Rate Master.'
          : 'Invoice will use "By Carton/Bag" pricing from Rate Master.'
    const viewLineItemRate = viewOrder.items?.[0]?.rate
    const viewStickerRangeDisplay =
      viewOrder.sticker_range_start != null && viewOrder.sticker_range_end != null
        ? `${viewOrder.sticker_range_start} to ${viewOrder.sticker_range_end}`
        : viewOrder.sticker_range_start != null
          ? String(viewOrder.sticker_range_start)
          : viewOrder.sticker_range_end != null
            ? String(viewOrder.sticker_range_end)
            : "—"
    const viewLinkedChallans = data.challans.filter((c) => c.sales_order_id === selectedId)
    const orderedQtyNum =
      parseLooseQuantity(viewQty) || viewOrder.items?.[0]?.quantity || 0
    const receivedQtyNum = viewLinkedGrns.reduce((sum, g) => {
      const q = parseLooseQuantity(g.received_quantity)
      if (q > 0) return sum + q
      const fromItems = g.received_items?.reduce((s, ri) => s + ri.quantity_received, 0) ?? 0
      return sum + fromItems
    }, 0)
    const dispatchedQtyNum = viewLinkedChallans.reduce((sum, c) => {
      if (c.status !== "Dispatched" && c.status !== "Delivered") return sum
      const line =
        c.items?.reduce((s, i) => s + i.quantity, 0) ?? parseLooseQuantity(c.quantity)
      return sum + line
    }, 0)
    const remainingReceiveQty = Math.max(0, orderedQtyNum - receivedQtyNum)
    const remainingDispatchQty = Math.max(0, receivedQtyNum - dispatchedQtyNum)
    const fulfillmentPct =
      orderedQtyNum > 0 ? Math.min(100, Math.round((receivedQtyNum / orderedQtyNum) * 100)) : 0
    const qtyUnitLabel =
      viewMt === "weight" ? "kg" : viewMt === "bag" ? "bags" : "cartons"
    const viewStickerTotal =
      viewOrder.sticker_range_start != null && viewOrder.sticker_range_end != null
        ? viewOrder.sticker_range_end - viewOrder.sticker_range_start + 1
        : orderedQtyNum
    const orderDateLong =
      viewOrder.order_date != null && viewOrder.order_date !== ""
        ? new Date(viewOrder.order_date).toLocaleDateString("en-IN", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "—"
    const grossWeightDisplay =
      viewOrder.gross_weight != null && String(viewOrder.gross_weight).trim() !== ""
        ? `${viewOrder.gross_weight} Kg`
        : "—"
    const netWeightDisplay =
      viewOrder.net_weight != null && String(viewOrder.net_weight).trim() !== ""
        ? `${viewOrder.net_weight} Kg`
        : "—"
    const custName =
      viewCust?.customer_name ?? viewOrder.customer_name ?? viewOrder.customer_id
    const custEmail = viewCust?.email ?? "—"
    const custPhone = viewCust?.phone ?? "—"
    const custAddress = viewCust?.billing_address ?? "—"

    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title="Sales Order Details"
              noBorder
              backButton={{ onClick: closeOrderForm }}
              actions={
                <Button type="button" onClick={() => openEdit(viewOrder)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              }
            />
            <div className="space-y-6 px-6 py-4">
              <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border bg-muted/30 px-5 py-3 md:px-6">
                  <Badge
                    className={cn(
                      "border px-3 py-1.5 text-sm font-medium",
                      isSalesOrderApprovedStatus(viewOrder.order_status)
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-secondary-foreground",
                    )}
                  >
                    {viewOrder.order_status}
                  </Badge>
                </div>
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                  {/* Left — order identity, customer, weights */}
                  <div className="space-y-4">
                    <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground"
                        aria-hidden
                      >
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Sales Order Number</p>
                        <p className="font-mono text-base font-semibold text-foreground">{viewSoNum}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground"
                        aria-hidden
                      >
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Sales Order Date</p>
                        <p className="text-base font-semibold text-foreground">{orderDateLong}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground"
                        aria-hidden
                      >
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground">Customer Name</p>
                        <p className="text-base font-semibold text-foreground">{custName}</p>
                        <p className="text-sm text-muted-foreground">{custEmail}</p>
                        <p className="text-sm text-muted-foreground">{custPhone}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-medium text-muted-foreground">Gross Weight</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                        {grossWeightDisplay}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-medium text-muted-foreground">Net Weight</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                        {netWeightDisplay}
                      </p>
                    </div>
                  </div>

                  {/* Center — quantity metrics */}
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">Total Ordered Quantity</p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {orderedQtyNum.toLocaleString("en-IN")} {qtyUnitLabel}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">Total Received Quantity</p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {receivedQtyNum.toLocaleString("en-IN")} {qtyUnitLabel}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">Total Dispatched Quantity</p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {dispatchedQtyNum.toLocaleString("en-IN")} {qtyUnitLabel}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">Remaining Quantity</p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {remainingReceiveQty.toLocaleString("en-IN")} {qtyUnitLabel}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">Remaining Dispatch Quantity</p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {remainingDispatchQty.toLocaleString("en-IN")} {qtyUnitLabel}
                      </p>
                    </div>
                  </div>

                  {/* Right — progress, value, address, sticker */}
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-medium text-muted-foreground">Fulfillment Progress</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{fulfillmentPct}%</p>
                      <p className="text-sm text-muted-foreground">
                        {receivedQtyNum.toLocaleString("en-IN")} of{" "}
                        {orderedQtyNum.toLocaleString("en-IN")}
                      </p>
                      <Progress value={fulfillmentPct} className="mt-3 h-2" />
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-medium text-muted-foreground">Value of Goods</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        ₹{(viewOrder.total_amount ?? 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs font-medium text-muted-foreground">Customer Address</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                        {custAddress}
                      </p>
                    </div>
                    {viewStickerType && (
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs font-medium text-muted-foreground">Sticker Range</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{viewStickerRangeDisplay}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Total: {viewStickerTotal.toLocaleString("en-IN")} stickers
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-muted/30 px-5 py-4 md:px-6">
                  <h2 className="text-base font-semibold text-foreground">Additional order details</h2>
                </div>
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SalesOrderViewField label="Measurement Type">
                      {MEASUREMENT_LABELS[viewMt] ?? viewMt}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Product Category">
                      {viewCat?.category_name ?? viewOrder.category_name ?? "—"}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Sub category">{viewProductName}</SalesOrderViewField>
                    <SalesOrderViewField label="Expected Delivery Date">
                      {viewOrder.delivery_date?.slice(0, 10) ?? "—"}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Rate Master (₹ / unit)">
                      {viewRate?.rate_value != null
                        ? `₹${viewRate.rate_value.toLocaleString("en-IN")}`
                        : "—"}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Pricing type (Rate Master)">
                      {viewRate?.pricing_type ?? "—"}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Line rate (₹ / unit)">
                      {viewLineItemRate != null && !Number.isNaN(viewLineItemRate)
                        ? `₹${viewLineItemRate.toLocaleString("en-IN")}`
                        : "—"}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Tax amount (₹)">
                      {viewOrder.tax_amount != null
                        ? `₹${viewOrder.tax_amount.toLocaleString("en-IN")}`
                        : "—"}
                    </SalesOrderViewField>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <SalesOrderViewField label="Order Basis">{viewOrderBasisLabel}</SalesOrderViewField>
                      <p className="mt-1 text-xs text-primary">{viewOrderBasisHelp}</p>
                    </div>
                    {viewOrder.order_basis === "weight" && (
                      <SalesOrderViewField label="Weight type for invoicing">
                        {viewWtLabel}
                      </SalesOrderViewField>
                    )}
                    <SalesOrderViewField label="Created at">
                      {viewOrder.created_at?.slice(0, 10) ?? "—"}
                    </SalesOrderViewField>
                    <SalesOrderViewField label="Created by">
                      {viewOrder.created_by ?? "—"}
                    </SalesOrderViewField>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-6 py-4">
                  <div>
                    <h2 className="text-base font-semibold">Linked GRNs</h2>
                    <p className="text-sm text-muted-foreground">Goods receipts linked to this order</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {viewLinkedGrns.length} GRN{viewLinkedGrns.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="p-6">
                  {viewLinkedGrns.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <PackageCheck className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-medium text-foreground">No GRN records found</p>
                      <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        Create your first GRN for this sales order
                      </p>
                      <Button className="mt-6" asChild>
                        <Link to="/grn" state={{ salesOrderId: selectedId }}>
                          Go to GRN
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GRN No</TableHead>
                          <TableHead>Sub category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewLinkedGrns.map((g) => (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

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
                  closeOrderForm()
                },
              }}
            />
            <div className="space-y-4 px-6 py-4 h-full">{salesOrderEditorContent}</div>
          </div>
        </div>
      </PageShell>
    )
  }

  /** Pencil 8ypf7 — edit: read-only order info + editable teal card; IQLDS header like create */
  if (allowed && mode === "edit" && selectedId) {
    const editOrder = data.getSalesOrder(selectedId)
    if (!editOrder) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <div className="w-full h-full">
              <PageHeaderWithBack title="Edit Sales Order" noBorder backButton={{ onClick: closeOrderForm }} />
              <div className="px-6 py-4">
                <p className="text-muted-foreground">Sales order not found.</p>
              </div>
            </div>
          </div>
        </PageShell>
      )
    }
    const editSoNum =
      editOrder.sales_order_number ?? editOrder.order_number ?? editOrder.sales_order_id
    const roCategoryName =
      data.getCategory(categoryId)?.category_name ?? editOrder.category_name ?? "—"
    const roProductName =
      products.find((p) => p.id === productId)?.name ?? editOrder.product_name ?? "—"
    const editInputClass =
      "h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
    const editSelectTriggerClass = "h-9 min-w-0 bg-muted/60 border-border"

    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title="Edit Sales Order"
              noBorder
              backButton={{
                onClick: () => {
                  if (!window.confirm("Discard changes?")) return
                  closeOrderForm()
                },
              }}
            />
            <div className="space-y-4 px-6 py-4 h-full">
              <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Sales order</p>
                <p className="font-mono text-lg font-semibold text-foreground">{editSoNum}</p>
              </div>

              <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Order Information (Read-Only)
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Sales Order Number</Label>
                    <Input readOnly value={editSoNum} className="h-9 cursor-not-allowed bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Order Date</Label>
                    <Input readOnly value={orderDate} className="h-9 cursor-not-allowed bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Customer Name</Label>
                    <Input
                      readOnly
                      value={selectedCustomer?.customer_name ?? editOrder.customer_name ?? "—"}
                      className="h-9 cursor-not-allowed bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Product Category</Label>
                    <Input readOnly value={roCategoryName} className="h-9 cursor-not-allowed bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Sub category</Label>
                    <Input readOnly value={roProductName} className="h-9 cursor-not-allowed bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Expected Delivery Date</Label>
                    <Input readOnly type="date" value={deliveryDate} className="h-9 cursor-not-allowed bg-muted/50" />
                  </div>
                </div>
                <div className="mt-6 space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Vehicle basis order
                  </p>
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
                    <Checkbox
                      id="vehicle-basis-ro"
                      checked={orderBasis === "vehicle"}
                      disabled
                      aria-readonly
                    />
                    <span className="text-sm text-foreground">
                      {orderBasis === "vehicle" ? "Yes - Vehicle basis order" : "No - Regular order"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Editable Fields</h2>
                  <Badge variant="secondary" className="w-fit font-normal text-muted-foreground">
                    You can edit these fields only
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Measurement Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={measurementType}
                      onValueChange={(v) => setMeasurementType(v as "carton" | "bag")}
                    >
                      <SelectTrigger className={editSelectTriggerClass}>
                        <SelectValue placeholder="Select measurement type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEASUREMENT_TYPES_DROPDOWN.map((t) => (
                          <SelectItem key={t} value={t}>
                            {MEASUREMENT_LABELS[t] ?? t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className={editInputClass}
                    />
                  </div>
                  <div className="col-span-full grid grid-cols-2 gap-4">
                    <div className="space-y-2 min-w-0">
                      <Label className="text-xs font-medium">
                        Gross Weight (kg) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={grossWeight}
                        onChange={(e) => setGrossWeight(e.target.value)}
                        className={editInputClass}
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label className="text-xs font-medium">
                        Net Weight (kg) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={netWeight}
                        onChange={(e) => setNetWeight(e.target.value)}
                        className={editInputClass}
                      />
                    </div>
                  </div>
                  <div className="col-span-full">
                    <p className="text-xs text-muted-foreground">
                      Net weight must be{" "}
                      <span className="font-medium text-foreground" aria-label="less than or equal to">
                        ≤
                      </span>{" "}
                      gross weight.
                    </p>
                  </div>
                </div>

                {orderBasis === "weight" && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs font-medium">Weight type for invoicing</Label>
                    <Select
                      value={weightTypeForInvoicing}
                      onValueChange={(v: "net" | "gross") => setWeightTypeForInvoicing(v)}
                    >
                      <SelectTrigger className={`${editSelectTriggerClass} max-w-md`}>
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

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!window.confirm("Discard changes?")) return
                    closeOrderForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleEditSaveChanges}>
                  Save Changes
                </Button>
                {isSalesOrderDraftStatus(editOrder.order_status) && (
                  <Button type="button" variant="secondary" onClick={handleSaveAndApprove}>
                    Save & Approve
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
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
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="relative max-w-xs flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or customer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Pencil 9gQna — Filter by Customer */}
              <div className="space-y-1 min-w-[200px] w-full sm:w-[220px]">
                <Label className="text-xs font-medium text-muted-foreground">Filter by Customer</Label>
                <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
                  <SelectTrigger className="h-9 w-full bg-muted/60 border-border">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.customer_id} value={c.customer_id}>
                        {c.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Pencil LCOkp — Filter by Status */}
              <div className="space-y-1 min-w-[200px] w-full sm:w-[200px]">
                <Label className="text-xs font-medium text-muted-foreground">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 w-full bg-muted/60 border-border">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {orderStatusOptions.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Pencil ngBRc — Filter by Date */}
              <div className="space-y-1 min-w-[200px] w-full sm:w-[220px]">
                <Label className="text-xs font-medium text-muted-foreground">Filter by Date</Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={filterOrderDate}
                    onChange={(e) => setFilterOrderDate(e.target.value)}
                    className="h-9 bg-muted/60 border-border pr-10"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[1%] text-right whitespace-nowrap px-2 pl-3 last:pr-3">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((o) => (
                    <TableRow key={o.sales_order_id}>
                      <TableCell className="font-medium">
                        {o.sales_order_number ?? o.order_number ?? o.sales_order_id}
                      </TableCell>
                      <TableCell>{o.order_date?.slice(0, 10)}</TableCell>
                      <TableCell>{o.customer_name ?? data.getCustomer(o.customer_id)?.customer_name ?? o.customer_id}</TableCell>
                      <TableCell>{salesOrderListQuantity(o)}</TableCell>
                      <TableCell>{salesOrderListUnit(o)}</TableCell>
                      <TableCell>
                        <Badge variant={orderStatusColors[o.order_status] ?? "secondary"}>
                          {o.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[1%] text-right whitespace-nowrap px-2 pl-3 last:pr-3">
                        <div className="inline-flex flex-nowrap items-center justify-end gap-0.5">
                          {isSalesOrderDraftStatus(o.order_status) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Approve"
                              onClick={() => handleApproveFromList(o)}
                            >
                              <CircleCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" title="View" onClick={() => openView(o)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(o)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

    </PageShell>
  )
}
