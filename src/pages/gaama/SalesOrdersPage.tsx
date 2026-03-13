import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { SalesOrder, SalesOrderItem } from "@/lib/gaama-types"
import { Plus, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ModalMode = "create" | "view" | null

const orderStatusColors: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  confirmed: "outline",
  in_production: "default",
  dispatched: "default",
  invoiced: "default",
  closed: "secondary",
}

export function SalesOrdersPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [_selectedId, setSelectedId] = React.useState<string | null>(null)
  const [customerId, setCustomerId] = React.useState("")
  const [orderDate, setOrderDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = React.useState<SalesOrderItem[]>([])

  const allowed = canAccess(data.currentRole, "sales-orders")
  const orders = data.salesOrders

  const addLine = () => {
    const catId = data.categories[0]?.category_id
    const rate = catId ? data.getRatesByCategory(catId)[0] : undefined
    setItems((prev) => [
      ...prev,
      {
        item_id: `item_${Date.now()}`,
        category_id: catId ?? "",
        quantity: 1,
        rate: rate?.rate_value ?? 0,
        total_price: rate?.rate_value ?? 0,
      },
    ])
  }

  const updateLine = (idx: number, upd: Partial<SalesOrderItem>) => {
    setItems((prev) => {
      const next = [...prev]
      const line = { ...next[idx], ...upd }
      if ("quantity" in upd || "rate" in upd) {
        line.total_price = line.quantity * line.rate
      }
      if ("category_id" in upd) {
        const r = data.getRatesByCategory(upd.category_id!)[0]
        if (r) {
          line.rate = r.rate_value
          line.total_price = line.quantity * r.rate_value
        }
      }
      next[idx] = line
      return next
    })
  }

  const removeLine = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const openCreate = () => {
    setCustomerId(data.customers[0]?.customer_id ?? "")
    setOrderDate(new Date().toISOString().slice(0, 10))
    setItems([])
    addLine()
    setSelectedId(null)
    setMode("create")
  }

  const openView = (o: SalesOrder) => {
    setCustomerId(o.customer_id)
    setOrderDate(o.order_date.slice(0, 10))
    setItems(o.items)
    setSelectedId(o.sales_order_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    const total_amount = items.reduce((s, i) => s + i.total_price, 0)
    const tax_amount = total_amount * 0.18
    data.addSalesOrder({
      customer_id: customerId,
      order_date: new Date(orderDate).toISOString(),
      order_status: "draft",
      items,
      total_amount,
      tax_amount,
      created_by: "current_user",
    })
    setMode(null)
  }

  const isView = mode === "view"

  return (
    <PageShell>
      <PageHeader
        title="Sales Orders"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Order</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : orders.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><ShoppingCart className="size-4" /></EmptyMedia>
              <EmptyTitle>No sales orders</EmptyTitle>
              <EmptyDescription>Create a sales order so production can begin.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Create Order</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.sales_order_id}>
                    <TableCell className="font-medium">{o.sales_order_id}</TableCell>
                    <TableCell>{data.getCustomer(o.customer_id)?.customer_name ?? o.customer_id}</TableCell>
                    <TableCell>{o.order_date.slice(0, 10)}</TableCell>
                    <TableCell><Badge variant={orderStatusColors[o.order_status] ?? "secondary"}>{o.order_status}</Badge></TableCell>
                    <TableCell>₹{o.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(o)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create Sales Order" : "Order Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Order" noSeparator>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={customerId} onValueChange={setCustomerId} disabled={isView}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {data.customers.map((c) => (
                          <SelectItem key={c.customer_id} value={c.customer_id}>{c.customer_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} readOnly={isView} />
                  </div>
                </div>
              </div>
            </FormSection>
            <FormSection title="Items" noSeparator>
              <div className="space-y-2">
                {items.map((line, idx) => (
                  <div key={line.item_id} className="flex gap-2 items-end flex-wrap">
                    <Select
                      value={line.category_id}
                      onValueChange={(v) => updateLine(idx, { category_id: v })}
                      disabled={isView}
                    >
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {data.categories.map((c) => (
                          <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Qty"
                      className="w-20"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })}
                      readOnly={isView}
                    />
                    <Input type="number" placeholder="Rate" className="w-24" value={line.rate} readOnly />
                    <span className="text-sm text-muted-foreground w-20">₹{line.total_price}</span>
                    {!isView && <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)}>Remove</Button>}
                  </div>
                ))}
                {!isView && <Button type="button" variant="outline" size="sm" onClick={addLine}>Add line</Button>}
              </div>
            </FormSection>
            {!isView && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Create Order</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
