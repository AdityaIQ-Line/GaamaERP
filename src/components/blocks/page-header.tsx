import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  noBorder?: boolean
}

export function PageHeader({ title, leading, actions, noBorder }: PageHeaderProps) {
  const headerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={headerRef}
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-6 transition-all border-b",
        noBorder && "border-b-0"
      )}
    >
      <div className="flex items-center gap-2">
        {leading}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

