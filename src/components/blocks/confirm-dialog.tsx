import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  /** Trigger element. If omitted, control open state via `open` prop. */
  trigger?: React.ReactNode
  /** Controlled open state */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Dialog title */
  title?: string
  /** Dialog description / body text */
  description?: React.ReactNode
  /** Label for the confirm button */
  confirmLabel?: string
  /** Label for the cancel button */
  cancelLabel?: string
  /** Visual variant of the confirm button */
  confirmVariant?: VariantProps<typeof buttonVariants>["variant"]
  /** Called when the user clicks Confirm */
  onConfirm: () => void | Promise<void>
  /** Called when the user cancels */
  onCancel?: () => void
  /** Show a loading state on the confirm button */
  isLoading?: boolean
  className?: string
}

/**
 * ConfirmDialog — reusable confirmation dialog built on AlertDialog.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   trigger={<Button variant="destructive">Delete</Button>}
 *   title="Delete item?"
 *   description="This action cannot be undone. The item will be permanently deleted."
 *   confirmLabel="Delete"
 *   confirmVariant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
  className,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  const isConfirming = isLoading || loading

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent className={cn(className)}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isConfirming}>
              {cancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant={confirmVariant} onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? "Please wait…" : confirmLabel}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className={cn(className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isConfirming}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant={confirmVariant} onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? "Please wait…" : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
