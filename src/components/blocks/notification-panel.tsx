import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, CheckCheck, Info, AlertTriangle, XCircle } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description?: string
  timestamp: Date
  read: boolean
  href?: string
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: XCircle,
}

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-destructive",
}

// Sample notifications — replace with real data source in production
const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "info",
    title: "New project assigned",
    description: "You've been assigned to the Website Redesign project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: "2",
    type: "success",
    title: "Deployment successful",
    description: "Production build v2.4.1 deployed successfully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Storage limit approaching",
    description: "You've used 85% of your storage quota.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: "4",
    type: "error",
    title: "API rate limit exceeded",
    description: "The integration service returned a 429 error.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Weekly report ready",
    description: "Your weekly analytics report is available.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
]

interface NotificationPanelProps {
  notifications?: Notification[]
  onMarkAllRead?: () => void
  onNotificationClick?: (notification: Notification) => void
}

/**
 * NotificationPanel
 *
 * A dropdown notification centre in the global header.
 * Shows a badge count for unread notifications and lets users
 * mark all as read or open individual notifications.
 *
 * @example
 * ```tsx
 * <NotificationPanel
 *   notifications={userNotifications}
 *   onNotificationClick={(n) => navigate(n.href)}
 * />
 * ```
 */
export function NotificationPanel({
  notifications: initialNotifications = DEFAULT_NOTIFICATIONS,
  onMarkAllRead,
  onNotificationClick,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = React.useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    onMarkAllRead?.()
  }

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
    onNotificationClick?.(notification)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0 px-1 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleMarkAllRead}
            >
              <CheckCheck strokeWidth={ICON_STROKE_WIDTH} className="size-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type]
              const iconColor = NOTIFICATION_COLORS[notification.type]
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn("mt-0.5 shrink-0", iconColor)}>
                    <Icon strokeWidth={ICON_STROKE_WIDTH} className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-muted-foreground hover:text-foreground">
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
