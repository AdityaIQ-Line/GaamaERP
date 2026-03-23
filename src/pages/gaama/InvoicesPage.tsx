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
import type { Invoice, Challan } from "@/lib/gaama-types"
import { Receipt, Search, Printer, Download, Eye, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"
import { latestOfDates, sortLatestFirst } from "@/lib/utils"

type Tab = "pending" | "invoices"
type ModalMode = "create" | "edit" | "view" | null

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
  const [createAmount, setCreateAmount] = React.useState("")
  const [createGstPct, setCreateGstPct] = React.useState("18")
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
    const so = data.getSalesOrder(soId)
    const rate = so?.category_id ? data.getRatesByCategory(so.category_id)[0] : undefined
    const base = parseFloat(challan.total_amount ?? "0") || (rate?.rate_value ?? 0) * (parseFloat(challan.quantity ?? "0") || 0)
    const gstPct = parseFloat(challan.gst_percentage ?? "18")
    const tax = (base * gstPct) / 100
    setCreateChallanId(challan.challan_id)
    setCreateAmount(String(base))
    setCreateGstPct(String(gstPct))
    setForm({
      sales_order_id: soId,
      invoice_date: new Date().toISOString().slice(0, 10),
      amount: base,
      tax,
      grand_total: base + tax,
      payment_status: "pending",
    })
    setMode("create")
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base = parseFloat(createAmount) || 0
    const gstPct = parseFloat(createGstPct) || 0
    const tax = (base * gstPct) / 100
    const challan = data.getChallan(createChallanId)
    const so = data.getSalesOrder(form.sales_order_id)
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
      quantity: so?.quantity,
      unit: so?.unit,
      invoice_date: new Date(form.invoice_date).toISOString(),
      amount: base,
      tax,
      grand_total: base + tax,
      payment_status: "pending",
      status: "Generated",
      base_amount: String(base),
      gst_percentage: String(gstPct),
      total_amount: String(base + tax),
    })
    toast.success("Invoice created.")
    setMode(null)
    setTab("invoices")
  }

  const openView = (i: Invoice) => {
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
    setMode(null)
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

  const invoiceCreateForm = (
    <div className="rounded-lg border border-border bg-card p-6">
      <form onSubmit={handleCreateSubmit}>
        <FormSection title="Details" noSeparator>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sales Order</Label>
              <Input value={form.sales_order_id} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input type="date" value={form.invoice_date} onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Base Amount</Label>
              <Input type="number" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GST %</Label>
              <Input type="number" value={createGstPct} onChange={(e) => setCreateGstPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tax</Label>
              <Input value={((parseFloat(createAmount) || 0) * (parseFloat(createGstPct) || 0)) / 100} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Grand Total</Label>
              <Input
                value={(parseFloat(createAmount) || 0) + ((parseFloat(createAmount) || 0) * (parseFloat(createGstPct) || 0)) / 100}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        </FormSection>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => {
            if (!window.confirm("Discard changes?")) return
            setMode(null)
          }}>
            Cancel
          </Button>
          <Button type="submit">Create Invoice</Button>
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
                          <TableHead className="text-right">Action</TableHead>
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
                                  <Button variant="ghost" size="sm" title="Print" onClick={() => { openView(i); setTimeout(() => window.print(), 300); }}><Printer className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" title="Export" onClick={() => { openView(i); toast.info("Use Print in the dialog to save as PDF."); }}><Download className="h-4 w-4" /></Button>
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

      <Dialog open={mode === "view" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "view" ? "Invoice Details" : "Edit Invoice"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Sales Order</Label>
                <Input value={form.sales_order_id} readOnly className="bg-muted" />
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
              {mode === "edit" && (
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
              {mode === "view" && (
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Badge variant="secondary">{form.payment_status}</Badge>
                </div>
              )}
            </div>
            {mode === "edit" && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            )}
            {mode === "view" && (
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
