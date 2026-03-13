import { PageHeader } from "@/components/blocks/page-header"
import { PageTabs } from "@/components/blocks/page-tabs"

interface PageHeaderWithTabsProps {
  title: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  tabs: Array<{
    value: string
    label: string
  }>
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function PageHeaderWithTabs({
  title,
  leading,
  actions,
  tabs,
  defaultValue,
  value,
  onValueChange,
}: PageHeaderWithTabsProps) {
  return (
    <>
      <PageHeader title={title} leading={leading} actions={actions} noBorder />
      <PageTabs
        tabs={tabs}
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
      />
    </>
  )
}

