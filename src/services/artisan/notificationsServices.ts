import { supabase } from "@/api/api"


export type NotificationType = "scan" | "quote" | "system"

export interface Notification {
  id: string
  profile_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  metadata?: Record<string, any>
  created_at: string
}

export class NotificationsService {

  /* ===================== FETCH ===================== */

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", userId)
      .eq("is_read", false)

    if (error) throw error
    return count ?? 0
  }

  /* ===================== UPDATE ===================== */

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)

    if (error) throw error
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", userId)
      .eq("is_read", false)

    if (error) throw error
  }

  /* ===================== CREATE ===================== */

  async createNotification(params: {
    profile_id: string
    type: NotificationType
    title: string
    message: string
    metadata?: Record<string, any>
  }): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .insert({
        profile_id: params.profile_id,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata ?? {},
      })

    if (error) throw error
  }

  /* ===================== REALTIME ===================== */

  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()
  }

  unsubscribe(channel: any) {
    supabase.removeChannel(channel)
  }

  /* ===================== OPTIONAL ===================== */

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)

    if (error) throw error
  }
}

export const NotificationsServiceInstance = new NotificationsService()
