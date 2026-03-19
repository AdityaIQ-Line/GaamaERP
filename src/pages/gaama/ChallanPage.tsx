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
import { FileText, Plus, Search, Printer, Download, Eye, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type Tab = "pending" | "delivery"
type ModalMode = "create" | "edit" | "view" | null

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
  const [createBaseAmount, setCreateBaseAmount] = React.useState("")
  const [createGstPercentage, setCreateGstPercentage] = React.useState("18")

  const [editForm, setEditForm] = React.useState<Partial<Challan>>({})

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

  const pendingGrns = React.useMemo(
    () => grns.filter((g) => g.status === "Completed" && !grnIdsInChallans.has(g.grn_id)),
    [grns, grnIdsInChallans]
  )

  const toggleGrnSelection = (grnId: string) => {
    setSelectedGrnIds((prev) => {
      const next = new Set(prev)
      if (next.has(grnId)) next.delete(grnId)
      else next.add(grnId)
      return next
    })
  }

  const openCreateFromGrns = (grnIds: string[]) => {
    setSelectedGrnIds(new Set(grnIds))
    setCreateShippingAddress("")
    setCreateDispatchDate(new Date().toISOString().slice(0, 10))
    setCreateVehicleDetails("")
    setCreateDriverName("")
    setCreateBaseAmount("")
    setCreateGstPercentage("18")
    setMode("create")
  }

  const selectedGrnList = Array.from(selectedGrnIds)
  const firstGrn = selectedGrnList.length > 0 ? data.getGRN(selectedGrnList[0]) : undefined
  const customerForAddress = firstGrn?.customer_id ? data.getCustomer(firstGrn.customer_id) : undefined
  const shippingOptions = customerForAddress?.shipping_addresses_typed?.length
    ? customerForAddress.shipping_addresses_typed.map((a) => a.address)
    : customerForAddress?.billing_address
      ? [customerForAddress.billing_address]
      : []

  const handleGenerateChallan = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGrnList.length === 0) {
      toast.error("Select at least one GRN.")
      return
    }
    if (!createShippingAddress.trim()) {
      toast.error("Select or enter shipping address.")
      return
    }
    const grnList = selectedGrnList.map((id) => data.getGRN(id)).filter(Boolean) as GRN[]
    const soId = grnList[0]?.sales_order_id ?? ""
    const so = data.getSalesOrder(soId)
    const items: ChallanItem[] = grnList.map((g) => ({
      item_id: `ci_${g.grn_id}`,
      category_id: g.category_id ?? "",
      quantity: parseFloat(g.received_quantity ?? "0") || 0,
    }))
    const base = parseFloat(createBaseAmount) || 0
    const gstPct = parseFloat(createGstPercentage) || 0
    const gstAmt = (base * gstPct) / 100
    const total = base + gstAmt
    data.addChallan({
      sales_order_id: soId,
      sales_order_number: so?.sales_order_number ?? so?.order_number,
      grn_numbers: grnList.map((g) => g.grn_number ?? g.grn_id).join(", "),
      customer_id: grnList[0]?.customer_id,
      customer_name: grnList[0]?.customer_name,
      product_category: grnList[0]?.category_name,
      quantity: String(grnList.reduce((s, g) => s + (parseFloat(g.received_quantity ?? "0") || 0), 0)),
      units: grnList[0]?.unit,
      dispatch_date: new Date(createDispatchDate).toISOString(),
      items,
      shipping_address: createShippingAddress,
      status: "Generated",
      vehicle_details: createVehicleDetails,
      driver_name: createDriverName,
      base_amount: createBaseAmount || undefined,
      gst_percentage: createGstPercentage || undefined,
      gst_amount: String(gstAmt.toFixed(2)),
      total_amount: String(total.toFixed(2)),
    })
    toast.success("Challan generated.")
    setMode(null)
    setSelectedGrnIds(new Set())
    setTab("delivery")
  }

  const openView = (c: Challan) => {
    setSelectedChallanId(c.challan_id)
    setEditForm(c)
    setMode("view")
  }

  const openEdit = (c: Challan) => {
    setSelectedChallanId(c.challan_id)
    setEditForm({ ...c })
    setMode("edit")
  }

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChallanId) return
    data.updateChallan(selectedChallanId, editForm)
    toast.success("Challan updated.")
    setMode(null)
  }

  const filteredChallans = challans.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      (c.challan_number ?? c.challan_id).toLowerCase().includes(term) ||
      (c.customer_name ?? "").toLowerCase().includes(term) ||
      (c.grn_numbers ?? "").toLowerCase().includes(term)
    )
  })

  return (
    <PageShell>
      <PageHeader title="Challan Management" />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : (
          <>
            <div className="flex gap-2 border-b">
              <Button
                variant={tab === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab("pending")}
              >
                Pending ({pendingGrns.length})
              </Button>
              <Button
                variant={tab === "delivery" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab("delivery")}
              >
                Delivery ({challans.length})
              </Button>
            </div>

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
                          <TableHead className="w-10">Select</TableHead>
                          <TableHead>GRN No</TableHead>
                          <TableHead>Sales Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingGrns.map((g) => (
                          <TableRow key={g.grn_id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedGrnIds.has(g.grn_id)}
                                onChange={() => toggleGrnSelection(g.grn_id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                            <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                            <TableCell>{g.customer_name ?? "—"}</TableCell>
                            <TableCell>{g.product_name ?? g.category_name ?? "—"}</TableCell>
                            <TableCell>{g.received_quantity ?? "—"} {g.unit ?? ""}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openCreateFromGrns([g.grn_id])}>
                                Create Challan
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-2 border-t">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={selectedGrnIds.size === 0}
                        onClick={() => openCreateFromGrns(Array.from(selectedGrnIds))}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Challan from selected ({selectedGrnIds.size})
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "delivery" && (
              <>
                <div className="flex gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search challans"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportChallansToCsv(
                        filteredChallans.map((c) => ({
                          "Challan No": c.challan_number ?? c.challan_id,
                          Customer: c.customer_name ?? "",
                          "GRN Numbers": c.grn_numbers ?? "",
                          "Dispatch Date": c.dispatch_date?.slice(0, 10) ?? "",
                          Status: c.status ?? "",
                          "Total Amount": c.total_amount ?? "",
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
                </div>
                {filteredChallans.length === 0 ? (
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
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Challan No</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>GRN Numbers</TableHead>
                          <TableHead>Dispatch Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredChallans.map((c) => (
                          <TableRow key={c.challan_id}>
                            <TableCell className="font-medium">{c.challan_number ?? c.challan_id}</TableCell>
                            <TableCell>{c.customer_name ?? "—"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{c.grn_numbers ?? "—"}</TableCell>
                            <TableCell>{c.dispatch_date?.slice(0, 10) ?? "—"}</TableCell>
                            <TableCell><Badge variant="secondary">{c.status ?? "—"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" title="Print" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
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

      <Dialog open={mode === "create"} onOpenChange={(open) => !open && (setMode(null), setSelectedGrnIds(new Set()))}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Challan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerateChallan}>
            <FormSection title="Selected GRNs" noSeparator>
              <p className="text-sm text-muted-foreground">
                {selectedGrnList.length} GRN(s) selected.
              </p>
            </FormSection>
            <FormSection title="Shipping & Dispatch" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Shipping Address *</Label>
                  {shippingOptions.length > 0 ? (
                    <Select value={createShippingAddress} onValueChange={setCreateShippingAddress}>
                      <SelectTrigger>
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
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dispatch Date</Label>
                    <Input
                      type="date"
                      value={createDispatchDate}
                      onChange={(e) => setCreateDispatchDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Details</Label>
                    <Input value={createVehicleDetails} onChange={(e) => setCreateVehicleDetails(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver Name</Label>
                    <Input value={createDriverName} onChange={(e) => setCreateDriverName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Amount</Label>
                    <Input type="number" step="any" value={createBaseAmount} onChange={(e) => setCreateBaseAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>GST %</Label>
                    <Input type="number" value={createGstPercentage} onChange={(e) => setCreateGstPercentage(e.target.value)} />
                  </div>
                </div>
              </div>
            </FormSection>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
              <Button type="submit">Generate Challan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "view" || mode === "edit"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "view" ? "Challan Details" : "Edit Challan"}</DialogTitle>
          </DialogHeader>
          {mode === "view" && selectedChallanId && (() => {
            const c = data.getChallan(selectedChallanId)
            if (!c) return null
            return (
              <div className="space-y-4 py-4">
                <p><strong>Challan No:</strong> {c.challan_number ?? c.challan_id}</p>
                <p><strong>Customer:</strong> {c.customer_name ?? "—"}</p>
                <p><strong>GRN Numbers:</strong> {c.grn_numbers ?? "—"}</p>
                <p><strong>Dispatch Date:</strong> {c.dispatch_date?.slice(0, 10) ?? "—"}</p>
                <p><strong>Status:</strong> <Badge variant="secondary">{c.status ?? "—"}</Badge></p>
                <p><strong>Shipping Address:</strong> {c.shipping_address ?? "—"}</p>
                <p><strong>Total Amount:</strong> {c.total_amount ?? "—"}</p>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
                </div>
              </div>
            )
          })()}
          {mode === "edit" && (
            <form onSubmit={handleEditSave}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status ?? ""}
                    onValueChange={(v: "Generated" | "Dispatched" | "Delivered") => setEditForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Generated">Generated</SelectItem>
                      <SelectItem value="Dispatched">Dispatched</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Textarea
                    value={editForm.shipping_address ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, shipping_address: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
