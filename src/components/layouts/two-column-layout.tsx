import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { cn } from "@/lib/utils"

interface TwoColumnLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
  resizable?: boolean
  // Resizable mode props (percentage-based)
  defaultLeftWidth?: number
  defaultRightWidth?: number
  minLeftWidth?: number
  minRightWidth?: number
  // Fixed width mode props
  leftWidth?: string
  rightWidth?: string
  // Optional headers and footers
  leftHeader?: React.ReactNode
  leftFooter?: React.ReactNode
  rightHeader?: React.ReactNode
  rightFooter?: React.ReactNode
  // Styling options
  showSeparator?: boolean
  scrollable?: boolean // Whether to wrap content in ScrollArea
  noPadding?: boolean // Whether to remove padding from content areas
  leftClassName?: string
  rightClassName?: string
  className?: string
}

export function TwoColumnLayout({
  left,
  right,
  resizable = true,
  defaultLeftWidth = 50,
  defaultRightWidth = 50,
  minLeftWidth = 20,
  minRightWidth = 20,
  leftWidth = "50%",
  rightWidth = "50%",
  leftHeader,
  leftFooter,
  rightHeader,
  rightFooter,
  showSeparator = true,
  scrollable = true,
  noPadding = false,
  leftClassName,
  rightClassName,
  className,
}: TwoColumnLayoutProps) {
  const leftSection = (
    <div className={cn("flex h-full flex-col border-r bg-background", leftClassName)}>
      {leftHeader && (
        <>
          <div className="border-b bg-muted/50 p-4">{leftHeader}</div>
          {showSeparator && <Separator />}
        </>
      )}
      {scrollable ? (
        <ScrollArea className="flex-1">
          {noPadding ? left : <div className="p-4">{left}</div>}
        </ScrollArea>
      ) : (
        <div className="flex-1 overflow-auto">{noPadding ? left : <div className="p-4">{left}</div>}</div>
      )}
      {leftFooter && (
        <>
          {showSeparator && <Separator />}
          <div className="border-t bg-muted/50 p-4">{leftFooter}</div>
        </>
      )}
    </div>
  )

  const rightSection = (
    <div className={cn("flex h-full flex-col bg-background", rightClassName)}>
      {rightHeader && (
        <>
          <div className="border-b bg-muted/50 p-4">{rightHeader}</div>
          {showSeparator && <Separator />}
        </>
      )}
      {scrollable ? (
        <ScrollArea className="flex-1">
          {noPadding ? right : <div className="p-4">{right}</div>}
        </ScrollArea>
      ) : (
        <div className="flex-1 overflow-auto">{noPadding ? right : <div className="p-4">{right}</div>}</div>
      )}
      {rightFooter && (
        <>
          {showSeparator && <Separator />}
          <div className="border-t bg-muted/50 p-4">{rightFooter}</div>
        </>
      )}
    </div>
  )

  if (!resizable) {
    return (
      <div className={cn("flex h-full", className)}>
        <div style={{ width: leftWidth === "auto" ? undefined : leftWidth }} className={leftWidth === "auto" ? "flex-1" : ""}>
          {leftSection}
        </div>
        <div style={{ width: rightWidth === "auto" ? undefined : rightWidth }} className={rightWidth === "auto" ? "flex-1" : ""}>
          {rightSection}
        </div>
      </div>
    )
  }

  return (
    <ResizablePrimitive.Group
      {...({ direction: "horizontal" } as any)}
      className={cn("flex h-full w-full", className)}
    >
      {/* Left Section */}
      <ResizablePanel defaultSize={defaultLeftWidth} minSize={minLeftWidth}>
        {leftSection}
      </ResizablePanel>

      <ResizableHandle className="hover:bg-border/50 transition-colors cursor-col-resize" />

      {/* Right Section */}
      <ResizablePanel defaultSize={defaultRightWidth} minSize={minRightWidth}>
        {rightSection}
      </ResizablePanel>
    </ResizablePrimitive.Group>
  )
}

