import * as React from "react"
import { Upload, X, File, ImageIcon, FileText, FileCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

export interface UploadedFile {
  id: string
  file: File
  preview?: string
  progress?: number
  error?: string
}

interface FileUploadProps {
  /** Allow selecting multiple files */
  multiple?: boolean
  /** Accepted MIME types or extensions, e.g. "image/*,.pdf" */
  accept?: string
  /** Max file size in bytes */
  maxSize?: number
  /** Max number of files (only relevant when multiple=true) */
  maxFiles?: number
  /** Current list of uploaded files */
  value?: UploadedFile[]
  onChange?: (files: UploadedFile[]) => void
  /** Called when files are added (useful for triggering uploads) */
  onFilesAdded?: (files: File[]) => void
  disabled?: boolean
  className?: string
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon
  if (file.type.includes("pdf") || file.type.includes("text")) return FileText
  if (file.type.includes("code") || file.name.match(/\.(ts|js|tsx|jsx|json|yaml|yml)$/)) return FileCode
  return File
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * FileUpload — drag-and-drop file input with preview list.
 *
 * Handles file validation (type, size, count) and shows per-file
 * progress / error states. Upload logic is external (use `onFilesAdded`).
 *
 * @example
 * ```tsx
 * <FileUpload
 *   accept="image/*,.pdf"
 *   maxSize={5 * 1024 * 1024}
 *   multiple
 *   onFilesAdded={(files) => uploadFiles(files)}
 * />
 * ```
 */
export function FileUpload({
  multiple = false,
  accept,
  maxSize = 10 * 1024 * 1024, // 10 MB default
  maxFiles = 10,
  value = [],
  onChange,
  onFilesAdded,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const validateAndAdd = (rawFiles: FileList | File[]) => {
    const files = Array.from(rawFiles)
    const newEntries: UploadedFile[] = []

    for (const file of files) {
      if (value.length + newEntries.length >= maxFiles) break

      let error: string | undefined
      if (maxSize && file.size > maxSize) {
        error = `File exceeds ${formatBytes(maxSize)} limit`
      }

      const entry: UploadedFile = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        progress: 0,
        error,
      }
      newEntries.push(entry)
    }

    const validFiles = newEntries.filter((e) => !e.error).map((e) => e.file)
    if (validFiles.length > 0) onFilesAdded?.(validFiles)
    onChange?.([...value, ...newEntries])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    validateAndAdd(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) validateAndAdd(e.target.files)
    e.target.value = "" // reset so same file can be re-added after removal
  }

  const handleRemove = (id: string) => {
    const entry = value.find((f) => f.id === id)
    if (entry?.preview) URL.revokeObjectURL(entry.preview)
    onChange?.(value.filter((f) => f.id !== id))
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-input hover:border-primary/50 hover:bg-muted/30",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none"
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Upload strokeWidth={ICON_STROKE_WIDTH} className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">
            <span className="text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept ? `Accepted: ${accept}` : "Any file type"} · Max {formatBytes(maxSize)}
            {multiple && maxFiles < 100 ? ` · Up to ${maxFiles} files` : ""}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="sr-only"
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((entry) => {
            const Icon = getFileIcon(entry.file)
            return (
              <li
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  entry.error && "border-destructive/50 bg-destructive/5"
                )}
              >
                {/* Preview or icon */}
                {entry.preview ? (
                  <img src={entry.preview} alt={entry.file.name} className="size-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded bg-muted shrink-0">
                    <Icon strokeWidth={ICON_STROKE_WIDTH} className="size-5 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">{entry.file.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatBytes(entry.file.size)}</p>
                    {entry.error && <p className="text-xs text-destructive">{entry.error}</p>}
                  </div>
                  {entry.progress !== undefined && !entry.error && entry.progress < 100 && (
                    <Progress value={entry.progress} className="h-1" />
                  )}
                </div>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemove(entry.id)}
                  aria-label={`Remove ${entry.file.name}`}
                >
                  <X strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
