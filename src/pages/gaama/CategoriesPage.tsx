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
import { useData, canAccess } from "@/context/DataContext"
import type { Category } from "@/lib/gaama-types"
import { Plus, FolderTree } from "lucide-react"

type ModalMode = "create" | "edit" | "view" | null

export function CategoriesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ category_name: "", description: "" })

  const allowed = canAccess(data.currentRole, "categories")
  const categories = data.categories

  const openCreate = () => {
    setForm({ category_name: "", description: "" })
    setSelectedId(null)
    setMode("create")
  }

  const openEdit = (c: Category) => {
    setForm({ category_name: c.category_name, description: c.description })
    setSelectedId(c.category_id)
    setMode("edit")
  }

  const openView = (c: Category) => {
    setForm({ category_name: c.category_name, description: c.description })
    setSelectedId(c.category_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "create") {
      data.addCategory(form)
      setMode(null)
    } else if (mode === "edit" && selectedId) {
      data.updateCategory(selectedId, form)
      setMode(null)
    }
  }

  const isView = mode === "view"

  return (
    <PageShell>
      <PageHeader
        title="Category Master"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Category</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : categories.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderTree className="size-4" /></EmptyMedia>
              <EmptyTitle>No categories</EmptyTitle>
              <EmptyDescription>Add categories for rate and order items.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Add Category</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.category_id}>
                    <TableCell className="font-medium">{c.category_name}</TableCell>
                    <TableCell>{c.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(c)}>View</Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
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
            <DialogTitle>{mode === "create" ? "Add Category" : mode === "edit" ? "Edit Category" : "Category Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input value={form.category_name} onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))} readOnly={isView} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} readOnly={isView} />
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
