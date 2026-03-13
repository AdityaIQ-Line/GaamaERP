import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/context/DataContext"
import { useBasePath } from "@/context/BasePathContext"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import {
  Users,
  FolderTree,
  ShoppingCart,
  PackageCheck,
  Receipt,
  Award,
  ArrowRight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const metrics = [
  { key: "customers", label: "Customers", value: (d: ReturnType<typeof useData>) => d.customers.length, href: "/customers", icon: Users },
  { key: "categories", label: "Categories", value: (d: ReturnType<typeof useData>) => d.categories.length, href: "/categories", icon: FolderTree },
  { key: "orders", label: "Sales Orders", value: (d: ReturnType<typeof useData>) => d.salesOrders.length, href: "/sales-orders", icon: ShoppingCart },
  { key: "grn", label: "GRN", value: (d: ReturnType<typeof useData>) => d.grns.length, href: "/grn", icon: PackageCheck },
  { key: "invoices", label: "Invoices", value: (d: ReturnType<typeof useData>) => d.invoices.length, href: "/invoices", icon: Receipt },
  { key: "certificates", label: "Certificates", value: (d: ReturnType<typeof useData>) => d.certificates.length, href: "/certificates", icon: Award },
]

export function DashboardPage() {
  const data = useData()
  const basePath = useBasePath()

  return (
    <PageShell>
      <PageHeader title="Dashboard" />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-6xl px-6 py-6 space-y-6">
          <p className="text-muted-foreground">
            Single source of truth for orders, inventory, invoicing, and certifications.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => {
              const Icon = m.icon
              const count = m.value(data)
              return (
                <Card key={m.key}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {m.label}
                    </CardTitle>
                    <Icon strokeWidth={ICON_STROKE_WIDTH} className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <Button variant="ghost" size="sm" className="mt-2 px-0" asChild>
                      <Link to={basePath + m.href}>
                        View
                        <ArrowRight strokeWidth={ICON_STROKE_WIDTH} className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Process flow</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Customer → Sales Order → GRN → Process Tracking → Challan → Gate Pass → Invoice → Certificate
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  )
}
