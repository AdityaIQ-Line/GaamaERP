import { DataProvider } from "@/context/DataContext"
import { BasePathProvider } from "@/context/BasePathContext"
import { AppShell } from "@/components/layouts/app-shell"
import {
  DEFAULT_STORAGE_KEY,
  SANDBOX_STORAGE_KEY,
} from "@/context/DataContext"
import { Button } from "@/components/ui/button"
import { FlaskConical } from "lucide-react"

function SandboxBanner() {
  const resetSandbox = () => {
    localStorage.removeItem(SANDBOX_STORAGE_KEY)
    window.location.href = "/sandbox"
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-500/15 text-amber-800 dark:text-amber-200 border-b border-amber-500/30 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <FlaskConical className="size-4" />
        Sandbox — data is isolated from the main app
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-amber-500/50 hover:bg-amber-500/20"
          onClick={resetSandbox}
        >
          Reset sandbox data
        </Button>
      </div>
    </div>
  )
}

interface AppDataLayoutProps {
  /** Use sandbox storage and show sandbox banner */
  sandboxMode?: boolean
}

/**
 * Wraps the app with DataProvider and BasePathProvider, then renders AppShell.
 * Use sandboxMode for the /sandbox route so data is isolated.
 */
export function AppDataLayout({ sandboxMode }: AppDataLayoutProps) {
  const storageKey = sandboxMode ? SANDBOX_STORAGE_KEY : DEFAULT_STORAGE_KEY
  const basePath = sandboxMode ? "/sandbox" : ""

  return (
    <DataProvider storageKey={storageKey}>
      <BasePathProvider basePath={basePath}>
        {sandboxMode && <SandboxBanner />}
        <AppShell />
      </BasePathProvider>
    </DataProvider>
  )
}

