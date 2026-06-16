
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, ScanLine, FileText, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsServiceInstance } from '@/services/artisan/notificationsServices'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn, formatRelativeDate } from '@/lib/utils'
interface Notification {
  id: string
  type: "scan" | "quote" | "system"
  title: string
  message: string
  time: string
  read: boolean
  slug: string
  quoteId: string
}
const ArtisanNotifications = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const [refreshKey, setRefreshKey] = useState(0)

  // Update relative time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const data = await NotificationsServiceInstance.getUserNotifications(user.id)
        setNotifications(
          data.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            time: n.created_at,
            read: n.is_read,
            slug: n.metadata?.scan_slug || '',
            quoteId: n.metadata?.quoteId || '',
          })) 
        )
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user?.id])


  useEffect(() => {
    if (!user?.id) return

    const channel =
      NotificationsServiceInstance.subscribeToNotifications(user.id, (notif) => {
        setNotifications(prev => [
          {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            time: notif.created_at,
            read: notif.is_read,
            slug: notif.metadata?.scan_slug || '',
            quoteId: notif.metadata?.quoteId || '',
          },
          ...prev,
        ])
      })

    return () => {
      NotificationsServiceInstance.unsubscribe(channel)
    }
  }, [user?.id])






  const markAsRead = async (id: string) => {
    await NotificationsServiceInstance.markAsRead(id)

    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    )
  }


  const markAllAsRead = async () => {
    if (!user?.id) return

    await NotificationsServiceInstance.markAllAsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }


  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "scan":
        return {
          icon: <ScanLine className="h-4 w-4 text-primary" />,
          bg: "bg-primary/10",
          border: "border-primary/20",
          color: "text-primary"
        }
      case "quote":
        return {
          icon: <FileText className="h-4 w-4 text-success" />,
          bg: "bg-success/10",
          border: "border-success/20",
          color: "text-success"
        }
      case "system":
        return {
          icon: <AlertCircle className="h-4 w-4 text-warning" />,
          bg: "bg-warning/10",
          border: "border-warning/20",
          color: "text-warning"
        }
      default:
        return {
          icon: <Bell className="h-4 w-4 text-muted-foreground" />,
          bg: "bg-muted",
          border: "border-border",
          color: "text-muted-foreground"
        }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-12 rounded-full hover:bg-muted transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Bell className="h-5! w-5! text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-5 w-5 border-2 border-background items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-in zoom-in duration-300">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72! sm:w-96! p-0 overflow-hidden border-border/50 shadow-2xl rounded-sm" align="end" sideOffset={1}>
        <div className="flex items-center justify-between py-2 px-4 border-b bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-base tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold px-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[470px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-16 h-16 bg-muted rounded-2xl flex items-center justify-center transform rotate-12">
                  <Bell className="h-8 w-8 text-muted-foreground/50 -rotate-12" />
                </div>
              </div>
              <h4 className="font-semibold text-foreground mb-1">C'est bien calme ici</h4>
              <p className="text-sm text-muted-foreground max-w-xs">
                Vous n'avez pas encore de notifications. Restez à l'écoute !
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification, index) => {
                const config = getNotificationConfig(notification.type)
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-all duration-200 cursor-pointer group border-b last:border-0 relative",
                      !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50",
                      "animate-in fade-in slide-in-from-top-2 duration-300"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.type === "scan") {
                        if (user.role === "artisan") {
                          navigate(`/scans/${notification.slug}`)
                        }else{
                          navigate(`/admin/scans/${notification.slug}`)
                        }
                      }else if (notification.type === "quote") {
                        if (user.role === "artisan") {
                          navigate(`/devis/${notification.quoteId}`)
                        }else{
                          navigate(`/admin/devis/${notification.quoteId}`)
                        }
                      }else if (notification.type === "system") {
                        navigate(`/system/${notification.slug}`)
                      } 
                      setOpen(false)

                    }}
                  >
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                    <div className="flex gap-4">
                      <div className="shrink-0 pt-0.5">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                          config.bg,
                          config.border,
                          "border shadow-sm"
                        )}>
                          {config.icon}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <p className={cn(
                            "text-[13px] leading-snug tracking-tight flex-1 min-w-0",
                            !notification.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground/80 whitespace-nowrap mt-0.5 shrink-0 bg-muted/50 px-1.5 py-0.5 rounded-sm">
                            {formatRelativeDate(notification.time)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-normal mb-2.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider",
                            config.bg,
                            config.color
                          )}>
                            {notification.type === "scan" ? "Scan" : notification.type === "quote" ? "Devis" : "Système"}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-semibold text-primary/70 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marquer lu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* {notifications.length > 0 && (
          <div className="p-2.5 bg-muted/10 border-t">
            <Button
              variant="ghost"
              className="w-full h-10 text-[13px] font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
            >
              Voir toutes les notifications
            </Button>
          </div>
        )} */}
      </PopoverContent>
    </Popover>
  )
}

export default ArtisanNotifications