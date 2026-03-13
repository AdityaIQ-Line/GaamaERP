import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Tray and Well Types
export type WellStatus = "empty" | "unassigned" | "unassigned-urgent" | "request-sent" | "assigned"

export interface Well {
  id: string
  row: number
  col: string
  status: WellStatus
  sampleId?: string
}

export interface Tray {
  id: string
  name: string
  columns: string[]
  rows: number
  wells: Well[]
}

interface WellComponentProps {
  well: Well
  isSelected: boolean
  onSelect: () => void
}

function WellComponent({ well, isSelected, onSelect }: WellComponentProps) {
  const getWellStyles = () => {
    const baseStyles = "w-full aspect-square rounded-full border-2 cursor-pointer transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 max-w-[36px] min-w-[24px]"
    
    if (isSelected) {
      return `${baseStyles} border-primary bg-primary/20 ring-2 ring-primary/20`
    }

    switch (well.status) {
      case "unassigned":
        return `${baseStyles} border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400`
      case "unassigned-urgent":
        return `${baseStyles} border-red-500 bg-red-50 dark:bg-red-950/50 dark:border-red-400`
      case "request-sent":
        return `${baseStyles} border-green-500 bg-green-50 dark:bg-green-950/50 dark:border-green-400`
      case "assigned":
        return `${baseStyles} border-purple-500 bg-purple-50 dark:bg-purple-950/50 dark:border-purple-400`
      default:
        return `${baseStyles} border-border bg-muted/50`
    }
  }

  return (
    <button
      onClick={onSelect}
      className={getWellStyles()}
      aria-label={`Well ${well.col}${well.row} - ${well.status}`}
      title={`${well.col}${well.row}: ${well.status}`}
      type="button"
    />
  )
}

export interface TrayCardProps {
  tray: Tray
  selectedWells: Set<string>
  onWellSelect: (wellId: string) => void
}

export function TrayCard({ tray, selectedWells, onWellSelect }: TrayCardProps) {
  const filledWells = tray.wells.filter((w) => w.status !== "empty").length
  const totalWells = tray.wells.length
  
  return (
    <Card className="overflow-hidden flex flex-col h-full p-0">
      {/* Header Section */}
      <div className="px-4 py-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{tray.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filledWells}/{totalWells}
          </Badge>
        </div>
      </div>
      
      {/* Content Section */}
      <CardContent className="px-2 pt-2 pb-2 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col flex-1 justify-between min-h-0">
          {/* Column Headers */}
          <div className="flex gap-2 pl-5 mb-0.5 shrink-0">
            {tray.columns.map((col) => (
              <div key={col} className="flex-1 text-center text-[10px] font-semibold text-muted-foreground uppercase min-w-0">
                {col}
              </div>
            ))}
          </div>
          
          {/* Rows Container */}
          <div className="flex flex-col flex-1 justify-evenly min-h-0">
            {Array.from({ length: tray.rows }, (_, rowIndex) => {
              const rowNum = rowIndex + 1
              return (
                <div key={rowNum} className="flex items-center gap-2 min-h-0">
                  {/* Row Number */}
                  <div className="w-4 text-[10px] font-semibold text-muted-foreground text-right shrink-0">
                    {rowNum}
                  </div>
                  {/* Wells */}
                  <div className="flex gap-2 flex-1 min-w-0">
                    {tray.columns.map((col) => {
                      const well = tray.wells.find((w) => w.row === rowNum && w.col === col)
                      if (!well) return null
                      return (
                        <div key={well.id} className="flex-1 flex justify-center">
                          <WellComponent
                            well={well}
                            isSelected={selectedWells.has(well.id)}
                            onSelect={() => onWellSelect(well.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
      
      {/* Footer Section */}
      <div className="px-4 py-3 border-t shrink-0">
        <div className="text-xs text-muted-foreground text-center">
          {tray.columns.length} columns × {tray.rows} rows
        </div>
      </div>
    </Card>
  )
}


