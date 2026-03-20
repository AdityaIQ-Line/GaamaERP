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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

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

  const renderRateForm = (footer: React.ReactNode) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formCategoryId}
            onValueChange={(v) => setFormCategoryId(v)}
            disabled={isView}
          >
            <SelectTrigger className="h-9 bg-muted/60 border-border">
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
          <Label>
            Pricing Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formPricingType}
            onValueChange={(v) => setFormPricingType(v as PricingType)}
            disabled={isView}
          >
            <SelectTrigger className="h-9 bg-muted/60 border-border">
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
          <Label>
            Status <span className="text-destructive">*</span>
          </Label>
          <Select value={formStatus} onValueChange={setFormStatus} disabled={isView}>
            <SelectTrigger className="h-9 bg-muted/60 border-border">
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
          <Label>
            Rate Per Unit (₹) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            min={0}
            step="any"
            placeholder="Enter rate"
            value={formRateValue}
            onChange={(e) => setFormRateValue(e.target.value)}
            readOnly={isView}
            className="h-9 bg-muted/60 border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Switch
            id="customer-specific-rate"
            checked={customerSpecific}
            onCheckedChange={(v) => setCustomerSpecific(!!v)}
            disabled={isView}
          />
          <Label htmlFor="customer-specific-rate" className="text-base font-medium cursor-pointer">
            Customer Specific Rate
          </Label>
        </div>
      </div>
      {customerSpecific && (
        <div className="space-y-2 pl-0 sm:pl-11">
          <Label>Customer</Label>
          <Select value={formCustomerId} onValueChange={setFormCustomerId} disabled={isView}>
            <SelectTrigger className="h-9 bg-muted/60 border-border">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.customer_id} value={c.customer_id}>
                  {c.customer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-base font-semibold">Validity Period</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={formEffectiveFrom}
              onChange={(e) => setFormEffectiveFrom(e.target.value)}
              readOnly={isView}
              className="h-9 bg-muted/60 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={formEffectiveTo}
              onChange={(e) => setFormEffectiveTo(e.target.value)}
              readOnly={isView}
              className="h-9 bg-muted/60 border-border"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-6">
        <Label>Description</Label>
        <Textarea
          placeholder="Write here..."
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          readOnly={isView}
          rows={5}
          className="min-h-[120px] resize-y bg-background border-border"
        />
      </div>

      {footer}
    </form>
  )

  if (allowed && mode === "create") {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack title="Add Rate" noBorder backButton={{ onClick: () => setMode(null) }} />
            <div className="space-y-4 px-6 py-4 h-full">
            <div className="rounded-lg border border-border bg-card p-6">
              {renderRateForm(
                <div className="flex justify-end gap-3 border-t border-border pt-6">
                  <Button type="button" variant="outline" onClick={() => setMode(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              )}
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative max-w-xs flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by category, customer, or rate"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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

      <Dialog open={mode === "edit" || mode === "view"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto gap-0 border-border p-6 sm:p-6">
          <DialogHeader className="space-y-0 pb-6 text-left">
            <DialogTitle className="text-lg font-semibold">
              {mode === "edit" ? "Edit Rate" : "Rate Details"}
            </DialogTitle>
          </DialogHeader>
          {renderRateForm(
            isView ? (
              <DialogFooter className="border-t border-border pt-6 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setMode(null)}>
                  Close
                </Button>
              </DialogFooter>
            ) : (
              <DialogFooter className="gap-3 border-t border-border pt-6 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            ),
          )}
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
