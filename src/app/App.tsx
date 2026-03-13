import { RouterProvider } from "react-router-dom"
import { ErrorBoundary } from "@/components/blocks/error-boundary"
import { router } from "./router"

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App

