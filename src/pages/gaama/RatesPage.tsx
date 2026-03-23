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
import { Plus, IndianRupee, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

const PRICING_TYPES: PricingType[] = ["By Carton", "By Bag", "By Weight", "By Vehicle"]
const STATUS_OPTIONS = ["Active", "Inactive"]

type RatesFormMode = "create" | "edit" | null

export function RatesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<RatesFormMode>(null)
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

  const closeRateForm = React.useCallback(() => {
    setMode(null)
    setSelectedId(null)
  }, [])

  const allowed = canAccess(data.currentRole, "rates")
  const rates = data.rates
  const categories = data.categories
  const customers = data.customers

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
    if (customerSpecific && !formCustomerId) {
      toast.error("Select a customer for a customer-specific rate, or turn off Customer-specific rate.")
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
      closeRateForm()
      toast.success("Rate created.")
    } else if (mode === "edit" && selectedId) {
      data.updateRate(selectedId, payload)
      closeRateForm()
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

  const renderRateForm = (footer: React.ReactNode) => {
    const validityFrozen = mode === "edit"
    const dateInputClass = validityFrozen
      ? "h-9 cursor-not-allowed border-border bg-muted/50"
      : "h-9 bg-muted/60 border-border"

    const overviewCategoryName =
      categories.find((c) => c.category_id === formCategoryId)?.category_name ?? "—"
    const overviewCustomerLine =
      customerSpecific && formCustomerId
        ? customers.find((c) => c.customer_id === formCustomerId)?.customer_name ?? "—"
        : "All customers (category default)"
    const overviewRateLine =
      formRateValue !== "" && Number.isFinite(Number(formRateValue))
        ? `₹${Number(formRateValue).toLocaleString("en-IN")} per unit`
        : "—"
    const overviewValidityLine =
      formEffectiveFrom
        ? formEffectiveTo
          ? `${formEffectiveFrom} → ${formEffectiveTo}`
          : `${formEffectiveFrom} (no expiry)`
        : "—"
    const overviewDescriptionPreview = formDescription.trim()
      ? formDescription.trim().length > 120
        ? `${formDescription.trim().slice(0, 120)}…`
        : formDescription.trim()
      : "—"

    return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formCategoryId}
            onValueChange={(v) => setFormCategoryId(v)}
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
          <Select value={formStatus} onValueChange={setFormStatus}>
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
            className="h-8 bg-muted/60 border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Separator />

      <div className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex shrink-0 items-start gap-3 pt-0.5">
            <Switch
              id="customer-specific-rate"
              checked={customerSpecific}
              onCheckedChange={(v) => {
                setCustomerSpecific(!!v)
                if (!v) setFormCustomerId("")
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="customer-specific-rate" className="cursor-pointer text-base font-medium">
                Customer-specific rate
              </Label>
              <p className="max-w-xl text-xs leading-snug text-muted-foreground">
                Default: one rate for the whole category. Turn on to limit this rate to a single
                customer.
              </p>
            </div>
          </div>
          {customerSpecific ? (
            <div className="min-w-0 flex-1 space-y-2 sm:pt-0.5">
              <Label htmlFor="rate-specific-customer" className="text-sm">
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select value={formCustomerId || undefined} onValueChange={setFormCustomerId}>
                <SelectTrigger
                  id="rate-specific-customer"
                  className="h-10 w-full min-w-0 bg-background shadow-sm"
                >
                  <SelectValue placeholder="Choose one customer" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {customers.map((c) => (
                    <SelectItem key={c.customer_id} value={c.customer_id}>
                      {c.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <h3 className="text-base font-semibold">Validity Period</h3>
          {validityFrozen ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Effective and expiry dates cannot be changed when editing. Add a new rate to use a
              different validity period.
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={formEffectiveFrom}
              onChange={(e) => setFormEffectiveFrom(e.target.value)}
              disabled={validityFrozen}
              className={dateInputClass}
            />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={formEffectiveTo}
              onChange={(e) => setFormEffectiveTo(e.target.value)}
              disabled={validityFrozen}
              className={dateInputClass}
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
          rows={5}
          className="min-h-[120px] resize-y bg-background border-border"
        />
      </div>

      <div className="space-y-3 border-t border-border pt-6">
        <div>
          <h3 className="text-base font-semibold">Rate overview</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Quick summary of this rate from the fields above (updates as you edit).
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/15 p-4 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </dt>
            <dd className="font-medium text-foreground">{overviewCategoryName}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pricing type
            </dt>
            <dd className="font-medium text-foreground">{formPricingType}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rate per unit
            </dt>
            <dd className="tabular-nums font-medium text-foreground">{overviewRateLine}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </dt>
            <dd className="font-medium text-foreground">{formStatus}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Applies to
            </dt>
            <dd className="font-medium text-foreground">{overviewCustomerLine}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Validity
            </dt>
            <dd className="font-medium text-foreground">{overviewValidityLine}</dd>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </dt>
            <dd className="whitespace-pre-wrap text-foreground">{overviewDescriptionPreview}</dd>
          </div>
        </dl>
      </div>

      {footer}
    </form>
    )
  }

  if (allowed && (mode === "create" || mode === "edit")) {
    const formTitle = mode === "create" ? "Add Rate" : "Edit Rate"
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack
              title={formTitle}
              noBorder
              backButton={{ onClick: closeRateForm }}
            />
            <div className="space-y-4 px-6 py-4 h-full">
              <div className="rounded-lg border border-border bg-card p-6">
                {renderRateForm(
                  <div className="flex justify-end gap-3 border-t border-border pt-6">
                    <Button type="button" variant="outline" onClick={closeRateForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>,
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
                    <TableHead>Rate Per Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.map((r) => {
                    const amount =
                      typeof r.rate_value === "number" && !Number.isNaN(r.rate_value)
                        ? r.rate_value
                        : Number.parseFloat(String(r.rate ?? ""))
                    const rateDisplay = Number.isFinite(amount) ? amount : null
                    const createdSource =
                      r.created_at ?? r.effective_from ?? r.effective_date
                    return (
                    <TableRow key={r.rate_id}>
                      <TableCell>
                        {data.getCategory(r.category_id)?.category_name ??
                          r.category_name ??
                          r.category_id}
                      </TableCell>
                      <TableCell>{r.pricing_type ?? "—"}</TableCell>
                      <TableCell>
                        {rateDisplay != null ? (
                          <span className="tabular-nums">
                            ₹{Number(rateDisplay).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{r.status ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {createdSource
                          ? new Date(createdSource).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

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
