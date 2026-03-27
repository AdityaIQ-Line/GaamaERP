import * as React from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn, latestOfDates } from "@/lib/utils"
import type { GRN, SalesOrder } from "@/lib/gaama-types"
import { CircleCheck, ClipboardList, Printer, X } from "lucide-react"

function formatStickerSerial(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return Math.max(0, Math.floor(n)).toString().padStart(6, "0")
}

function todayDdMmYyyy(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function isoToDdMmYyyy(iso: string | undefined): string | null {
  if (!iso) return null
  const part = iso.slice(0, 10)
  const m = part.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return `${m[3]}/${m[2]}/${m[1]}`
}

function isValidDdMmYyyy(s: string): boolean {
  const t = s.trim()
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return false
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false
  const dt = new Date(y, mo - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
}

/** Whole units (cartons) → sticker count for this GRN. */
function stickerCountForGrn(g: GRN): number {
  const n = parseFloat(String(g.received_quantity ?? "0"))
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.max(0, Math.floor(n))
}

type StickerWindow = {
  soStart: number
  soEnd: number
  totalSOStickers: number
  startSerial: number
  endSerial: number
  nextSerial: number
  exceedsPool: boolean
}

function computeStickerWindow(
  grn: GRN,
  salesOrder: SalesOrder | undefined,
  allGrns: GRN[]
): StickerWindow | null {
  const start = salesOrder?.sticker_range_start
  const end = salesOrder?.sticker_range_end
  if (start == null || end == null || end < start) return null

  const soStart = start
  const soEnd = end
  const totalSOStickers = soEnd - soStart + 1
  const siblings = allGrns
    .filter((g) => g.sales_order_id && g.sales_order_id === grn.sales_order_id)
    .sort((a, b) => {
      const ta = latestOfDates(a.received_date, a.created_at)
      const tb = latestOfDates(b.received_date, b.created_at)
      if (ta !== tb) return ta - tb
      return a.grn_id.localeCompare(b.grn_id)
    })

  let usedBefore = 0
  for (const g of siblings) {
    if (g.grn_id === grn.grn_id) break
    usedBefore += stickerCountForGrn(g)
  }

  const count = stickerCountForGrn(grn)
  const startSerial = soStart + usedBefore
  const endSerial = count > 0 ? startSerial + count - 1 : startSerial - 1
  const nextSerial = count > 0 ? endSerial + 1 : startSerial
  const exceedsPool = count > 0 && endSerial > soEnd

  return {
    soStart,
    soEnd,
    totalSOStickers,
    startSerial,
    endSerial,
    nextSerial,
    exceedsPool,
  }
}

function unitLabelPlural(unit: string | undefined, n: number): string {
  const u = (unit ?? "carton").trim() || "carton"
  if (n === 1) return u
  if (u.endsWith("s")) return u
  return `${u}s`
}

export type PrintStickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  grn: GRN | undefined
  salesOrder: SalesOrder | undefined
  siblingGrns: GRN[]
}

export function PrintStickerDialog({
  open,
  onOpenChange,
  grn,
  salesOrder,
  siblingGrns,
}: PrintStickerDialogProps) {
  const [processingDate, setProcessingDate] = React.useState("")

  React.useEffect(() => {
    if (!open || !grn) return
    setProcessingDate(isoToDdMmYyyy(grn.received_date) ?? todayDdMmYyyy())
  }, [open, grn?.grn_id, grn?.received_date])

  const stickerCount = grn ? stickerCountForGrn(grn) : 0
  const serialWindow = grn ? computeStickerWindow(grn, salesOrder, siblingGrns) : null

  const soNumber =
    salesOrder?.sales_order_number ?? salesOrder?.order_number ?? grn?.sales_order_number ?? "—"
  const unitPlural = unitLabelPlural(grn?.unit, stickerCount)

  const handlePrint = () => {
    if (!grn) return
    if (stickerCount <= 0) return
    if (!isValidDdMmYyyy(processingDate)) {
      alert("Enter a valid Date of Processing in DD/MM/YYYY format.")
      return
    }
    if (serialWindow?.exceedsPool) {
      alert("Sticker range exceeds the sales order pool. Adjust quantities or SO sticker range.")
      return
    }
    window.print()
    onOpenChange(false)
  }

  if (!grn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-md">
          <p className="text-sm text-muted-foreground">No GRN selected.</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-h-[min(90vh,72rem)] w-[calc(100vw-2rem)] max-w-2xl gap-0 overflow-y-auto rounded-md border border-border p-0 shadow-lg sm:max-w-2xl"
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-0 px-6 pb-0 pt-8 text-left">
          <DialogTitle className="text-lg font-semibold text-foreground">Print Sticker</DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-md">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-8 pt-4">
          {/* Sales order sticker range — card pattern aligned with GRN modules */}
          <div className="rounded-md border border-primary/20 bg-gradient-to-br from-primary/10 via-muted to-muted/80 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Sales Order Sticker Range</p>
                <p className="text-xs text-muted-foreground">{soNumber}</p>
              </div>
              <div className="text-right">
                {serialWindow ? (
                  <>
                    <p className="text-2xl font-bold tabular-nums text-primary">
                      {formatStickerSerial(serialWindow.soStart)} – {formatStickerSerial(serialWindow.soEnd)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total: {serialWindow.totalSOStickers} stickers</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No sticker range on sales order</p>
                )}
              </div>
            </div>
          </div>

          {/* Sticker preview (compact type = text-xs for label-sized mockup) */}
          <div className="rounded-md border border-border bg-muted/50 py-8">
            <div className="mx-auto w-full max-w-[320px] px-4">
              <div className="rounded-md border-2 border-border bg-card p-6 shadow-sm">
                <div className="space-y-1 border-b border-border pb-3 text-center">
                  <p className="text-sm font-bold text-primary">GAMMA RADIATION FACILITY</p>
                  <p className="text-xs font-bold text-primary">LUCKNOW</p>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    Q
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {grn.customer_name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">(Approved by A.E.R.B.)</p>
                  </div>
                  <CircleCheck className="h-8 w-8 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                </div>

                <div className="mt-4 space-y-2 text-xs leading-snug">
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 font-medium text-foreground">Customer :</span>
                    <span className="truncate text-right font-medium text-primary">
                      {grn.customer_name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 font-medium text-foreground">Product :</span>
                    <span className="truncate text-right font-medium text-primary">
                      {grn.product_name ?? grn.category_name ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 font-medium text-foreground">BIN ID :</span>
                    <span className="truncate text-right font-medium text-primary">{soNumber}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 font-medium text-foreground">Serial No. :</span>
                    <span className="font-semibold text-primary tabular-nums">
                      {serialWindow && stickerCount > 0 ? formatStickerSerial(serialWindow.startSerial) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 font-medium text-foreground">Date of Processing :</span>
                    <span className="font-medium text-primary tabular-nums">
                      {processingDate || "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs leading-snug text-foreground">
                  <p className="text-muted-foreground">Processed by Gamma radiation under</p>
                  <p className="text-muted-foreground">License No:</p>
                  <p className="font-semibold text-primary">25-GRAPFGLC -1374915</p>
                  <p className="font-semibold text-primary">Purpose - Processing identification</p>
                </div>

                <div className="mt-4 flex justify-end">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground"
                    aria-hidden
                  >
                    QR
                  </div>
                </div>

                <div className="mt-4 space-y-1 border-t border-border pt-3 text-center text-xs leading-snug text-muted-foreground">
                  <p>C-7, Amausi Industrial Area, Nadarganj,</p>
                  <p>Lucknow, UP- 226008 INDIA</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold text-primary">
            {stickerCount} sticker{stickerCount === 1 ? "" : "s"} will be printed based on {stickerCount}{" "}
            {unitPlural}
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
              Date of Processing <span className="text-black">*</span>
            </Label>
            <Input
              value={processingDate}
              onChange={(e) => setProcessingDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="h-9 max-w-48 rounded-md border border-input bg-background"
            />
            <p className="text-xs text-muted-foreground">Format: DD/MM/YYYY (e.g., 17/02/2026)</p>
          </div>

          <div className="space-y-3 rounded-md border border-primary/20 bg-primary/5 p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Sticker Serial Numbers for This GRN
            </p>
            {serialWindow && stickerCount > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Starting Number:</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatStickerSerial(serialWindow.startSerial)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Ending Number:</span>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatStickerSerial(serialWindow.endSerial)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Range:</span>
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {formatStickerSerial(serialWindow.startSerial)} to {formatStickerSerial(serialWindow.endSerial)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-primary/15 pt-3">
                  <span className="text-sm text-muted-foreground">Next Available:</span>
                  <span className="text-base font-semibold tabular-nums text-primary">
                    {formatStickerSerial(serialWindow.nextSerial)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {stickerCount <= 0
                  ? "Set a received quantity on the GRN to compute sticker numbers."
                  : "Map a sticker range on the sales order to show serials."}
              </p>
            )}
            {serialWindow?.exceedsPool ? (
              <p className="text-sm font-medium text-destructive">
                Allocated range extends past the sales order sticker pool.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" className="h-9 rounded-md shadow-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-9 gap-2 rounded-md px-8 font-medium shadow-none"
              disabled={stickerCount <= 0}
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Print {stickerCount} Sticker{stickerCount === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
