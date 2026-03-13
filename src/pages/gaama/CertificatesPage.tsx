import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { Certificate } from "@/lib/gaama-types"
import { Plus, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ModalMode = "create" | "view" | null

export function CertificatesPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [form, setForm] = React.useState({
    sales_order_id: "",
    issued_date: new Date().toISOString().slice(0, 10),
    certificate_type: "Material Test Certificate",
    file_url: "",
    status: "draft" as Certificate["status"],
  })

  const allowed = canAccess(data.currentRole, "certificates")
  const certificates = data.certificates

  const openCreate = () => {
    setForm({
      sales_order_id: data.salesOrders[0]?.sales_order_id ?? "",
      issued_date: new Date().toISOString().slice(0, 10),
      certificate_type: "Material Test Certificate",
      file_url: "",
      status: "draft",
    })
    setMode("create")
  }

  const openView = (c: Certificate) => {
    setForm({
      sales_order_id: c.sales_order_id,
      issued_date: c.issued_date.slice(0, 10),
      certificate_type: c.certificate_type,
      file_url: c.file_url,
      status: c.status,
    })
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    data.addCertificate({
      ...form,
      issued_date: new Date(form.issued_date).toISOString(),
    })
    setMode(null)
  }

  return (
    <PageShell>
      <PageHeader
        title="Certificate Management"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Generate Certificate</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : certificates.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Award className="size-4" /></EmptyMedia>
              <EmptyTitle>No certificates</EmptyTitle>
              <EmptyDescription>Generate certificates for documentation.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Generate Certificate</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Sales Order</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((c) => (
                  <TableRow key={c.certificate_id}>
                    <TableCell className="font-medium">{c.certificate_id}</TableCell>
                    <TableCell>{c.sales_order_id}</TableCell>
                    <TableCell>{c.issued_date.slice(0, 10)}</TableCell>
                    <TableCell>{c.certificate_type}</TableCell>
                    <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(c)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Generate Certificate" : "Certificate Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Sales Order</Label>
                  <Select value={form.sales_order_id} onValueChange={(v) => setForm((f) => ({ ...f, sales_order_id: v }))} disabled={mode === "view"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.salesOrders.map((o) => (
                        <SelectItem key={o.sales_order_id} value={o.sales_order_id}>{o.sales_order_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Issued Date</Label>
                  <Input type="date" value={form.issued_date} onChange={(e) => setForm((f) => ({ ...f, issued_date: e.target.value }))} readOnly={mode === "view"} />
                </div>
                <div className="space-y-2">
                  <Label>Certificate Type</Label>
                  <Input value={form.certificate_type} onChange={(e) => setForm((f) => ({ ...f, certificate_type: e.target.value }))} readOnly={mode === "view"} />
                </div>
                <div className="space-y-2">
                  <Label>File URL</Label>
                  <Input value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} placeholder="/documents/..." readOnly={mode === "view"} />
                </div>
                {mode === "view" ? (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Badge variant="secondary">{form.status}</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v: Certificate["status"]) => setForm((f) => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </FormSection>
            {mode === "create" && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Generate Certificate</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
