import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  FolderTree,
  IndianRupee,
  ShoppingCart,
  PackageCheck,
  GitBranch,
  FileText,
  Truck,
  Receipt,
  Award,
} from "lucide-react"

export interface SidebarItem {
  label: string
  icon: LucideIcon
  href?: string
  badge?: string
  roles?: string[]
  disabled?: boolean
  children?: SidebarItem[]
}

export interface SidebarGroup {
  label: string
  items: SidebarItem[]
  roles?: string[]
}

/** Gaama ERP navigation per PRD §2 – RBAC via roles */
export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    ],
  },
  {
    label: "Masters",
    items: [
      { label: "Customer Master", icon: Users, href: "/customers", roles: ["admin", "sales"] },
      { label: "Category Master", icon: FolderTree, href: "/categories", roles: ["admin", "sales"] },
      { label: "Rate Master", icon: IndianRupee, href: "/rates", roles: ["admin", "sales"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Sales Orders", icon: ShoppingCart, href: "/sales-orders", roles: ["admin", "sales"] },
      { label: "GRN", icon: PackageCheck, href: "/grn", roles: ["admin", "warehouse"] },
      { label: "Process Tracking", icon: GitBranch, href: "/process-tracking", roles: ["admin", "operations"] },
      { label: "Challan Management", icon: FileText, href: "/challan", roles: ["admin", "operations", "sales"] },
      { label: "Gate Pass", icon: Truck, href: "/gate-pass", roles: ["admin", "operations", "sales"] },
    ],
  },
  {
    label: "Finance & Compliance",
    items: [
      { label: "Invoice Management", icon: Receipt, href: "/invoices", roles: ["admin", "finance"] },
      { label: "Certificate Management", icon: Award, href: "/certificates", roles: ["admin", "compliance"] },
    ],
  },
]

export const SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_GROUPS.flatMap((g) =>
  g.items.flatMap((item) => [item, ...(item.children ?? [])])
)

export function filterSidebarGroupsByRole(
  groups: SidebarGroup[],
  userRole?: string
): SidebarGroup[] {
  if (!userRole) return groups
  return groups
    .filter((group) => {
      if (!group.roles || group.roles.length === 0) return true
      return group.roles.includes(userRole)
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true
        return item.roles.includes(userRole)
      }),
    }))
    .filter((group) => group.items.length > 0)
}

export function filterSidebarItemsByRole(items: SidebarItem[], userRole?: string): SidebarItem[] {
  if (!userRole) return items
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.includes(userRole)
  })
}
