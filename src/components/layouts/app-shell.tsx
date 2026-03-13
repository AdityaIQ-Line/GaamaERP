import * as React from "react"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { GlobalHeader } from "@/components/blocks/global-header"
import { GlobalSidebar, type Tenant } from "@/components/blocks/global-sidebar"
import { GlobalFooter } from "@/components/blocks/global-footer"
import { CommandPalette } from "@/components/blocks/command-palette"

/**
 * User context shared across AppShell children.
 * Replace with a real auth context/store in production.
 */
export interface AppUser {
  name: string
  email: string
  avatar?: string
}

interface AppShellProps {
  breadcrumbs?: Array<{ label: string; href?: string }>
  onLogout?: () => void
  user?: AppUser
  /** Fully override the sidebar header */
  sidebarHeader?: React.ReactNode
  /** List of available tenants/workspaces — enables switcher when length > 1 */
  tenants?: Tenant[]
  /** Currently selected tenant */
  currentTenant?: Tenant
  /** Called when the user picks a different tenant */
  onTenantChange?: (tenant: Tenant) => void
  /** @deprecated use `user` prop instead */
  userName?: string
  /** @deprecated use `user` prop instead */
  userEmail?: string
  /** @deprecated use `user` prop instead */
  userAvatar?: string
}

export function AppShell({
  breadcrumbs,
  onLogout,
  user,
  sidebarHeader,
  tenants,
  currentTenant,
  onTenantChange,
  userName,
  userEmail,
  userAvatar,
}: AppShellProps) {
  const resolvedUser: AppUser = user ?? {
    name: userName ?? "John Doe",
    email: userEmail ?? "john@example.com",
    avatar: userAvatar,
  }

  const [commandOpen, setCommandOpen] = React.useState(false)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <GlobalSidebar
          sidebarHeader={sidebarHeader}
          tenants={tenants}
          currentTenant={currentTenant}
          onTenantChange={onTenantChange}
        />

        <SidebarInset className="flex h-full flex-col overflow-hidden">
          <GlobalHeader
            breadcrumbs={breadcrumbs}
            onLogout={onLogout}
            userName={resolvedUser.name}
            userEmail={resolvedUser.email}
            userAvatar={resolvedUser.avatar}
            onCommandPaletteOpen={() => setCommandOpen(true)}
          />

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>

          <GlobalFooter />
        </SidebarInset>
      </div>

      {/* Global command palette — Cmd+K / Ctrl+K */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  )
}
