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
import type { GatePass } from "@/lib/gaama-types"
import { Plus, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ModalMode = "create" | "view" | null

export function GatePassPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [form, setForm] = React.useState({
    challan_id: "",
    vehicle_number: "",
    security_approval: false,
  })

  const allowed = canAccess(data.currentRole, "gate-pass")
  const gatePasses = data.gatePasses

  const openCreate = () => {
    setForm({
      challan_id: data.challans[0]?.challan_id ?? "",
      vehicle_number: "",
      security_approval: false,
    })
    setMode("create")
  }

  const openView = (g: GatePass) => {
    setForm({
      challan_id: g.challan_id,
      vehicle_number: g.vehicle_number,
      security_approval: g.security_approval,
    })
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    data.addGatePass({
      ...form,
      timestamp: new Date().toISOString(),
    })
    setMode(null)
  }

  return (
    <PageShell>
      <PageHeader
        title="Gate Pass"
        actions={allowed ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Gate Pass</Button> : null}
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : gatePasses.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Truck className="size-4" /></EmptyMedia>
              <EmptyTitle>No gate passes</EmptyTitle>
              <EmptyDescription>Create gate pass for challan dispatch.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Create Gate Pass</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gate Pass ID</TableHead>
                  <TableHead>Challan</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Security Approval</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gatePasses.map((g) => (
                  <TableRow key={g.gatepass_id}>
                    <TableCell className="font-medium">{g.gatepass_id}</TableCell>
                    <TableCell>{g.challan_id}</TableCell>
                    <TableCell>{g.vehicle_number}</TableCell>
                    <TableCell><Badge variant={g.security_approval ? "default" : "secondary"}>{g.security_approval ? "Yes" : "No"}</Badge></TableCell>
                    <TableCell>{new Date(g.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(g)}>View</Button>
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
            <DialogTitle>{mode === "create" ? "Create Gate Pass" : "Gate Pass Details"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Details" noSeparator>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Challan</Label>
                  <Select value={form.challan_id} onValueChange={(v) => setForm((f) => ({ ...f, challan_id: v }))} disabled={mode === "view"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {data.challans.map((c) => (
                        <SelectItem key={c.challan_id} value={c.challan_id}>{c.challan_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input value={form.vehicle_number} onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value }))} readOnly={mode === "view"} />
                </div>
                {mode === "view" ? (
                  <div className="space-y-2">
                    <Label>Security Approval</Label>
                    <Badge variant={form.security_approval ? "default" : "secondary"}>{form.security_approval ? "Yes" : "No"}</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="security"
                      checked={form.security_approval}
                      onChange={(e) => setForm((f) => ({ ...f, security_approval: e.target.checked }))}
                    />
                    <Label htmlFor="security">Security Approval</Label>
                  </div>
                )}
              </div>
            </FormSection>
            {mode === "create" && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="submit">Create Gate Pass</Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
