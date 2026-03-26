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
import { latestOfDates, sortLatestFirst } from "@/lib/utils"

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
  const [generateProcessingType, setGenerateProcessingType] = React.useState("")
  const [generateVehicleNo, setGenerateVehicleNo] = React.useState("")
  const [generateDriverName, setGenerateDriverName] = React.useState("")
  const [generateMobileNo, setGenerateMobileNo] = React.useState("")
  const [generateSealNo, setGenerateSealNo] = React.useState("")

  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterCustomer, setFilterCustomer] = React.useState("all")
  const [filterCategory, setFilterCategory] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")

  const allowed = canAccess(data.currentRole, "gate-pass")
  const gatePasses = data.gatePasses

  const filtered = React.useMemo(() => {
    const list = gatePasses.filter((g) => {
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
    return sortLatestFirst(
      list,
      (g) => latestOfDates(g.timestamp, g.gate_pass_date, g.challan_date_time, g.created_at),
      (g) => g.gatepass_id
    )
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

  const [printAfterViewOpen, setPrintAfterViewOpen] = React.useState(false)

  const closeGatePassView = React.useCallback(() => {
    setMode(null)
    setViewId(null)
    setPrintAfterViewOpen(false)
  }, [])

  React.useEffect(() => {
    if (mode !== "view" || !printAfterViewOpen || !viewId) return
    if (!data.getGatePass(viewId)) return
    const t = window.setTimeout(() => {
      window.print()
      setPrintAfterViewOpen(false)
    }, 450)
    return () => window.clearTimeout(t)
  }, [mode, printAfterViewOpen, viewId])

  const openView = (g: GatePass) => {
    setPrintAfterViewOpen(false)
    setViewId(g.gatepass_id)
    setMode("view")
  }

  const openViewThenPrint = (g: GatePass) => {
    setViewId(g.gatepass_id)
    setMode("view")
    setPrintAfterViewOpen(true)
  }

  const openGenerate = (g: GatePass) => {
    setGenerateId(g.gatepass_id)
    setGenerateNumber(g.gate_pass_number ?? "")
    setGenerateDate(g.gate_pass_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setGenerateProcessingType(g.processing_type ?? "")
    setGenerateVehicleNo(g.vehicle_number ?? g.vehicle_no ?? "")
    setGenerateDriverName(g.driver_name ?? "")
    setGenerateMobileNo(g.mobile_no ?? "")
    setGenerateSealNo(g.vehicle_seal_number ?? "")
    setMode("generate")
  }

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!generateId) return
    if (!generateNumber.trim()) {
      toast.error("Gate pass number is required.")
      return
    }
    if (!generateDate.trim()) {
      toast.error("Gate pass date is required.")
      return
    }
    if (!generateProcessingType.trim()) {
      toast.error("Processing type is required.")
      return
    }
    if (!generateVehicleNo.trim()) {
      toast.error("Vehicle number is required.")
      return
    }
    if (!generateDriverName.trim()) {
      toast.error("Driver name is required.")
      return
    }
    if (!generateMobileNo.trim()) {
      toast.error("Mobile number is required.")
      return
    }
    if (!generateSealNo.trim()) {
      toast.error("Vehicle seal number is required.")
      return
    }
    data.updateGatePass(generateId, {
      gate_pass_number: generateNumber.trim(),
      gate_pass_date: new Date(generateDate).toISOString().slice(0, 10),
      processing_type: generateProcessingType.trim(),
      vehicle_number: generateVehicleNo.trim(),
      vehicle_no: generateVehicleNo.trim(),
      driver_name: generateDriverName.trim(),
      mobile_no: generateMobileNo.trim(),
      vehicle_seal_number: generateSealNo.trim(),
      gate_pass_status: "Generated",
    })
    toast.success("Gate pass generated.")
    setMode(null)
    setGenerateId(null)
  }

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
            <Label>Gate Pass Number *</Label>
            <Input value={generateNumber} onChange={(e) => setGenerateNumber(e.target.value)} placeholder="e.g. GP-2025-001" />
          </div>
          <div className="space-y-2">
            <Label>Gate Pass Date *</Label>
            <Input type="date" value={generateDate} onChange={(e) => setGenerateDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Processing Type *</Label>
            <Input
              value={generateProcessingType}
              onChange={(e) => setGenerateProcessingType(e.target.value)}
              placeholder="e.g. Normal / Defect"
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle Number *</Label>
            <Input
              value={generateVehicleNo}
              onChange={(e) => setGenerateVehicleNo(e.target.value)}
              placeholder="Enter vehicle number"
            />
          </div>
          <div className="space-y-2">
            <Label>Driver Name *</Label>
            <Input
              value={generateDriverName}
              onChange={(e) => setGenerateDriverName(e.target.value)}
              placeholder="Enter driver name"
            />
          </div>
          <div className="space-y-2">
            <Label>Mobile Number *</Label>
            <Input
              value={generateMobileNo}
              onChange={(e) => setGenerateMobileNo(e.target.value)}
              placeholder="Enter driver mobile number"
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle Seal Number *</Label>
            <Input
              value={generateSealNo}
              onChange={(e) => setGenerateSealNo(e.target.value)}
              placeholder="Enter vehicle seal number"
            />
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

  if (allowed && mode === "view" && viewId) {
    const g = data.getGatePass(viewId)
    if (!g) {
      return (
        <PageShell>
          <div className="flex-1 overflow-auto">
            <div className="w-full h-full">
              <PageHeaderWithBack title="Gate pass" noBorder backButton={{ onClick: closeGatePassView }} />
              <div className="px-6 py-4 text-muted-foreground">Gate pass not found.</div>
            </div>
          </div>
        </PageShell>
      )
    }
    const title = `Gate pass · ${g.challan_number ?? g.challan_id ?? g.gatepass_id}`
    const readOnlyClass = "h-9 cursor-not-allowed rounded-md border-transparent bg-muted text-muted-foreground"
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <div className="print:hidden">
              <PageHeaderWithBack
                title={title}
                noBorder
                backButton={{ onClick: closeGatePassView }}
                actions={
                  <Button type="button" variant="outline" className="h-9 rounded-md shadow-none" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                }
              />
            </div>
            <div className="space-y-4 px-6 py-4 h-full print:py-2">
              <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm md:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Challan &amp; product</h2>
                  <Badge variant="secondary" className="font-normal">
                    {g.gate_pass_status ?? "Pending"}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Challan No.</Label>
                    <Input readOnly value={g.challan_number ?? g.challan_id ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Customer</Label>
                    <Input readOnly value={g.customer_name ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Product category</Label>
                    <Input readOnly value={g.product_category ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Subcategory</Label>
                    <Input readOnly value={g.product_name ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <Input readOnly value={`${g.quantity ?? "—"} ${g.units ?? ""}`.trim()} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Challan date &amp; time</Label>
                    <Input
                      readOnly
                      value={g.challan_date_time ?? g.timestamp?.slice(0, 19).replace("T", " ") ?? "—"}
                      className={readOnlyClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border border-border bg-card p-5 shadow-sm md:p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Gate pass &amp; logistics</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Gate pass number</Label>
                    <Input readOnly value={g.gate_pass_number ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Gate pass date</Label>
                    <Input readOnly value={g.gate_pass_date?.slice(0, 10) ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Process status</Label>
                    <Input readOnly value={g.process_status ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Processing type</Label>
                    <Input readOnly value={g.processing_type ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vehicle no.</Label>
                    <Input readOnly value={g.vehicle_number ?? g.vehicle_no ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Driver name</Label>
                    <Input readOnly value={g.driver_name ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Mobile no.</Label>
                    <Input readOnly value={g.mobile_no ?? "—"} className={readOnlyClass} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vehicle seal no.</Label>
                    <Input readOnly value={g.vehicle_seal_number ?? "—"} className={readOnlyClass} />
                  </div>
                </div>
              </div>
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
                    <TableHead>Subcategory</TableHead>
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
                        <Button variant="ghost" size="sm" title="Print" onClick={() => openViewThenPrint(g)}><Printer className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

    </PageShell>
  )
}
