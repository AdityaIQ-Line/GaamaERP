from pathlib import Path

p = Path("src/pages/gaama/SalesOrdersPage.tsx")
s = p.read_text(encoding="utf-8")
anchor = "        : 'Invoice will use \"By Carton/Bag\" pricing from Rate Master.'"
idx = s.find(anchor)
if idx < 0:
    raise SystemExit("anchor1")
idx_end = idx + len(anchor)
ret = s.find("  return (", idx_end)
if ret < 0:
    raise SystemExit("return")
d_open = s.find("<Dialog open={mode !== null}", ret)
div_start = s.find('<div className="space-y-6">', d_open)
dc = s.find("</DialogContent>", div_start)
block = s[div_start:dc]
if not block.rstrip().endswith("</div>"):
    li = block.rfind("</div>")
    block = block[: li + 6]
    dc = div_start + len(block)

early = (
    "\n\n  const salesOrderEditorContent = (\n"
    + block
    + "\n  )\n\n"
    + """  if (allowed && mode === "create") {
    return (
      <PageShell>
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <FullPageHeader title="Create Sales Order" onBack={() => setMode(null)} />
          {salesOrderEditorContent}
        </div>
        <AlertDialog open={approveTargetId !== null} onOpenChange={(open) => !open && setApproveTargetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve order</AlertDialogTitle>
              <AlertDialogDescription>
                Approve this sales order? It will be available for GRN creation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApproveConfirm}>Approve</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageShell>
    )
  }

"""
)

d_end = s.find("</Dialog>", d_open) + len("</Dialog>")
new_dialog = """      <Dialog open={mode === "edit" || mode === "view"} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] gap-0 overflow-y-auto border-border p-6 sm:p-6">
          <DialogHeader className="space-y-0 pb-6 text-left">
            <DialogTitle className="text-lg font-semibold">
              {mode === "edit" ? "Edit Sales Order" : "Order Details"}
            </DialogTitle>
          </DialogHeader>
          {salesOrderEditorContent}
        </DialogContent>
      </Dialog>"""

new_s = s[:idx_end] + early + s[ret:d_open] + new_dialog + s[d_end:]
p.write_text(new_s, encoding="utf-8")
print("patched", len(s), "->", len(new_s))
