import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  /** Section heading */
  title: string
  /** Optional supporting description rendered below the title */
  description?: string
  /** Form fields or any content */
  children: React.ReactNode
  className?: string
  /** When true, renders title + description inline to the left, fields to the right (two-column form layout) */
  aside?: boolean
  /** Hide the bottom separator */
  noSeparator?: boolean
}

/**
 * FormSection — a labelled group of form fields with an optional description.
 *
 * Use this whenever a form has multiple logical sections (e.g. "Personal Info",
 * "Security", "Notifications"). Supports both stacked and side-by-side layouts.
 *
 * @example
 * ```tsx
 * // Stacked (default)
 * <FormSection title="Personal Information" description="Update your name and email.">
 *   <Input placeholder="Name" />
 *   <Input placeholder="Email" />
 * </FormSection>
 *
 * // Aside layout — title on the left, fields on the right
 * <FormSection aside title="Notifications" description="Choose what you hear about.">
 *   <Switch label="Email updates" />
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  children,
  className,
  aside = false,
  noSeparator = false,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-0", className)}>
      <div className={cn(aside ? "grid gap-8 md:grid-cols-3 py-6" : "space-y-4 py-6")}>
        {/* Title + description */}
        <div className={cn(aside ? "md:col-span-1 space-y-1" : "space-y-1")}>
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Fields */}
        <div className={cn("space-y-4", aside && "md:col-span-2")}>
          {children}
        </div>
      </div>

      {!noSeparator && <Separator />}
    </div>
  )
}
