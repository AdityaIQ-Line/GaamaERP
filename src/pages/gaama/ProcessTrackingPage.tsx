import * as React from "react"
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { ProcessStage } from "@/lib/gaama-types"
import { GitBranch } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const STAGES: ProcessStage[] = ["received", "processing", "quality_check", "completed"]

export function ProcessTrackingPage() {
  const data = useData()
  const [viewId, setViewId] = React.useState<string | null>(null)
  const [createOrderId, setCreateOrderId] = React.useState("")

  const allowed = canAccess(data.currentRole, "process-tracking")
  const trackings = data.processTrackings

  const openCreate = () => {
    setCreateOrderId(data.salesOrders[0]?.sales_order_id ?? "")
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createOrderId) return
    const existing = data.getProcessTrackingByOrderId(createOrderId)
    if (existing) {
      setViewId(existing.id)
      setCreateOrderId("")
      return
    }
    data.addProcessTracking({
      sales_order_id: createOrderId,
      current_stage: "received",
      updated_at: new Date().toISOString(),
    })
    setCreateOrderId("")
  }

  const updateStage = (id: string, stage: ProcessStage) => {
    data.updateProcessTracking(id, { current_stage: stage })
  }

  return (
    <PageShell>
      <PageHeader
        title="Process Tracking"
        actions={
          allowed ? (
            <Button onClick={openCreate}>Track Order</Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : trackings.length === 0 && !createOrderId ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><GitBranch className="size-4" /></EmptyMedia>
              <EmptyTitle>No process tracking</EmptyTitle>
              <EmptyDescription>Track order processing stages: Received → Processing → Quality Check → Completed.</EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Track Order</Button>
          </Empty>
        ) : (
          <>
            {createOrderId && (
              <Dialog open={!!createOrderId} onOpenChange={(open) => !open && setCreateOrderId("")}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Track Sales Order</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreate}>
                    <Select value={createOrderId} onValueChange={setCreateOrderId}>
                      <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
                      <SelectContent>
                        {data.salesOrders.map((o) => (
                          <SelectItem key={o.sales_order_id} value={o.sales_order_id}>
                            {o.sales_order_id} – {data.getCustomer(o.customer_id)?.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => setCreateOrderId("")}>Cancel</Button>
                      <Button type="submit">Start Tracking</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Current Stage</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackings.map((pt) => (
                    <TableRow key={pt.id}>
                      <TableCell className="font-medium">{pt.sales_order_id}</TableCell>
                      <TableCell>
                        <Select
                          value={pt.current_stage}
                          onValueChange={(v: ProcessStage) => updateStage(pt.id, v)}
                          disabled={!allowed}
                        >
                          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(pt.updated_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewId(pt.id)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {viewId && (() => {
        const pt = trackings.find((p) => p.id === viewId)
        if (!pt) return null
        return (
          <Dialog open onOpenChange={(open) => !open && setViewId(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Process Tracking</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <p><strong>Order:</strong> {pt.sales_order_id}</p>
                <p><strong>Stage:</strong> <Badge>{pt.current_stage}</Badge></p>
                <p><strong>Updated:</strong> {new Date(pt.updated_at).toLocaleString()}</p>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </PageShell>
  )
}
