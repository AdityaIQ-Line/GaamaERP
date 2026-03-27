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
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
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
import { Plus, FolderTree, Trash2, Search, Pencil, Eye } from "lucide-react"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { latestOfDates, sortLatestFirst } from "@/lib/utils"

/** Dose unit is fixed for all categories (not user-selectable). */
const FIXED_DOSE_UNIT = "kGy"
const STATUS_OPTIONS = ["Active", "Inactive"]

interface SubCategoryForm {
  id: string
  name: string
}

type FormMode = "create" | "edit" | "view" | null

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function CategoriesPage() {
  const data = useData()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Full-page Create / Edit / View state
  const [formMode, setFormMode] = React.useState<FormMode>(null)
  const [formCategoryName, setFormCategoryName] = React.useState("")
  const [formDoseCount, setFormDoseCount] = React.useState<string>("")
  const [formStatus, setFormStatus] = React.useState("Active")
  const [formDescription, setFormDescription] = React.useState("")
  const [subcategories, setSubcategories] = React.useState<SubCategoryForm[]>([])
  const [newSubName, setNewSubName] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")

  const allowed = canAccess(data.currentRole, "categories")
  const categories = data.categories

  const openCreate = () => {
    setFormCategoryName("")
    setFormDoseCount("")
    setFormStatus("Active")
    setFormDescription("")
    setSubcategories([])
    setNewSubName("")
    setSelectedId(null)
    setFormMode("create")
  }

  const openEdit = (c: Category) => {
    setFormCategoryName(c.category_name)
    setFormDoseCount(String(c.dose_count ?? ""))
    setFormStatus(c.status ?? "Active")
    setFormDescription(c.description ?? "")
    setSubcategories(
      (c.subcategories ?? []).map((s) => ({ id: s.id, name: s.name }))
    )
    setNewSubName("")
    setSelectedId(c.category_id)
    setFormMode("edit")
  }

  const openView = (c: Category) => {
    setFormCategoryName(c.category_name)
    setFormDoseCount(String(c.dose_count ?? ""))
    setFormStatus(c.status ?? "Active")
    setFormDescription(c.description ?? "")
    setSubcategories((c.subcategories ?? []).map((s) => ({ id: s.id, name: s.name })))
    setNewSubName("")
    setSelectedId(c.category_id)
    setFormMode("view")
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
    if (formMode === "view") return
    if (!formCategoryName.trim()) {
      toast.error("Category Name is required.")
      return
    }
    const doseNum = Number(formDoseCount)
    if (!formDoseCount || isNaN(doseNum) || doseNum < 0) {
      toast.error("Dose (kGy) is required and must be a valid number.")
      return
    }
    if (!formStatus.trim() || !STATUS_OPTIONS.includes(formStatus as (typeof STATUS_OPTIONS)[number])) {
      toast.error("Status is required.")
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
        dose_unit: FIXED_DOSE_UNIT,
        status: formStatus,
        description: formDescription.trim() || undefined,
        subcategories: subcategoriesTyped,
        updated_at: now,
      })
    } else {
      data.addCategory({
        category_name: formCategoryName.trim(),
        dose_count: doseNum,
        dose_unit: FIXED_DOSE_UNIT,
        status: formStatus,
        description: formDescription.trim() || undefined,
        subcategories: subcategoriesTyped,
        updated_at: now,
      })
    }
    setFormMode(null)
    setSelectedId(null)
    toast.success(selectedId ? "Category updated." : "Category created.")
  }

  const handleCloseForm = () => {
    if (formMode === "view") {
      setFormMode(null)
      setSelectedId(null)
      return
    }
    if (!window.confirm("Discard changes?")) return
    setFormMode(null)
    setSelectedId(null)
  }

  const filteredCategories = React.useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = categories.filter(
      (c) =>
        (c.category_name ?? "").toLowerCase().includes(term) ||
        (c.description ?? "").toLowerCase().includes(term)
    )
    return sortLatestFirst(
      list,
      (c) => latestOfDates(c.updated_at, c.created_at),
      (c) => c.category_id
    )
  }, [categories, searchTerm])

  // Full-page Create/Edit/View Category page
  if (formMode && allowed) {
    const isView = formMode === "view"
    const inputReadOnlyClass = "cursor-not-allowed bg-muted/50"
    const title =
      formMode === "edit"
        ? "Edit Product Category"
        : formMode === "view"
          ? "View Product Category"
          : "Add Product Category"

    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title={title}
              noBorder
              backButton={{ onClick: handleCloseForm }}
              actions={
                isView ? (
                  <Button
                    type="button"
                    className="h-9 rounded-md shadow-none"
                    onClick={() => {
                      const c = selectedId ? data.getCategory(selectedId) : undefined
                      if (!c) return
                      openEdit(c)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : undefined
              }
            />
            <div className="space-y-4 px-6 py-4 h-full">
          <div className="rounded-[10px] border border-border bg-card p-5 md:p-6 shadow-sm">
            <form onSubmit={handleSaveForm}>
              <FormSection title="Category Details" compact noSeparator>
                <div className="space-y-4 py-4">
                  <div className="grid h-fit grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category Name *</Label>
                      <Input
                        value={formCategoryName}
                        onChange={(e) => setFormCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        readOnly={isView}
                        className={isView ? inputReadOnlyClass : undefined}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-dose-kgy">Dose (kGy) *</Label>
                      <InputGroup>
                        <InputGroupInput
                          id="category-dose-kgy"
                          type="number"
                          min={0}
                          step="any"
                          value={formDoseCount}
                          onChange={(e) => setFormDoseCount(e.target.value)}
                          placeholder="e.g. 25"
                          readOnly={isView}
                          className={isView ? inputReadOnlyClass : undefined}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>{FIXED_DOSE_UNIT}</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-status">Status *</Label>
                      <Select value={formStatus} onValueChange={setFormStatus}>
                        <SelectTrigger id="category-status" disabled={isView}>
                          <SelectValue placeholder="Select status" />
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
                      readOnly={isView}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Sub categories" compact noSeparator>
                <div className="space-y-4 py-4">
                  {!isView ? (
                    <div className="flex gap-2">
                      <Input
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="Sub category name"
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
                        Add
                      </Button>
                    </div>
                  ) : null}
                  {subcategories.length > 0 && (
                    <ul className="space-y-2">
                      {subcategories.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <span>{s.name}</span>
                          {!isView ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveSubcategory(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </FormSection>

              {!isView ? (
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedId ? "Save" : "Create Category"}
                  </Button>
                </div>
              ) : null}
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
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
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
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Dose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((c) => (
                      <TableRow key={c.category_id}>
                        <TableCell className="max-w-md whitespace-normal align-top">
                          <span className="font-medium">{c.category_name}</span>
                        </TableCell>
                        <TableCell className="max-w-[260px] whitespace-normal align-top">
                          {(c.subcategories ?? []).some((s) => s.name) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {(c.subcategories ?? [])
                                .filter((s) => s.name)
                                .map((s) => (
                                  <Badge
                                    key={s.id}
                                    variant="secondary"
                                    className="max-w-full truncate font-normal"
                                    title={s.name}
                                  >
                                    {s.name}
                                  </Badge>
                                ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.dose_count != null && c.dose_unit
                            ? `${c.dose_count} ${c.dose_unit}`
                            : "—"}
                        </TableCell>
                        <TableCell>{c.status ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
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
      </div>
    </PageShell>
  )
}
