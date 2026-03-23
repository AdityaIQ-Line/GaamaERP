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
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { Certificate, CertificateProductRow, GRN } from "@/lib/gaama-types"
import { Plus, Award, Search, Printer, Download, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PageHeaderWithBack } from "@/components/patterns/page-header-with-back"
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"

type Tab = "pending" | "certificate"
type ModalMode = "create" | "view" | null

function exportCertificatesToCsv(rows: Array<Record<string, string | number>>, filename: string) {
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

export function CertificatesPage() {
  const data = useData()
  const [tab, setTab] = React.useState<Tab>("pending")
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [viewId, setViewId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const [createFromGrnId, setCreateFromGrnId] = React.useState("")
  const [certProductRows, setCertProductRows] = React.useState<CertificateProductRow[]>([
    { sr_no: 1, description: "", quantity: "", batch: "" },
  ])
  const [certBatchLot, setCertBatchLot] = React.useState("")
  const [certStickerStart, setCertStickerStart] = React.useState("")
  const [certStickerEnd, setCertStickerEnd] = React.useState("")
  const [certIrradiationDate, setCertIrradiationDate] = React.useState("")
  const [certMinDose, setCertMinDose] = React.useState("")
  const [certAvgDose, setCertAvgDose] = React.useState("")
  const [certDaeLicense, setCertDaeLicense] = React.useState("")
  const [certAerbLicense, setCertAerbLicense] = React.useState("")
  const [certCrn, setCertCrn] = React.useState("")
  const [certInw, setCertInw] = React.useState("")
  const [certJw, setCertJw] = React.useState("")
  const [certSoDate, setCertSoDate] = React.useState("")
  const [certTotalBoxes, setCertTotalBoxes] = React.useState("")
  const [certTotalNetWeight, setCertTotalNetWeight] = React.useState("")
  const [certTotalGrossWeight, setCertTotalGrossWeight] = React.useState("")
  const [certUnitSerialFrom, setCertUnitSerialFrom] = React.useState("")
  const [certUnitSerialTo, setCertUnitSerialTo] = React.useState("")
  const [certDosimeterBatch, setCertDosimeterBatch] = React.useState("")

  const allowed = canAccess(data.currentRole, "certificates")
  const certificates = data.certificates
  const grns = data.grns

  const completedGrns = React.useMemo(
    () => grns.filter((g) => g.status === "Completed"),
    [grns]
  )
  const grnIdsWithCert = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of certificates) {
      if (c.sales_order_id) {
        const so = data.getSalesOrder(c.sales_order_id)
        if (so) {
          for (const g of data.grns) {
            if (g.sales_order_id === c.sales_order_id) set.add(g.grn_id)
          }
        }
      }
    }
    return set
  }, [certificates, data])

  const pendingForCert = React.useMemo(
    () => completedGrns.filter((g) => !grnIdsWithCert.has(g.grn_id)),
    [completedGrns, grnIdsWithCert]
  )

  const openGenerate = (grn: GRN) => {
    setCreateFromGrnId(grn.grn_id)
    const cat = grn.category_id ? data.getCategory(grn.category_id) : undefined
    setCertProductRows([
      { sr_no: 1, description: grn.product_name ?? grn.category_name ?? "", quantity: grn.received_quantity ?? "", batch: "" },
    ])
    setCertBatchLot("")
    setCertStickerStart("")
    setCertStickerEnd("")
    setCertIrradiationDate(new Date().toISOString().slice(0, 10))
    setCertMinDose(cat?.dose_count != null ? String(cat.dose_count) : "")
    setCertAvgDose(cat?.dose_count != null ? String(cat.dose_count) : "")
    setCertDaeLicense("")
    setCertAerbLicense("")
    setCertCrn("")
    setCertInw("")
    setCertJw("")
    setCertSoDate("")
    setCertTotalBoxes("")
    setCertTotalNetWeight("")
    setCertTotalGrossWeight("")
    setCertUnitSerialFrom("")
    setCertUnitSerialTo("")
    setCertDosimeterBatch("")
    setMode("create")
  }

  const addProductRow = () => {
    setCertProductRows((prev) => [
      ...prev,
      { sr_no: prev.length + 1, description: "", quantity: "", batch: "" },
    ])
  }

  const updateProductRow = (idx: number, upd: Partial<CertificateProductRow>) => {
    setCertProductRows((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...upd }
      return next
    })
  }

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const grn = data.getGRN(createFromGrnId)
    if (!grn) return
    const so = data.getSalesOrder(grn.sales_order_id ?? "")
    const certNo = `CERT-${new Date().getFullYear()}-${String(certificates.length + 1).padStart(3, "0")}`
    data.addCertificate({
      sales_order_id: grn.sales_order_id ?? "",
      sales_order_number: so?.sales_order_number ?? so?.order_number,
      product_category: grn.category_name,
      product_name: grn.product_name,
      customer_id: grn.customer_id,
      customer_name: grn.customer_name,
      quantity: grn.received_quantity,
      units: grn.unit,
      status: "Generated",
      certificate_no: certNo,
      batch_lot_no: certBatchLot,
      sticker_range_start: certStickerStart ? Number(certStickerStart) : undefined,
      sticker_range_end: certStickerEnd,
      irradiation_complete_date: certIrradiationDate,
      minimum_dose: certMinDose,
      average_dose: certAvgDose,
      product_rows: certProductRows,
      issued_date: new Date().toISOString(),
      dae_license_no: certDaeLicense || undefined,
      aerb_license_no: certAerbLicense || undefined,
      crn: certCrn || undefined,
      inw: certInw || undefined,
      jw: certJw || undefined,
      so_date: certSoDate || undefined,
      total_boxes: certTotalBoxes || undefined,
      total_net_weight: certTotalNetWeight || undefined,
      total_gross_weight: certTotalGrossWeight || undefined,
      unit_serial_from: certUnitSerialFrom || undefined,
      unit_serial_to: certUnitSerialTo || undefined,
      dosimeter_batch: certDosimeterBatch || undefined,
    })
    toast.success("Certificate generated.")
    setMode(null)
    setTab("certificate")
  }

  const openView = (c: Certificate) => {
    setViewId(c.certificate_id)
    setMode("view")
  }

  const filteredCerts = certificates.filter((c) => {
    const term = searchTerm.toLowerCase()
    return (
      (c.certificate_no ?? c.certificate_id).toLowerCase().includes(term) ||
      (c.sales_order_number ?? c.sales_order_id).toLowerCase().includes(term) ||
      (c.customer_name ?? "").toLowerCase().includes(term)
    )
  })

  const viewCert = viewId ? data.getCertificate(viewId) : null

  const cancelCreateCertificate = () => {
    if (!window.confirm("Discard changes?")) return
    setMode(null)
  }

  const certificateCreateForm = (
    <div className="rounded-lg border border-border bg-card p-6 max-w-4xl">
      <form onSubmit={handleGenerateSubmit}>
        <FormSection title="Sub category rows" noSeparator>
          <div className="space-y-4 py-4">
            {certProductRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Sr.No"
                  type="number"
                  value={row.sr_no}
                  onChange={(e) => updateProductRow(idx, { sr_no: Number(e.target.value) || 0 })}
                />
                <Input
                  placeholder="Description"
                  value={row.description}
                  onChange={(e) => updateProductRow(idx, { description: e.target.value })}
                />
                <Input
                  placeholder="Quantity"
                  value={row.quantity}
                  onChange={(e) => updateProductRow(idx, { quantity: e.target.value })}
                />
                <Input
                  placeholder="Batch"
                  value={row.batch}
                  onChange={(e) => updateProductRow(idx, { batch: e.target.value })}
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addProductRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add sub category row
            </Button>
          </div>
        </FormSection>
        <FormSection title="Details" noSeparator>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Batch / Lot No.</Label>
              <Input value={certBatchLot} onChange={(e) => setCertBatchLot(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sticker range (Start)</Label>
              <Input type="number" value={certStickerStart} onChange={(e) => setCertStickerStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sticker range (End)</Label>
              <Input value={certStickerEnd} onChange={(e) => setCertStickerEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Irradiation complete date</Label>
              <Input type="date" value={certIrradiationDate} onChange={(e) => setCertIrradiationDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Minimum dose</Label>
              <Input value={certMinDose} onChange={(e) => setCertMinDose(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Average dose</Label>
              <Input value={certAvgDose} onChange={(e) => setCertAvgDose(e.target.value)} />
            </div>
          </div>
        </FormSection>
        <FormSection title="License & Reference" noSeparator>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>DAE License No.</Label>
              <Input value={certDaeLicense} onChange={(e) => setCertDaeLicense(e.target.value)} placeholder="DAE license number" />
            </div>
            <div className="space-y-2">
              <Label>AERB License No.</Label>
              <Input value={certAerbLicense} onChange={(e) => setCertAerbLicense(e.target.value)} placeholder="AERB license number" />
            </div>
            <div className="space-y-2">
              <Label>CRN</Label>
              <Input value={certCrn} onChange={(e) => setCertCrn(e.target.value)} placeholder="CRN" />
            </div>
            <div className="space-y-2">
              <Label>INW</Label>
              <Input value={certInw} onChange={(e) => setCertInw(e.target.value)} placeholder="INW" />
            </div>
            <div className="space-y-2">
              <Label>JW</Label>
              <Input value={certJw} onChange={(e) => setCertJw(e.target.value)} placeholder="JW" />
            </div>
            <div className="space-y-2">
              <Label>SO Date</Label>
              <Input type="date" value={certSoDate} onChange={(e) => setCertSoDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dosimeter Batch</Label>
              <Input value={certDosimeterBatch} onChange={(e) => setCertDosimeterBatch(e.target.value)} placeholder="Dosimeter batch" />
            </div>
          </div>
        </FormSection>
        <FormSection title="Weights & Serial" noSeparator>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Total Boxes</Label>
              <Input value={certTotalBoxes} onChange={(e) => setCertTotalBoxes(e.target.value)} placeholder="Total boxes" />
            </div>
            <div className="space-y-2">
              <Label>Total Net Weight</Label>
              <Input value={certTotalNetWeight} onChange={(e) => setCertTotalNetWeight(e.target.value)} placeholder="Net weight" />
            </div>
            <div className="space-y-2">
              <Label>Total Gross Weight</Label>
              <Input value={certTotalGrossWeight} onChange={(e) => setCertTotalGrossWeight(e.target.value)} placeholder="Gross weight" />
            </div>
            <div className="space-y-2">
              <Label>Unit Serial From</Label>
              <Input value={certUnitSerialFrom} onChange={(e) => setCertUnitSerialFrom(e.target.value)} placeholder="From" />
            </div>
            <div className="space-y-2">
              <Label>Unit Serial To</Label>
              <Input value={certUnitSerialTo} onChange={(e) => setCertUnitSerialTo(e.target.value)} placeholder="To" />
            </div>
          </div>
        </FormSection>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={cancelCreateCertificate}>
            Cancel
          </Button>
          <Button type="submit">Generate Certificate</Button>
        </div>
      </form>
    </div>
  )

  if (allowed && mode === "create") {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto">
          <div className="w-full h-full">
            <PageHeaderWithBack title="Generate Certificate" noBorder backButton={{ onClick: cancelCreateCertificate }} />
            <div className="space-y-4 px-6 py-4 h-full">
            {certificateCreateForm}
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {!allowed ? (
        <>
          <PageHeader title="Certificate Management" />
          <div className="flex-1 overflow-auto px-6 py-4">
            <p className="text-muted-foreground">You do not have permission to view this module.</p>
          </div>
        </>
      ) : (
        <>
          <PageHeaderWithTabs
            title="Certificate Management"
            tabs={[
              { value: "pending", label: "Pending Generation", badge: pendingForCert.length },
              { value: "certificate", label: "Certificate", badge: certificates.length },
            ]}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
          />
          <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
            {tab === "pending" && (
              <>
                {pendingForCert.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Award className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No pending items</EmptyTitle>
                      <EmptyDescription>Completed GRNs not yet certified will appear here.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>GRN No</TableHead>
                          <TableHead>Sales Order</TableHead>
                          <TableHead>Sub category</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingForCert.map((g) => (
                          <TableRow key={g.grn_id}>
                            <TableCell className="font-medium">{g.grn_number ?? g.grn_id}</TableCell>
                            <TableCell>{g.sales_order_number ?? "—"}</TableCell>
                            <TableCell>{g.product_name ?? g.category_name ?? "—"}</TableCell>
                            <TableCell>{g.customer_name ?? "—"}</TableCell>
                            <TableCell>{g.received_quantity ?? "—"} {g.unit ?? ""}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openGenerate(g)}>
                                Generate Certificate
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

            {tab === "certificate" && (
              <>
                {certificates.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Award className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>No certificates</EmptyTitle>
                      <EmptyDescription>Generate certificates from the Pending Generation tab.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search certificates"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {filteredCerts.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            exportCertificatesToCsv(
                              filteredCerts.map((c) => ({
                                "Certificate No": c.certificate_no ?? c.certificate_id,
                                "Sales Order": c.sales_order_number ?? c.sales_order_id,
                                "Product Category": c.product_category ?? "",
                                "Sub category": c.product_name ?? "",
                                Customer: c.customer_name ?? "",
                                Quantity: c.quantity ?? "",
                                Units: c.units ?? "",
                                Status: c.status ?? "",
                              })),
                              `certificates-${new Date().toISOString().slice(0, 10)}.csv`
                            )
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      )}
                    </div>
                    {filteredCerts.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Award className="size-4" />
                          </EmptyMedia>
                          <EmptyTitle>No matching certificates</EmptyTitle>
                          <EmptyDescription>Try a different search term.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Certificate No</TableHead>
                              <TableHead>Sales Order</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCerts.map((c) => (
                              <TableRow key={c.certificate_id}>
                                <TableCell className="font-medium">{c.certificate_no ?? c.certificate_id}</TableCell>
                                <TableCell>{c.sales_order_number ?? c.sales_order_id}</TableCell>
                                <TableCell>{c.product_category ?? "—"}</TableCell>
                                <TableCell>{c.customer_name ?? "—"}</TableCell>
                                <TableCell>{c.quantity ?? "—"} {c.units ?? ""}</TableCell>
                                <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" title="View" onClick={() => openView(c)}><Eye className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" title="Print" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" title="Download" onClick={() => toast.info("Download: use Print or Export.")}><Download className="h-4 w-4" /></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      <Dialog open={mode === "view" && viewId !== null} onOpenChange={(open) => !open && (setMode(null), setViewId(null))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
          </DialogHeader>
          {viewCert && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><strong>Certificate No.:</strong> {viewCert.certificate_no ?? viewCert.certificate_id}</p>
                <p><strong>Sales Order:</strong> {viewCert.sales_order_number ?? viewCert.sales_order_id}</p>
                <p><strong>Product Category:</strong> {viewCert.product_category ?? "—"}</p>
                <p><strong>Sub category:</strong> {viewCert.product_name ?? "—"}</p>
                <p><strong>Customer:</strong> {viewCert.customer_name ?? "—"}</p>
                <p><strong>Quantity:</strong> {viewCert.quantity ?? "—"} {viewCert.units ?? ""}</p>
                <p><strong>Status:</strong> <Badge variant="secondary">{viewCert.status}</Badge></p>
                <p><strong>Batch/Lot No.:</strong> {viewCert.batch_lot_no ?? "—"}</p>
                <p><strong>Irradiation date:</strong> {viewCert.irradiation_complete_date ?? "—"}</p>
                <p><strong>Minimum dose:</strong> {viewCert.minimum_dose ?? "—"}</p>
                <p><strong>Average dose:</strong> {viewCert.average_dose ?? "—"}</p>
                <p><strong>DAE License No.:</strong> {viewCert.dae_license_no ?? "—"}</p>
                <p><strong>AERB License No.:</strong> {viewCert.aerb_license_no ?? "—"}</p>
                <p><strong>CRN:</strong> {viewCert.crn ?? "—"}</p>
                <p><strong>INW:</strong> {viewCert.inw ?? "—"}</p>
                <p><strong>JW:</strong> {viewCert.jw ?? "—"}</p>
                <p><strong>SO Date:</strong> {viewCert.so_date ?? "—"}</p>
                <p><strong>Dosimeter Batch:</strong> {viewCert.dosimeter_batch ?? "—"}</p>
                <p><strong>Total Boxes:</strong> {viewCert.total_boxes ?? "—"}</p>
                <p><strong>Total Net Weight:</strong> {viewCert.total_net_weight ?? "—"}</p>
                <p><strong>Total Gross Weight:</strong> {viewCert.total_gross_weight ?? "—"}</p>
                <p><strong>Unit Serial From:</strong> {viewCert.unit_serial_from ?? "—"}</p>
                <p><strong>Unit Serial To:</strong> {viewCert.unit_serial_to ?? "—"}</p>
                <p><strong>Sticker range:</strong> {viewCert.sticker_range_start ?? "—"} – {viewCert.sticker_range_end ?? "—"}</p>
              </div>
              {viewCert.product_rows && viewCert.product_rows.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Sub category rows</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Batch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewCert.product_rows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.sr_no}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>{row.quantity}</TableCell>
                          <TableCell>{row.batch}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
                <Button variant="outline" onClick={() => toast.info("Download: use Print or Export from list.")}><Download className="h-4 w-4 mr-2" />Download</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
