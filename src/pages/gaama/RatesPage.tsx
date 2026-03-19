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
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useData, canAccess } from "@/context/DataContext"
import type { Rate, PricingType } from "@/lib/gaama-types"
import { Plus, IndianRupee, Search, Eye, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

const PRICING_TYPES: PricingType[] = ["By Carton", "By Weight", "By Vehicle"]
const STATUS_OPTIONS = ["Active", "Inactive"]

type ModalMode = "create" | "edit" | "view" | null

export function RatesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Gaama ERP 2 form state
  const [formCategoryId, setFormCategoryId] = React.useState("")
  const [formPricingType, setFormPricingType] = React.useState<PricingType>("By Carton")
  const [formRateValue, setFormRateValue] = React.useState<string>("")
  const [formStatus, setFormStatus] = React.useState("Active")
  const [formDescription, setFormDescription] = React.useState("")
  const [customerSpecific, setCustomerSpecific] = React.useState(false)
  const [formCustomerId, setFormCustomerId] = React.useState("")
  const [formEffectiveFrom, setFormEffectiveFrom] = React.useState(
    () => new Date().toISOString().slice(0, 10)
  )
  const [formEffectiveTo, setFormEffectiveTo] = React.useState("")

  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const allowed = canAccess(data.currentRole, "rates")
  const rates = data.rates
  const categories = data.categories
  const customers = data.customers

  const selectedCategory = formCategoryId
    ? data.getCategory(formCategoryId)
    : undefined
  const categoryUnit = selectedCategory?.dose_unit ?? "—"

  const openCreate = () => {
    setFormCategoryId(categories[0]?.category_id ?? "")
    setFormPricingType("By Carton")
    setFormRateValue("")
    setFormStatus("Active")
    setFormDescription("")
    setCustomerSpecific(false)
    setFormCustomerId("")
    setFormEffectiveFrom(new Date().toISOString().slice(0, 10))
    setFormEffectiveTo("")
    setSelectedId(null)
    setMode("create")
  }

  const openEdit = (r: Rate) => {
    const from = r.effective_from ?? r.effective_date ?? new Date().toISOString()
    setFormCategoryId(r.category_id)
    setFormPricingType((r.pricing_type as PricingType) ?? "By Carton")
    setFormRateValue(String(r.rate_value ?? r.rate ?? ""))
    setFormStatus(r.status ?? "Active")
    setFormDescription(r.description ?? "")
    setCustomerSpecific(!!r.customer_id)
    setFormCustomerId(r.customer_id ?? "")
    setFormEffectiveFrom(from.slice(0, 10))
    setFormEffectiveTo(r.effective_to?.slice(0, 10) ?? "")
    setSelectedId(r.rate_id)
    setMode("edit")
  }

  const openView = (r: Rate) => {
    const from = r.effective_from ?? r.effective_date ?? new Date().toISOString()
    setFormCategoryId(r.category_id)
    setFormPricingType((r.pricing_type as PricingType) ?? "By Carton")
    setFormRateValue(String(r.rate_value ?? r.rate ?? ""))
    setFormStatus(r.status ?? "Active")
    setFormDescription(r.description ?? "")
    setCustomerSpecific(!!r.customer_id)
    setFormCustomerId(r.customer_id ?? "")
    setFormEffectiveFrom(from.slice(0, 10))
    setFormEffectiveTo(r.effective_to?.slice(0, 10) ?? "")
    setSelectedId(r.rate_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cat = data.getCategory(formCategoryId)
    const cust = formCustomerId ? data.getCustomer(formCustomerId) : undefined
    const rateNum = Number(formRateValue)
    if (!formCategoryId || !formPricingType || (isNaN(rateNum) && formRateValue !== "")) {
      alert("Category, Pricing Type, and Rate Per Unit are required.")
      return
    }
    if (formRateValue === "" || isNaN(rateNum) || rateNum < 0) {
      alert("Rate Per Unit must be a valid non-negative number.")
      return
    }

    const effectiveFromIso = new Date(formEffectiveFrom).toISOString()
    const effectiveToIso = formEffectiveTo
      ? new Date(formEffectiveTo).toISOString()
      : undefined

    const payload = {
      category_id: formCategoryId,
      category_name: cat?.category_name ?? formCategoryId,
      pricing_type: formPricingType,
      rate_value: rateNum,
      rate: String(rateNum),
      currency: "INR",
      effective_date: effectiveFromIso,
      effective_from: effectiveFromIso,
      effective_to: effectiveToIso,
      status: formStatus,
      description: formDescription || undefined,
      customer_id: customerSpecific ? formCustomerId || undefined : undefined,
      customer_name: customerSpecific && cust ? cust.customer_name : undefined,
    }

    if (mode === "create") {
      data.addRate(payload)
      setMode(null)
      toast.success("Rate created.")
    } else if (mode === "edit" && selectedId) {
      data.updateRate(selectedId, payload)
      setMode(null)
      toast.success("Rate updated.")
    }
  }

  const handleDeleteClick = (r: Rate) => {
    setDeleteTargetId(r.rate_id)
  }

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      data.deleteRate(deleteTargetId)
      setDeleteTargetId(null)
      toast.success("Rate deleted.")
    }
  }

  const isView = mode === "view"
  const filteredRates = rates.filter((r) => {
    const catName = data.getCategory(r.category_id)?.category_name ?? ""
    const custName = r.customer_name ?? ""
    const term = searchTerm.toLowerCase()
    return (
      catName.toLowerCase().includes(term) ||
      custName.toLowerCase().includes(term) ||
      String(r.rate_value).includes(term) ||
      (r.pricing_type ?? "").toLowerCase().includes(term)
    )
  })

  return (
    <PageShell>
      <PageHeader
        title="Rate Master"
        actions={
          allowed ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rate
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">
            You do not have permission to view this module.
          </p>
        ) : rates.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IndianRupee className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No rates</EmptyTitle>
              <EmptyDescription>
                Add rates per category for sales orders.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Add Rate</Button>
          </Empty>
        ) : (
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by category, customer, or rate"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.map((r) => (
                    <TableRow key={r.rate_id}>
                      <TableCell>
                        {data.getCategory(r.category_id)?.category_name ??
                          r.category_name ??
                          r.category_id}
                      </TableCell>
                      <TableCell>{r.pricing_type ?? "—"}</TableCell>
                      <TableCell>
                        {r.rate_value != null ? r.rate_value : r.rate ?? "—"}
                      </TableCell>
                      <TableCell>{r.customer_name ?? "—"}</TableCell>
                      <TableCell>
                        {(r.effective_from ?? r.effective_date)?.slice(0, 10) ??
                          "—"}
                      </TableCell>
                      <TableCell>
                        {r.effective_to?.slice(0, 10) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" title="View" onClick={() => openView(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Add Rate"
                : mode === "edit"
                  ? "Edit Rate"
                  : "Rate Details"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formCategoryId}
                    onValueChange={(v) => setFormCategoryId(v)}
                    disabled={isView}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.category_id} value={c.category_id}>
                          {c.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category Unit</Label>
                  <Input
                    value={categoryUnit}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Type *</Label>
                  <Select
                    value={formPricingType}
                    onValueChange={(v) =>
                      setFormPricingType(v as PricingType)
                    }
                    disabled={isView}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rate Per Unit *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={formRateValue}
                    onChange={(e) => setFormRateValue(e.target.value)}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formStatus}
                    onValueChange={setFormStatus}
                    disabled={isView}
                  >
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
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    readOnly={isView}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="customer-specific"
                    checked={customerSpecific}
                    onChange={(e) => setCustomerSpecific(e.target.checked)}
                    disabled={isView}
                    className="rounded border-input"
                  />
                  <Label htmlFor="customer-specific">
                    Customer-specific rate
                  </Label>
                </div>
                {customerSpecific && (
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select
                      value={formCustomerId}
                      onValueChange={setFormCustomerId}
                      disabled={isView}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem
                            key={c.customer_id}
                            value={c.customer_id}
                          >
                            {c.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={formEffectiveFrom}
                      onChange={(e) => setFormEffectiveFrom(e.target.value)}
                      readOnly={isView}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={formEffectiveTo}
                      onChange={(e) => setFormEffectiveTo(e.target.value)}
                      readOnly={isView}
                    />
                  </div>
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
                <Button type="submit">
                  {mode === "create" ? "Create" : "Save"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rate? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
