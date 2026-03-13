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
import { FormSection } from "@/components/patterns/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useData, canAccess } from "@/context/DataContext"
import type { Customer } from "@/lib/gaama-types"
import { Plus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ModalMode = "create" | "edit" | "view" | null

const defaultForm: Omit<Customer, "customer_id" | "created_at" | "updated_at"> = {
  customer_name: "",
  company_name: "",
  email: "",
  phone: "",
  billing_address: "",
  shipping_addresses: [],
  gst_number: "",
  status: "active",
}

export function CustomersPage() {
  const data = useData()
  const [mode, setMode] = React.useState<ModalMode>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState(defaultForm)

  const allowed = canAccess(data.currentRole, "customers")
  const customers = data.customers

  const openCreate = () => {
    setForm(defaultForm)
    setSelectedId(null)
    setMode("create")
  }

  const openEdit = (c: Customer) => {
    setForm({
      customer_name: c.customer_name,
      company_name: c.company_name,
      email: c.email,
      phone: c.phone,
      billing_address: c.billing_address,
      shipping_addresses: c.shipping_addresses ?? [],
      gst_number: c.gst_number,
      status: c.status,
    })
    setSelectedId(c.customer_id)
    setMode("edit")
  }

  const openView = (c: Customer) => {
    setForm({
      customer_name: c.customer_name,
      company_name: c.company_name,
      email: c.email,
      phone: c.phone,
      billing_address: c.billing_address,
      shipping_addresses: c.shipping_addresses ?? [],
      gst_number: c.gst_number,
      status: c.status,
    })
    setSelectedId(c.customer_id)
    setMode("view")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === "create") {
      data.addCustomer(form)
      setMode(null)
    } else if (mode === "edit" && selectedId) {
      data.updateCustomer(selectedId, form)
      setMode(null)
    }
  }

  const isView = mode === "view"

  return (
    <PageShell>
      <PageHeader
        title="Customer Master"
        actions={
          allowed ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-auto px-6 py-4">
        {!allowed ? (
          <p className="text-muted-foreground">You do not have permission to view this module.</p>
        ) : customers.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No customers yet</EmptyTitle>
              <EmptyDescription>
                Create a customer to generate sales orders.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={openCreate}>Add Customer</Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.customer_id}>
                    <TableCell className="font-medium">{c.customer_name}</TableCell>
                    <TableCell>{c.company_name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openView(c)}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Customer" : mode === "edit" ? "Edit Customer" : "Customer Details"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FormSection title="Basic info" noSeparator>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={form.customer_name}
                      onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                      readOnly={isView}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={form.company_name}
                      onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                      readOnly={isView}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      readOnly={isView}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      readOnly={isView}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Input
                    value={form.billing_address}
                    onChange={(e) => setForm((f) => ({ ...f, billing_address: e.target.value }))}
                    readOnly={isView}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    value={form.gst_number}
                    onChange={(e) => setForm((f) => ({ ...f, gst_number: e.target.value }))}
                    readOnly={isView}
                  />
                </div>
                {!isView && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v: "active" | "inactive") =>
                        setForm((f) => ({ ...f, status: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {isView && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Badge variant={form.status === "active" ? "default" : "secondary"}>
                      {form.status}
                    </Badge>
                  </div>
                )}
              </div>
            </FormSection>
            {!isView && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {mode === "create" ? "Create" : "Save"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
