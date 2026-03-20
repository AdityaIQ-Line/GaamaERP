from pathlib import Path

p = Path("src/pages/gaama/GRNPage.tsx")
s = p.read_text(encoding="utf-8")

ret = s.find("  return (\n    <PageShell>")
if ret < 0:
    raise SystemExit("return not found")

d_open = s.find("<Dialog open={mode !== null}", ret)
if d_open < 0:
    raise SystemExit("dialog not found")

form_start = s.find("<form onSubmit={mode ===", d_open)
form_end = s.find("</form>", form_start) + len("</form>")
form_block = s[form_start:form_end]

early = (
    "\n  const grnEditorForm = (\n"
    + form_block
    + "\n  )\n\n"
    + """  if (allowed && mode === "create") {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <FullPageHeader title="Create GRN" onBack={() => setMode(null)} />
          <div className="rounded-lg border border-border bg-card p-6">
            {grnEditorForm}
          </div>
        </div>
        <AlertDialog open={sendForProcessingId !== null} onOpenChange={(open) => !open && setSendForProcessingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send for Processing</AlertDialogTitle>
              <AlertDialogDescription>
                Send this GRN to Process Tracking? Status will be set to In Progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSendForProcessingConfirm}>Send</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Dialog open={printStickerId !== null} onOpenChange={(open) => !open && setPrintStickerId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Print Sticker</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Print sticker for GRN: {printStickerId ? data.getGRN(printStickerId)?.grn_number ?? printStickerId : ""}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrintStickerId(null)}>Cancel</Button>
              <Button onClick={() => { window.print(); setPrintStickerId(null); }}><Printer className="h-4 w-4 mr-2" />Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    )
  }

"""
)

d_end = s.find("</Dialog>", d_open) + len("</Dialog>")
new_dialog = """      <Dialog open={mode === "edit" || mode === "view"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit GRN" : "GRN Details"}
            </DialogTitle>
          </DialogHeader>
          {grnEditorForm}
        </DialogContent>
      </Dialog>"""

new_s = s[:ret] + early + s[ret:d_open] + new_dialog + s[d_end:]

if "FullPageHeader" not in new_s:
    new_s = new_s.replace(
        'import { toast } from "sonner"',
        'import { toast } from "sonner"\nimport { FullPageHeader } from "@/components/blocks/full-page-header"',
    )

p.write_text(new_s, encoding="utf-8")
print("patched grn ok", len(new_s))
