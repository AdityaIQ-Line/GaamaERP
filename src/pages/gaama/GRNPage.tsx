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
import type { GRN, ReceivedItem } from "@/lib/gaama-types"
import { Plus, PackageCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ModalMode = "create" | "view" | null

export function GRNPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [form, setForm] = React.useState<{
    supplier: string
    purchase_order: string
    received_date: string
    warehouse_location: string
    status: GRN["status"]
    received_items: ReceivedItem[]
  }>({
    supplier: "",
    purchase_order: "",
    received_date: new Date().toISOString().slice(0, 10),
    warehouse_location: "",
    status: "pending",
    received_items: [],
  })

  const allowed = canAccess(data.currentRole, "grn")
  const grns = data.grns

  const addLine = () => {
    const catId = data.categories[0]?.category_id
    setForm((f) => ({
      ...f,
      received_items: [
        ...f.received_items,
        {
          item_id: `ri_${Date.now()}`,
          category_id: catId ?? "",
          quantity_received: 1,
          condition: "good",
        },
      ],
    }))
  }

  const updateLine = (idx: number, upd: Partial<ReceivedItem>) => {
    setForm((f) => {
      const next = [...f.received_items]
      next[idx] = { ...next[idx], ...upd }
      return { ...f, received_items: next }
    })
  }

  const openCreate = () => {
    setForm({
      supplier: "",
      purchase_order: "",
      received_date: new Date().toISOString().slice(0, 10),
      warehouse_location: "",
      status: "pending",
      received_items: [],
    })
    addLine()
    setMode("create")
  }

  const openView = (g: GRN) => {
    setForm({
      supplier: g.supplier,
      purchase_order: g.purchase_order,
      received_date: g.received_date.slice(0, 10),
      warehouse_location: g.warehouse_location,
      status: g.status,
      received_items: g.received_items,
    })
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    data.addGRN({
      ...form,
      received_date: new Date(form.received_date).toISOString(),
    })
    setMode(null)
  }

  return (
    <PageShell>
      <PageHeader
        title="GRN (Goods Receipt Note)"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Record GRN</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : grns.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><PackageCheck className="size-4" /></EmptyMedia>
              <EmptyTitle>No GRN records</EmptyTitle>
              <EmptyDescription>Record received goods so inventory updates correctly.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Record GRN</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((g) => (
                  <TableRow key={g.grn_id}>
                    <TableCell className="font-medium">{g.grn_id}</TableCell>
                    <TableCell>{g.supplier}</TableCell>
                    <TableCell>{g.purchase_order}</TableCell>
                    <TableCell>{g.received_date.slice(0, 10)}</TableCell>
                    <TableCell>{g.warehouse_location}</TableCell>
                    <TableCell><Badge variant="secondary">{g.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(g)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Record GRN" : "GRN Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} readOnly={mode === "view"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Order</Label>
                    <Input value={form.purchase_order} onChange={(e) => setForm((f) => ({ ...f, purchase_order: e.target.value }))} readOnly={mode === "view"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Received Date</Label>
                    <Input type="date" value={form.received_date} onChange={(e) => setForm((f) => ({ ...f, received_date: e.target.value }))} readOnly={mode === "view"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Warehouse Location</Label>
                    <Input value={form.warehouse_location} onChange={(e) => setForm((f) => ({ ...f, warehouse_location: e.target.value }))} readOnly={mode === "view"} />
                  </div>
                </div>
              </div>
            </FormSection>
            <FormSection title="Received Items" noSeparator>
              <div className="space-y-2">
                {form.received_items.map((line, idx) => (
                  <div key={line.item_id} className="flex gap-2 items-end flex-wrap">
                    <Select
                      value={line.category_id}
                      onValueChange={(v) => updateLine(idx, { category_id: v })}
                      disabled={mode === "view"}
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
                      value={line.quantity_received}
                      onChange={(e) => updateLine(idx, { quantity_received: Number(e.target.value) || 0 })}
                      readOnly={mode === "view"}
                    />
                    <Select
                      value={line.condition}
                      onValueChange={(v: "good" | "damaged" | "short") => updateLine(idx, { condition: v })}
                      disabled={mode === "view"}
                    >
                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {mode === "create" && <Button type="button" variant="outline" size="sm" onClick={addLine}>Add line</Button>}
              </div>
            </FormSection>
            {mode === "create" && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Save GRN</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
