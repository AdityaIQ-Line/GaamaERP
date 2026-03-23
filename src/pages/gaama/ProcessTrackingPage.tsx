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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import type { GRN, GRNStatus } from "@/lib/gaama-types"
import { GitBranch, Search, Download } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn, latestOfDates, sortLatestFirst } from "@/lib/utils"

const PROCESS_STATUSES: { value: GRNStatus; label: string }[] = [
  { value: "In Progress", label: "In Progress" },
  { value: "Hold", label: "Hold" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
]

function processTrackingStatusBadgeClassName(status: string | undefined): string {
  const s = String(status ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
  if (s === "in progress") return "border-0 bg-primary/15 text-primary hover:bg-primary/15"
  if (s === "hold") return "border-0 bg-amber-100 text-amber-950 hover:bg-amber-100"
  if (s === "completed") return "border-0 bg-emerald-100 text-emerald-950 hover:bg-emerald-100"
  if (s === "rejected") return "border-0 bg-destructive/15 text-destructive hover:bg-destructive/15"
  return "border-0 bg-secondary text-secondary-foreground hover:bg-secondary"
}

function exportToCsv(rows: Array<Record<string, string | number>>, filename: string) {
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

export function ProcessTrackingPage() {
  const data = useData()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterCustomer, setFilterCustomer] = React.useState("all")
  const [filterCategory, setFilterCategory] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")
  const [updateModalGrnId, setUpdateModalGrnId] = React.useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = React.useState<GRNStatus>("In Progress")
  const [updateRemarks, setUpdateRemarks] = React.useState("")

  const allowed = canAccess(data.currentRole, "process-tracking")
  const grns = data.grns

  // Data source: GRNs with status ≠ "Pending"
  const processGrns = React.useMemo(
    () => grns.filter((g) => g.status && g.status !== "Pending" && g.status !== "pending"),
    [grns]
  )

  const filteredRows = React.useMemo(() => {
    const list = processGrns.filter((g) => {
      const matchSearch =
        !searchTerm ||
        (g.grn_number ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.sales_order_number ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.customer_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.category_name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchCustomer =
        filterCustomer === "all" || g.customer_id === filterCustomer
      const matchCategory =
        filterCategory === "all" || g.category_id === filterCategory
      const matchStatus =
        filterStatus === "all" || g.status === filterStatus
      return matchSearch && matchCustomer && matchCategory && matchStatus
    })
    return sortLatestFirst(
      list,
      (g) => latestOfDates(g.received_date, g.created_at),
      (g) => g.grn_id
    )
  }, [processGrns, searchTerm, filterCustomer, filterCategory, filterStatus])

  const uniqueCustomers = React.useMemo(() => {
    const ids = new Set(processGrns.map((g) => g.customer_id).filter(Boolean))
    return Array.from(ids).map((id) => ({
      id: id!,
      name: data.getCustomer(id!)?.customer_name ?? id,
    }))
  }, [processGrns, data])

  const uniqueCategories = React.useMemo(() => {
    const ids = new Set(processGrns.map((g) => g.category_id).filter(Boolean))
    return Array.from(ids).map((id) => ({
      id: id!,
      name: data.getCategory(id!)?.category_name ?? id,
    }))
  }, [processGrns, data])

  const openProcessDetailDialog = (g: GRN) => {
    setUpdateModalGrnId(g.grn_id)
    const valid =
      g.status && PROCESS_STATUSES.some((s) => s.value === g.status)
        ? (g.status as GRNStatus)
        : PROCESS_STATUSES[0].value
    setUpdateStatus(valid)
    setUpdateRemarks(g.remarks ?? "")
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateModalGrnId) return
    const grn = data.getGRN(updateModalGrnId)
    if (!grn) return
    if ((updateStatus === "Hold" || updateStatus === "Rejected") && !updateRemarks.trim()) {
      alert("Remarks are required for Hold and Rejected.")
      return
    }
    data.updateGRN(updateModalGrnId, {
      status: updateStatus,
      remarks: updateRemarks.trim() || undefined,
    })
    if (updateStatus === "Rejected") {
      const now = new Date().toISOString()
      data.addGatePass({
        challan_id: `defect-${grn.grn_id}`,
        challan_number: `Defect-${grn.grn_number ?? grn.grn_id}`,
        customer_id: grn.customer_id,
        customer_name: grn.customer_name,
        product_category: grn.category_name,
        product_name: grn.product_name,
        quantity: grn.received_quantity,
        units: grn.unit,
        process_status: "Hold",
        gate_pass_status: "Pending",
        processing_type: "Defect",
        timestamp: now,
      })
    }
    setUpdateModalGrnId(null)
    setUpdateRemarks("")
    toast.success("Status updated.")
  }

  const modalGrn = updateModalGrnId ? data.getGRN(updateModalGrnId) : undefined

  const handleExport = () => {
    const rows = filteredRows.map((g) => ({
      "GRN No": g.grn_number ?? g.grn_id,
      "Sales Order No": g.sales_order_number ?? "",
      "sub Category": g.product_name ?? "",
      Customer: g.customer_name ?? "",
      Quantity: g.received_quantity ?? "",
      Units: g.unit ?? "",
      Status: g.status ?? "",
    }))
    exportToCsv(rows, `process-tracking-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <PageShell>
      <PageHeader
        title="Process Tracking"
        actions={
          allowed && filteredRows.length > 0 ? (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : processGrns.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GitBranch className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No process tracking records</EmptyTitle>
              <EmptyDescription>
                GRNs sent for processing will appear here. Use GRN page to &quot;Send for Processing&quot;.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Product Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PROCESS_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN No</TableHead>
                    <TableHead>Sales Order No</TableHead>
                    <TableHead>sub Category</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                    <TableHead className="text-right w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((g) => (
                    <TableRow key={g.grn_id}>
                      <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                      <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                      <TableCell>{g.product_name ?? "—"}</TableCell>
                      <TableCell>{g.customer_name ?? "—"}</TableCell>
                      <TableCell>{g.received_quantity ?? "—"}</TableCell>
                      <TableCell>{g.unit ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-medium capitalize",
                            processTrackingStatusBadgeClassName(g.status)
                          )}
                        >
                          {g.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-md shadow-none"
                          onClick={() => openProcessDetailDialog(g)}
                        >
                          Update
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

      <Dialog
        open={updateModalGrnId !== null}
        onOpenChange={(open) => {
          if (!open) setUpdateModalGrnId(null)
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px] sm:rounded-md">
          {!modalGrn ? (
            <div className="px-6 py-8">
              <DialogHeader>
                <DialogTitle>Update</DialogTitle>
                <DialogDescription>This GRN record is no longer available.</DialogDescription>
              </DialogHeader>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-md shadow-none"
                onClick={() => setUpdateModalGrnId(null)}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUpdateSubmit}>
              <div className="space-y-2 border-b border-border px-6 pt-6 pb-4">
                <DialogHeader className="gap-2 text-left">
                  <DialogTitle className="text-lg font-semibold leading-tight">
                    Update | {modalGrn.grn_number ?? modalGrn.grn_id}
                  </DialogTitle>
                  <DialogDescription>
                    Update the processing status and add remarks for this GRN record
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Sales Order Number</Label>
                  <Input
                    readOnly
                    value={modalGrn.sales_order_number ?? modalGrn.sales_order_id ?? "—"}
                    className="h-9 cursor-not-allowed rounded-md border-transparent bg-muted text-muted-foreground opacity-90"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Status</Label>
                  <Select value={updateStatus} onValueChange={(v) => setUpdateStatus(v as GRNStatus)}>
                    <SelectTrigger className="h-9 w-full rounded-md shadow-none">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalGrn.status &&
                      !PROCESS_STATUSES.some((s) => s.value === modalGrn.status) ? (
                        <SelectItem value={modalGrn.status as string} disabled>
                          {modalGrn.status} (current)
                        </SelectItem>
                      ) : null}
                      {PROCESS_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Remarks</Label>
                  <Textarea
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    placeholder="Add remarks (optional)"
                    rows={4}
                    className="min-h-[100px] resize-none rounded-md"
                  />
                </div>
                <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-3 text-sm text-primary">
                  <p>
                    Status will be automatically updated to &quot;In Progress&quot; when sent for processing.
                  </p>
                  {(updateStatus === "Hold" || updateStatus === "Rejected") && (
                    <p className="mt-2 text-muted-foreground">
                      Remarks are required for Hold and Rejected.
                      {updateStatus === "Rejected"
                        ? " A Defect Gate Pass will be created when you save."
                        : ""}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md shadow-none"
                  onClick={() => setUpdateModalGrnId(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="rounded-md shadow-none">
                  Save Details
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
