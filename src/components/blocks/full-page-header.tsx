import { ArrowLeft } from "lucide-react"

export interface FullPageHeaderProps {
  /** Screen title shown next to the back control (e.g. "Add Customer"). */
  title: string
  /** Close / navigate back (e.g. return to list, cancel form). */
  onBack: () => void
  className?: string
}

/**
 * Gaama ERP full-page flows inside `PageShell`: **back arrow + title only**.
 * No breadcrumb trail in this row; keep subtitles optional below if needed.
 */
export function FullPageHeader({ title, onBack, className }: FullPageHeaderProps) {
  return (
    <div className={className ?? "flex items-center gap-2 text-sm"}>
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <span className="font-medium">{title}</span>
    </div>
  )
}
