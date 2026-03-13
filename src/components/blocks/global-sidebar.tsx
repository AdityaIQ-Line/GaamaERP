import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { SIDEBAR_GROUPS, filterSidebarGroupsByRole } from "@/lib/sidebar-config"
import { isActiveRoute } from "@/lib/navigation"
import { useData } from "@/context/DataContext"
import { useBasePath } from "@/context/BasePathContext"
import { ChevronRight, ChevronsUpDown, Check, Plus } from "lucide-react"
import LogoIcon from "@/assets/Logo.svg?react"

// ─── Tenant types ─────────────────────────────────────────────────────────────

/**
 * Represents a tenant / workspace that can be selected in the sidebar header.
 * Pass a list of tenants to enable the switcher dropdown.
 */
export interface Tenant {
  id: string
  name: string
  /** Optional plan label shown in the switcher list (e.g. "Free", "Pro") */
  plan?: string
  /** Optional logo override — defaults to the app LogoIcon */
  logo?: React.ReactNode
}

// ─── Tenant Switcher ──────────────────────────────────────────────────────────

function TenantSwitcher({
  tenants = [],
  currentTenant,
  onTenantChange,
}: {
  tenants?: Tenant[]
  currentTenant?: Tenant
  onTenantChange?: (tenant: Tenant) => void
}) {
  const basePath = useBasePath()
  const homeTo = basePath || "/"
  const canSwitch = tenants.length > 1
  const active = currentTenant ?? { id: "default", name: "IQLine Inc" }

  /** Inner layout — shared between the plain link and the dropdown trigger */
  const innerContent = (
    <div className="flex items-center h-10 gap-2 justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 overflow-hidden">
      {/* Tenant logo / icon */}
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        {active.logo ?? <LogoIcon className="h-4 w-auto" />}
      </div>

      {/* Tenant name + plan — hidden when sidebar is icon-collapsed */}
      <div className="grid flex-1 text-left leading-tight transition-[opacity,max-width] duration-200 ease-in-out opacity-100 max-w-[200px] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-semibold">{active.name}</span>
        {active.plan && (
          <span className="truncate text-xs text-muted-foreground">{active.plan}</span>
        )}
      </div>

      {/* Expand indicator — only visible when there are multiple tenants */}
      {canSwitch && (
        <ChevronsUpDown
          strokeWidth={ICON_STROKE_WIDTH}
          className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden"
        />
      )}
    </div>
  )

  // Single tenant (or no tenants) — just a logo link, no dropdown
  if (!canSwitch) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="!overflow-visible [&_svg]:!h-5 [&_svg]:!w-auto h-10"
            asChild
            tooltip={active.name}
          >
            <Link to={homeTo}>{innerContent}</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Multiple tenants — show dropdown switcher
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="!overflow-visible [&_svg]:!h-5 [&_svg]:!w-auto h-10 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={active.name}
            >
              {innerContent}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 pb-1">
              Workspaces
            </DropdownMenuLabel>

            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => onTenantChange?.(tenant)}
                className="gap-2 p-2 cursor-pointer"
              >
                {/* Tenant mini-logo */}
                <div className="flex size-6 items-center justify-center rounded-sm border bg-muted">
                  {tenant.logo ?? <LogoIcon className="h-3.5 w-auto" />}
                </div>

                <span className="flex-1 truncate text-sm">{tenant.name}</span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tenant.plan && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      {tenant.plan}
                    </Badge>
                  )}
                  {tenant.id === active.id && (
                    <Check strokeWidth={ICON_STROKE_WIDTH} className="size-3.5 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 p-2 text-muted-foreground cursor-pointer">
              <div className="flex size-6 items-center justify-center rounded-sm border border-dashed">
                <Plus strokeWidth={ICON_STROKE_WIDTH} className="size-3.5" />
              </div>
              <span className="text-sm">Add workspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

interface GlobalSidebarProps {
  /** Fully override the sidebar header (logo / tenant area) */
  sidebarHeader?: React.ReactNode
  /** List of available tenants — enables the switcher when length > 1 */
  tenants?: Tenant[]
  /** Currently active tenant */
  currentTenant?: Tenant
  /** Called when the user picks a different tenant */
  onTenantChange?: (tenant: Tenant) => void
}

export function GlobalSidebar({
  sidebarHeader,
  tenants,
  currentTenant,
  onTenantChange,
}: GlobalSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const location = useLocation()
  const data = useData()
  const basePath = useBasePath()
  const groups = filterSidebarGroupsByRole(SIDEBAR_GROUPS, data.currentRole)

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: tenant switcher or custom override ── */}
      <SidebarHeader>
        {sidebarHeader ?? (
          <TenantSwitcher
            tenants={tenants}
            currentTenant={currentTenant}
            onTenantChange={onTenantChange}
          />
        )}
      </SidebarHeader>

      {/* ── Navigation groups ── */}
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const hasChildren = item.children && item.children.length > 0
                  const itemHref = item.href ? basePath + item.href : undefined
                  const isActive = itemHref
                    ? isActiveRoute(
                        location.pathname,
                        itemHref,
                        itemHref === basePath || itemHref === basePath + "/"
                      )
                    : false
                  const isParentActive = hasChildren
                    ? item.children!.some(
                        (child) =>
                          child.href &&
                          location.pathname.startsWith(basePath + child.href)
                      )
                    : false

                  // Items with nested children → collapsible section
                  if (hasChildren) {
                    return (
                      <Collapsible
                        key={item.label}
                        asChild
                        defaultOpen={isParentActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.label}
                              isActive={isParentActive}
                            >
                              <Icon strokeWidth={ICON_STROKE_WIDTH} />
                              <span>{item.label}</span>
                              <ChevronRight
                                strokeWidth={ICON_STROKE_WIDTH}
                                className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children!.map((child) => {
                                const ChildIcon = child.icon
                                const childHref = child.href
                                  ? basePath + child.href
                                  : undefined
                                const isChildActive = childHref
                                  ? isActiveRoute(location.pathname, childHref, true)
                                  : false
                                return (
                                  <SidebarMenuSubItem key={child.label}>
                                    <SidebarMenuSubButton
                                      asChild={!!childHref}
                                      isActive={isChildActive}
                                      onClick={childHref ? handleNavClick : undefined}
                                    >
                                      {childHref ? (
                                        <Link to={childHref}>
                                          {ChildIcon && (
                                            <ChildIcon strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                                          )}
                                          <span>{child.label}</span>
                                        </Link>
                                      ) : (
                                        <div>
                                          {ChildIcon && (
                                            <ChildIcon strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                                          )}
                                          <span>{child.label}</span>
                                        </div>
                                      )}
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  // Flat nav item
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild={!!itemHref}
                        tooltip={item.label}
                        isActive={isActive}
                        onClick={itemHref ? handleNavClick : undefined}
                      >
                        {itemHref ? (
                          <Link to={itemHref}>
                            <Icon strokeWidth={ICON_STROKE_WIDTH} />
                            <span>{item.label}</span>
                          </Link>
                        ) : (
                          <div>
                            <Icon strokeWidth={ICON_STROKE_WIDTH} />
                            <span>{item.label}</span>
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
