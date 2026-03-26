import { RouterProvider } from "react-router-dom"
import { ErrorBoundary } from "@/components/blocks/error-boundary"
import { router } from "./router"

const MAINTENANCE_MODE = true

export function App() {
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
          <div className="w-full rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">Temporarily Unavailable</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This application is under maintenance. Please check back later.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App

