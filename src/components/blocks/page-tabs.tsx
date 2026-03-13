import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface PageTab {
  value: string
  label: string
  badge?: string | number
  disabled?: boolean
}

interface PageTabsProps {
  tabs: PageTab[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function PageTabs({ tabs, defaultValue, value, onValueChange }: PageTabsProps) {
  return (
    <div className="border-b pl-2 pr-6">
      <Tabs value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
        <TabsList variant="line" className="h-9">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={tab.disabled}
              className="px-4 gap-2"
            >
              {tab.label}
              {tab.badge !== undefined && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-5 px-1">
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
