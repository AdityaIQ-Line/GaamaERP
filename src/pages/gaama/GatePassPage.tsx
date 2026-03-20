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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { GatePass } from "@/lib/gaama-types"
import { Truck, Search, Printer, Eye, FileOutput } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"

type ModalMode = "view" | "generate" | null

export function GatePassPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [viewId, setViewId] = React.useState<string | null>(null)
  const [generateId, setGenerateId] = React.useState<string | null>(null)
  const [generateNumber, setGenerateNumber] = React.useState("")
  const [generateDate, setGenerateDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  )

  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterCustomer, setFilterCustomer] = React.useState("all")
  const [filterCategory, setFilterCategory] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")

  const allowed = canAccess(data.currentRole, "gate-pass")
  const gatePasses = data.gatePasses

  const filtered = React.useMemo(() => {
    return gatePasses.filter((g) => {
      const matchSearch =
        !searchTerm ||
        (g.challan_number ?? g.challan_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.customer_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.gate_pass_number ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchCustomer = filterCustomer === "all" || g.customer_id === filterCustomer
      const matchCategory =
        filterCategory === "all" ||
        (g.product_category ?? "").toLowerCase().includes(filterCategory.toLowerCase())
      const matchStatus = filterStatus === "all" || g.gate_pass_status === filterStatus || g.process_status === filterStatus
      return matchSearch && matchCustomer && matchCategory && matchStatus
    })
  }, [gatePasses, searchTerm, filterCustomer, filterCategory, filterStatus])

  const uniqueCustomers = React.useMemo(() => {
    const ids = new Set(gatePasses.map((g) => g.customer_id).filter(Boolean))
    return Array.from(ids).map((id) => ({
      id: id!,
      name: data.getCustomer(id!)?.customer_name ?? id,
    }))
  }, [gatePasses, data])

  const uniqueCategories = React.useMemo(() => {
    const cats = new Set(gatePasses.map((g) => g.product_category).filter(Boolean))
    return Array.from(cats) as string[]
  }, [gatePasses])

  const openView = (g: GatePass) => {
    setViewId(g.gatepass_id)
    setMode("view")
  }

  const openGenerate = (g: GatePass) => {
    setGenerateId(g.gatepass_id)
    setGenerateNumber(g.gate_pass_number ?? "")
    setGenerateDate(g.gate_pass_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setMode("generate")
  }

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!generateId) return
    data.updateGatePass(generateId, {
      gate_pass_number: generateNumber,
      gate_pass_date: new Date(generateDate).toISOString().slice(0, 10),
      gate_pass_status: "Generated",
    })
    toast.success("Gate pass generated.")
    setMode(null)
    setGenerateId(null)
  }

  const viewGatePass = viewId ? data.getGatePass(viewId) : null

  const cancelGenerateGatePass = () => {
    if (!window.confirm("Discard changes?")) return
    setMode(null)
    setGenerateId(null)
  }

  const gatePassGenerateForm = (
    <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
      <form onSubmit={handleGenerateSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Gate Pass Number</Label>
            <Input value={generateNumber} onChange={(e) => setGenerateNumber(e.target.value)} placeholder="e.g. GP-2025-001" />
          </div>
          <div className="space-y-2">
            <Label>Gate Pass Date</Label>
            <Input type="date" value={generateDate} onChange={(e) => setGenerateDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={cancelGenerateGatePass}>
            Cancel
          </Button>
          <Button type="submit">Generate</Button>
        </div>
      </form>
    </div>
  )

  if (allowed && mode === "generate" && generateId) {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack title="Generate Gate Pass" noBorder backButton={{ onClick: cancelGenerateGatePass }} />
            <div className="space-y-4 px-6 py-4 h-full">
            {gatePassGenerateForm}
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader title="Gate Pass" />
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : gatePasses.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Truck className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No gate passes</EmptyTitle>
              <EmptyDescription>Gate passes are created from challans or when a GRN is rejected (Defect).</EmptyDescription>
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
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Gate Pass Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Generated">Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challan No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product Category</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Challan Date & Time</TableHead>
                    <TableHead>Process Status</TableHead>
                    <TableHead>Gate Pass Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.gatepass_id}>
                      <TableCell className="font-medium">{g.challan_number ?? g.challan_id}</TableCell>
                      <TableCell>{g.customer_name ?? "—"}</TableCell>
                      <TableCell>{g.product_category ?? "—"}</TableCell>
                      <TableCell>{g.product_name ?? "—"}</TableCell>
                      <TableCell>{g.quantity ?? "—"} {g.units ?? ""}</TableCell>
                      <TableCell>{g.challan_date_time ?? g.timestamp?.slice(0, 19).replace("T", " ") ?? "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{g.process_status ?? "—"}</Badge></TableCell>
                      <TableCell><Badge variant={g.gate_pass_status === "Generated" ? "default" : "secondary"}>{g.gate_pass_status ?? "Pending"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" title="View" onClick={() => openView(g)}><Eye className="h-4 w-4" /></Button>
                        {g.gate_pass_status !== "Generated" && (
                          <Button variant="ghost" size="sm" title="Generate" onClick={() => openGenerate(g)}><FileOutput className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="sm" title="Print" onClick={() => { setViewId(g.gatepass_id); setMode("view"); setTimeout(() => window.print(), 300); }}><Printer className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Dialog open={mode === "view" && viewId !== null} onOpenChange={(open) => !open && (setMode(null), setViewId(null))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gate Pass Details</DialogTitle>
          </DialogHeader>
          {viewGatePass && (
            <div className="space-y-4 py-4">
              <p><strong>Challan No.:</strong> {viewGatePass.challan_number ?? viewGatePass.challan_id}</p>
              <p><strong>Customer:</strong> {viewGatePass.customer_name ?? "—"}</p>
              <p><strong>Product Category:</strong> {viewGatePass.product_category ?? "—"}</p>
              <p><strong>Product Name:</strong> {viewGatePass.product_name ?? "—"}</p>
              <p><strong>Quantity:</strong> {viewGatePass.quantity ?? "—"} {viewGatePass.units ?? ""}</p>
              <p><strong>Gate Pass Number:</strong> {viewGatePass.gate_pass_number ?? "—"}</p>
              <p><strong>Gate Pass Date:</strong> {viewGatePass.gate_pass_date?.slice(0, 10) ?? "—"}</p>
              <p><strong>Process Status:</strong> <Badge variant="secondary">{viewGatePass.process_status ?? "—"}</Badge></p>
              <p><strong>Gate Pass Status:</strong> <Badge variant="secondary">{viewGatePass.gate_pass_status ?? "—"}</Badge></p>
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </PageShell>
  )
}
