import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onChange?: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  /** Max number of badge chips shown before collapsing to "+N more" */
  maxDisplay?: number
  className?: string
}

/**
 * MultiSelect — a combobox that supports selecting multiple options,
 * displaying them as removable badge chips.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = React.useState<string[]>([])
 * <MultiSelect
 *   options={[
 *     { value: "react", label: "React" },
 *     { value: "vue", label: "Vue" },
 *     { value: "svelte", label: "Svelte" },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Select technologies…"
 * />
 * ```
 */
export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select options…",
  searchPlaceholder = "Search…",
  emptyMessage = "No options found.",
  disabled = false,
  maxDisplay = 3,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (optionValue: string) => {
    const next = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange?.(next)
  }

  const handleRemove = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation()
    onChange?.(value.filter((v) => v !== optionValue))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.([])
  }

  const selectedLabels = value.map(
    (v) => options.find((o) => o.value === v)?.label ?? v
  )

  const visibleChips = selectedLabels.slice(0, maxDisplay)
  const overflowCount = selectedLabels.length - maxDisplay

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={cn(
            "w-full min-h-9 h-auto justify-between px-3 py-1.5 font-normal",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {visibleChips.map((label) => {
                  const opt = options.find((o) => o.label === label)
                  return (
                    <Badge
                      key={opt?.value ?? label}
                      variant="secondary"
                      className="text-xs gap-1 pr-1"
                    >
                      {label}
                      <button
                        type="button"
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                        onClick={(e) => handleRemove(e, opt?.value ?? label)}
                        aria-label={`Remove ${label}`}
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  )
                })}
                {overflowCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{overflowCount} more
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value.length > 0 && (
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted transition-colors"
                onClick={handleClearAll}
                aria-label="Clear all"
              >
                <X strokeWidth={ICON_STROKE_WIDTH} className="size-3 text-muted-foreground" />
              </button>
            )}
            <ChevronsUpDown strokeWidth={ICON_STROKE_WIDTH} className="size-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => handleToggle(option.value)}
                    className="gap-2"
                  >
                    <div className={cn(
                      "flex size-4 items-center justify-center rounded-sm border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input opacity-50"
                    )}>
                      {isSelected && <Check strokeWidth={ICON_STROKE_WIDTH} className="size-3" />}
                    </div>
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
