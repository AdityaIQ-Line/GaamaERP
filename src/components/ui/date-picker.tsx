import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

// ─── Single Date Picker ─────────────────────────────────────────────────────

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Date format string, defaults to "PPP" (e.g. "April 3, 2024") */
  dateFormat?: string
}

/**
 * DatePicker — single-date selection via a popover calendar.
 *
 * @example
 * ```tsx
 * const [date, setDate] = React.useState<Date>()
 * <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
 * ```
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  dateFormat = "PPP",
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon strokeWidth={ICON_STROKE_WIDTH} className="mr-2 size-4" />
          {value ? format(value, dateFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── Date Range Picker ──────────────────────────────────────────────────────

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  dateFormat?: string
  numberOfMonths?: number
}

/**
 * DateRangePicker — select a start and end date via a popover calendar.
 *
 * @example
 * ```tsx
 * const [range, setRange] = React.useState<DateRange>()
 * <DateRangePicker value={range} onChange={setRange} />
 * ```
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
  dateFormat = "LLL dd, y",
  numberOfMonths = 2,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon strokeWidth={ICON_STROKE_WIDTH} className="mr-2 size-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, dateFormat)} – {format(value.to, dateFormat)}
              </>
            ) : (
              format(value.from, dateFormat)
            )
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
        />
      </PopoverContent>
    </Popover>
  )
}
