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
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { Category, SubCategory } from "@/lib/gaama-types"
import { Plus, FolderTree, Trash2, Search, LayoutGrid, List, Eye, Pencil } from "lucide-react"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const DOSE_UNITS = ["kGy", "Gy", "Mrad"]
const STATUS_OPTIONS = ["Active", "Inactive"]

type ModalMode = "create" | "edit" | "view" | null

interface SubCategoryForm {
  id: string
  name: string
}

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function CategoriesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    category_name: "",
    description: "",
  })

  // Full-page Add/Edit form state
  const [showForm, setShowForm] = React.useState(false)
  const [formCategoryName, setFormCategoryName] = React.useState("")
  const [formDoseCount, setFormDoseCount] = React.useState<string>("")
  const [formDoseUnit, setFormDoseUnit] = React.useState("kGy")
  const [formStatus, setFormStatus] = React.useState("Active")
  const [formDescription, setFormDescription] = React.useState("")
  const [subcategories, setSubcategories] = React.useState<SubCategoryForm[]>([])
  const [newSubName, setNewSubName] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"table" | "list">("table")
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null)

  const allowed = canAccess(data.currentRole, "categories")
  const categories = data.categories

  const openCreate = () => {
    setFormCategoryName("")
    setFormDoseCount("")
    setFormDoseUnit("kGy")
    setFormStatus("Active")
    setFormDescription("")
    setSubcategories([])
    setNewSubName("")
    setSelectedId(null)
    setShowForm(true)
  }

  const openEdit = (c: Category) => {
    setFormCategoryName(c.category_name)
    setFormDoseCount(String(c.dose_count ?? ""))
    setFormDoseUnit(c.dose_unit ?? "kGy")
    setFormStatus(c.status ?? "Active")
    setFormDescription(c.description ?? "")
    setSubcategories(
      (c.subcategories ?? []).map((s) => ({ id: s.id, name: s.name }))
    )
    setNewSubName("")
    setSelectedId(c.category_id)
    setShowForm(true)
  }

  const openView = (c: Category) => {
    setForm({
      category_name: c.category_name,
      description: c.description ?? "",
    })
    setSelectedId(c.category_id)
    setMode("view")
  }

  const handleAddSubcategory = () => {
    const name = newSubName.trim()
    if (!name) return
    setSubcategories((prev) => [...prev, { id: generateId(), name }])
    setNewSubName("")
  }

  const handleRemoveSubcategory = (id: string) => {
    setSubcategories((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCategoryName.trim()) {
      toast.error("Category Name is required.")
      return
    }
    const doseNum = Number(formDoseCount)
    if (!formDoseCount || isNaN(doseNum) || doseNum < 0) {
      toast.error("Dose Count is required and must be a valid number.")
      return
    }
    if (!formDoseUnit) {
      toast.error("Dose Unit is required.")
      return
    }

    const now = new Date().toISOString()
    const subcategoriesTyped: SubCategory[] = subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      created_at: now,
    }))

    if (selectedId) {
      data.updateCategory(selectedId, {
        category_name: formCategoryName.trim(),
        dose_count: doseNum,
        dose_unit: formDoseUnit,
        status: formStatus,
        description: formDescription.trim() || undefined,
        subcategories: subcategoriesTyped,
        updated_at: now,
      })
    } else {
      data.addCategory({
        category_name: formCategoryName.trim(),
        dose_count: doseNum,
        dose_unit: formDoseUnit,
        status: formStatus,
        description: formDescription.trim() || undefined,
        subcategories: subcategoriesTyped,
        updated_at: now,
      })
    }
    setShowForm(false)
    setSelectedId(null)
    toast.success(selectedId ? "Category updated." : "Category created.")
  }

  const handleCancelForm = () => {
    if (!window.confirm("Discard changes?")) return
    setShowForm(false)
    setSelectedId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "edit" && selectedId) {
      data.updateCategory(selectedId, form)
      setMode(null)
    }
  }

  const isView = mode === "view"
  const filteredCategories = categories.filter(
    (c) =>
      (c.category_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Full-page Add/Edit Category form
  if (showForm && allowed) {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title={selectedId ? "Edit Product Category" : "Add Product Category"}
              noBorder
              backButton={{ onClick: handleCancelForm }}
            />
            <div className="space-y-4 px-6 py-4 h-full">
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 shadow-sm">
            <form onSubmit={handleSaveForm}>
              <FormSection title="Category Details" className="[&>div]:h-fit">
                <div className="space-y-4 py-4">
                  <div className="grid h-fit grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Category Name *</Label>
                      <Input
                        value={formCategoryName}
                        onChange={(e) => setFormCategoryName(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dose Count *</Label>
                      <Input
                        type="number"
                        min={0}
                        value={formDoseCount}
                        onChange={(e) => setFormDoseCount(e.target.value)}
                        placeholder="e.g. 25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dose Unit *</Label>
                      <Select
                        value={formDoseUnit}
                        onValueChange={setFormDoseUnit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOSE_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formStatus} onValueChange={setFormStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Optional description"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Products">
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="Product name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddSubcategory()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddSubcategory}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add product
                    </Button>
                  </div>
                  {subcategories.length > 0 && (
                    <ul className="space-y-2">
                      {subcategories.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span>{s.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSubcategory(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </FormSection>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleCancelForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedId ? "Save" : "Create Category"}
                </Button>
              </div>
            </form>
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
        title="Category Master"
        actions={
          allowed ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">
            You do not have permission to view this module.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative max-w-sm flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="ml-auto flex rounded-md border p-1">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderTree className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No categories</EmptyTitle>
                  <EmptyDescription>
                    Add categories for rate and order items.
                  </EmptyDescription>
                </EmptyHeader>
                <Button onClick={openCreate}>Add Category</Button>
              </Empty>
            ) : viewMode === "table" ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Dose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((c) => (
                      <TableRow key={c.category_id}>
                        <TableCell className="font-medium">
                          {c.category_name}
                        </TableCell>
                        <TableCell>
                          {c.dose_count != null && c.dose_unit
                            ? `${c.dose_count} ${c.dose_unit}`
                            : "—"}
                        </TableCell>
                        <TableCell>{c.status ?? "—"}</TableCell>
                        <TableCell>{c.description ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCategoryToDelete(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((c) => (
                  <div
                    key={c.category_id}
                    className="rounded-lg border bg-card p-4 flex flex-col gap-2"
                  >
                    <div className="font-medium">{c.category_name}</div>
                    <p className="text-sm text-muted-foreground">
                      {c.dose_count != null && c.dose_unit
                        ? `${c.dose_count} ${c.dose_unit}`
                        : "—"}
                      {" · "}
                      {c.status ?? "—"}
                    </p>
                    {c.description ? (
                      <p className="text-sm line-clamp-2">{c.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCategoryToDelete(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{categoryToDelete?.category_name ?? "this category"}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (categoryToDelete) {
                  data.deleteCategory(categoryToDelete.category_id)
                  toast.success("Category deleted.")
                  setCategoryToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "view" ? "Category Details" : "Edit Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    value={form.category_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category_name: e.target.value }))
                    }
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    readOnly={isView}
                  />
                </div>
              </div>
            </FormSection>
            {!isView && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
