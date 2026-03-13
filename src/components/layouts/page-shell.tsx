import * as React from "react"

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      {children}
    </div>
  )
}

