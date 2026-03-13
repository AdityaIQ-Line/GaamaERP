import { PageHeader } from "@/components/blocks/page-header"
import { BackButton } from "@/components/blocks/back-button"
import { cn } from "@/lib/utils"

interface PageHeaderWithBackProps {
  title: string
  actions?: React.ReactNode
  backButton?: {
    label?: string
    href?: string
    onClick?: () => void
  }
  className?: string
  noBorder?: boolean
}

export function PageHeaderWithBack({ title, actions, backButton, className, noBorder }: PageHeaderWithBackProps) {
  return (
    <div className={cn(className, noBorder && "!border-b-0")}>
      <PageHeader
        title={title}
        leading={<BackButton {...backButton} />}
        actions={actions}
        noBorder={noBorder}
      />
    </div>
  )
}

