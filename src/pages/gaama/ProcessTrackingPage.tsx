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
import { GitBranch, Search, Download, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

const PROCESS_STATUSES: { value: GRNStatus; label: string }[] = [
  { value: "In Progress", label: "In Progress" },
  { value: "Hold", label: "Hold" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
]

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
    return processGrns.filter((g) => {
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

  const handleOpenUpdate = (g: GRN) => {
    setUpdateModalGrnId(g.grn_id)
    setUpdateStatus((g.status as GRNStatus) ?? "In Progress")
    setUpdateRemarks("")
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
    data.updateGRN(updateModalGrnId, { status: updateStatus })
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

  const handleExport = () => {
    const rows = filteredRows.map((g, i) => ({
      "Sl.No": i + 1,
      "GRN No": g.grn_number ?? g.grn_id,
      "Sales Order No": g.sales_order_number ?? "",
      "Product Category": g.category_name ?? "",
      Customer: g.customer_name ?? "",
      Quantity: g.received_quantity ?? "",
      Units: g.unit ?? "",
      "Created At": g.created_at ?? g.received_date ?? "",
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
              {filteredRows.length > 0 && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sl.No</TableHead>
                    <TableHead>GRN No</TableHead>
                    <TableHead>Sales Order No</TableHead>
                    <TableHead>Product Category</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((g, idx) => (
                    <TableRow key={g.grn_id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                      <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                      <TableCell>{g.category_name ?? "—"}</TableCell>
                      <TableCell>{g.customer_name ?? "—"}</TableCell>
                      <TableCell>{g.received_quantity ?? "—"}</TableCell>
                      <TableCell>{g.unit ?? "—"}</TableCell>
                      <TableCell>
                        {(g.created_at ?? g.received_date)?.slice(0, 19).replace("T", " ") ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" title="Update status" onClick={() => handleOpenUpdate(g)}>
                          <Pencil className="h-4 w-4" />
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

      <Dialog open={updateModalGrnId !== null} onOpenChange={(open) => !open && setUpdateModalGrnId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={updateStatus}
                  onValueChange={(v) => setUpdateStatus(v as GRNStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(updateStatus === "Hold" || updateStatus === "Rejected") && (
                <div className="space-y-2">
                  <Label>Remarks *</Label>
                  <Textarea
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    placeholder="Required for Hold and Rejected"
                    rows={3}
                  />
                </div>
              )}
              {updateStatus === "Rejected" && (
                <p className="text-sm text-muted-foreground">
                  A Defect Gate Pass will be created when you save.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateModalGrnId(null)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
