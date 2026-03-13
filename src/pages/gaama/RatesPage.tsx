import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData, canAccess } from "@/context/DataContext"
import type { Rate } from "@/lib/gaama-types"
import { Plus, IndianRupee } from "lucide-react"

type ModalMode = "create" | "edit" | "view" | null

export function RatesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ category_id: "", rate_value: 0, currency: "INR", effective_date: new Date().toISOString().slice(0, 10) })

  const allowed = canAccess(data.currentRole, "rates")
  const rates = data.rates

  const openCreate = () => {
    setForm({
      category_id: data.categories[0]?.category_id ?? "",
      rate_value: 0,
      currency: "INR",
      effective_date: new Date().toISOString().slice(0, 10),
    })
    setSelectedId(null)
    setMode("create")
  }

  const openEdit = (r: Rate) => {
    setForm({
      category_id: r.category_id,
      rate_value: r.rate_value,
      currency: r.currency,
      effective_date: r.effective_date.slice(0, 10),
    })
    setSelectedId(r.rate_id)
    setMode("edit")
  }

  const openView = (r: Rate) => {
    setForm({
      category_id: r.category_id,
      rate_value: r.rate_value,
      currency: r.currency,
      effective_date: r.effective_date.slice(0, 10),
    })
    setSelectedId(r.rate_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "create") {
      data.addRate({
        ...form,
        rate_value: Number(form.rate_value),
        effective_date: new Date(form.effective_date).toISOString(),
      })
      setMode(null)
    } else if (mode === "edit" && selectedId) {
      data.updateRate(selectedId, {
        ...form,
        rate_value: Number(form.rate_value),
        effective_date: new Date(form.effective_date).toISOString(),
      })
      setMode(null)
    }
  }

  const isView = mode === "view"

  return (
    <PageShell>
      <PageHeader
        title="Rate Master"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Rate</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : rates.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><IndianRupee className="size-4" /></EmptyMedia>
              <EmptyTitle>No rates</EmptyTitle>
              <EmptyDescription>Add rates per category for sales orders.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Add Rate</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.rate_id}>
                    <TableCell>{data.getCategory(r.category_id)?.category_name ?? r.category_id}</TableCell>
                    <TableCell>{r.rate_value}</TableCell>
                    <TableCell>{r.currency}</TableCell>
                    <TableCell>{r.effective_date.slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(r)}>View</Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
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
            <DialogTitle>{mode === "create" ? "Add Rate" : mode === "edit" ? "Edit Rate" : "Rate Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))} disabled={isView}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {data.categories.map((c) => (
                        <SelectItem key={c.category_id} value={c.category_id}>{c.category_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rate Value</Label>
                  <Input type="number" value={form.rate_value || ""} onChange={(e) => setForm((f) => ({ ...f, rate_value: Number(e.target.value) || 0 }))} readOnly={isView} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} readOnly={isView} />
                </div>
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Input type="date" value={form.effective_date} onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))} readOnly={isView} />
                </div>
              </div>
            </FormSection>
            {!isView && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">{mode === "create" ? "Create" : "Save"}</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
