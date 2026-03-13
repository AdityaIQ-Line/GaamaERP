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
import type { Invoice } from "@/lib/gaama-types"
import { Plus, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ModalMode = "create" | "view" | null

export function InvoicesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
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

  const openCreate = () => {
    const order = data.salesOrders[0]
    const amount = order?.total_amount ?? 0
    const tax = order?.tax_amount ?? amount * 0.18
    setForm({
      sales_order_id: order?.sales_order_id ?? "",
      invoice_date: new Date().toISOString().slice(0, 10),
      amount,
      tax,
      grand_total: amount + tax,
      payment_status: "pending",
    })
    setMode("create")
  }

  const openView = (i: Invoice) => {
    setForm({
      sales_order_id: i.sales_order_id,
      invoice_date: i.invoice_date.slice(0, 10),
      amount: i.amount,
      tax: i.tax,
      grand_total: i.grand_total,
      payment_status: i.payment_status,
    })
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    data.addInvoice({
      ...form,
      invoice_date: new Date(form.invoice_date).toISOString(),
    })
    setMode(null)
  }

  const recalcFromOrder = (orderId: string) => {
    const order = data.getSalesOrder(orderId)
    if (!order) return
    const amount = order.total_amount
    const tax = order.tax_amount
    setForm((f) => ({ ...f, sales_order_id: orderId, amount, tax, grand_total: amount + tax }))
  }

  return (
    <PageShell>
      <PageHeader
        title="Invoice Management"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Generate Invoice</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : invoices.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Receipt className="size-4" /></EmptyMedia>
              <EmptyTitle>No invoices</EmptyTitle>
              <EmptyDescription>Generate invoices so billing can occur.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Generate Invoice</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Sales Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => (
                  <TableRow key={i.invoice_id}>
                    <TableCell className="font-medium">{i.invoice_id}</TableCell>
                    <TableCell>{i.sales_order_id}</TableCell>
                    <TableCell>{i.invoice_date.slice(0, 10)}</TableCell>
                    <TableCell>₹{i.grand_total.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{i.payment_status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(i)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Generate Invoice" : "Invoice Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Sales Order</Label>
                  <Select
                    value={form.sales_order_id}
                    onValueChange={(v) => { setForm((f) => ({ ...f, sales_order_id: v })); recalcFromOrder(v); }}
                    disabled={mode === "view"}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.salesOrders.map((o) => (
                        <SelectItem key={o.sales_order_id} value={o.sales_order_id}>{o.sales_order_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input type="date" value={form.invoice_date} onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))} readOnly={mode === "view"} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input type="number" value={form.amount || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax</Label>
                    <Input type="number" value={form.tax || ""} readOnly />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Grand Total</Label>
                  <Input type="number" value={form.grand_total || ""} readOnly />
                </div>
                {mode === "view" ? (
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Badge variant="secondary">{form.payment_status}</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={form.payment_status} onValueChange={(v: Invoice["payment_status"]) => setForm((f) => ({ ...f, payment_status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </FormSection>
            {mode === "create" && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Generate Invoice</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
