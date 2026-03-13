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
import type { Challan, ChallanItem } from "@/lib/gaama-types"
import { Plus, FileText } from "lucide-react"

type ModalMode = "create" | "view" | null

export function ChallanPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [form, setForm] = React.useState({
    sales_order_id: "",
    dispatch_date: new Date().toISOString().slice(0, 10),
    vehicle_details: "",
    driver_name: "",
    items: [] as ChallanItem[],
  })

  const allowed = canAccess(data.currentRole, "challan")
  const challans = data.challans

  const addLine = () => {
    const catId = data.categories[0]?.category_id
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item_id: `ci_${Date.now()}`, category_id: catId ?? "", quantity: 1 },
      ],
    }))
  }

  const updateLine = (idx: number, upd: Partial<ChallanItem>) => {
    setForm((f) => {
      const next = [...f.items]
      next[idx] = { ...next[idx], ...upd }
      return { ...f, items: next }
    })
  }

  const openCreate = () => {
    setForm({
      sales_order_id: data.salesOrders[0]?.sales_order_id ?? "",
      dispatch_date: new Date().toISOString().slice(0, 10),
      vehicle_details: "",
      driver_name: "",
      items: [],
    })
    addLine()
    setMode("create")
  }

  const openView = (c: Challan) => {
    setForm({
      sales_order_id: c.sales_order_id,
      dispatch_date: c.dispatch_date.slice(0, 10),
      vehicle_details: c.vehicle_details,
      driver_name: c.driver_name,
      items: c.items,
    })
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    data.addChallan({
      ...form,
      dispatch_date: new Date(form.dispatch_date).toISOString(),
    })
    setMode(null)
  }

  return (
    <PageShell>
      <PageHeader
        title="Challan Management"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Challan</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : challans.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><FileText className="size-4" /></EmptyMedia>
              <EmptyTitle>No challans</EmptyTitle>
              <EmptyDescription>Create challans for dispatch.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Create Challan</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan ID</TableHead>
                  <TableHead>Sales Order</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.map((c) => (
                  <TableRow key={c.challan_id}>
                    <TableCell className="font-medium">{c.challan_id}</TableCell>
                    <TableCell>{c.sales_order_id}</TableCell>
                    <TableCell>{c.dispatch_date.slice(0, 10)}</TableCell>
                    <TableCell>{c.vehicle_details}</TableCell>
                    <TableCell>{c.driver_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(c)}>View</Button>
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
            <DialogTitle>{mode === "create" ? "Create Challan" : "Challan Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sales Order</Label>
                    <Select value={form.sales_order_id} onValueChange={(v) => setForm((f) => ({ ...f, sales_order_id: v }))} disabled={mode === "view"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {data.salesOrders.map((o) => (
                          <SelectItem key={o.sales_order_id} value={o.sales_order_id}>{o.sales_order_id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dispatch Date</Label>
                    <Input type="date" value={form.dispatch_date} onChange={(e) => setForm((f) => ({ ...f, dispatch_date: e.target.value }))} readOnly={mode === "view"} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Details</Label>
                  <Input value={form.vehicle_details} onChange={(e) => setForm((f) => ({ ...f, vehicle_details: e.target.value }))} readOnly={mode === "view"} />
                </div>
                <div className="space-y-2">
                  <Label>Driver Name</Label>
                  <Input value={form.driver_name} onChange={(e) => setForm((f) => ({ ...f, driver_name: e.target.value }))} readOnly={mode === "view"} />
                </div>
              </div>
            </FormSection>
            <FormSection title="Items" noSeparator>
              <div className="space-y-2">
                {form.items.map((line, idx) => (
                  <div key={line.item_id} className="flex gap-2 items-end">
                    <Select value={line.category_id} onValueChange={(v) => updateLine(idx, { category_id: v })} disabled={mode === "view"}>
                      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {data.categories.map((c) => (
                          <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-20" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) || 0 })} readOnly={mode === "view"} />
                  </div>
                ))}
                {mode === "create" && <Button type="button" variant="outline" size="sm" onClick={addLine}>Add line</Button>}
              </div>
            </FormSection>
            {mode === "create" && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Create Challan</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
