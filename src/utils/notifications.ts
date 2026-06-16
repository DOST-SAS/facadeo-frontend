import { useEffect } from "react"
import { supabase } from "@/api/api"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY!

export function usePushNotifications(userId: string) {
  useEffect(() => {
    if (!userId) return

    async function register() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

      const permission = await Notification.requestPermission()
      if (permission !== "granted") return console.warn("Permission denied for notifications")

      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js")

        const existingSub = await registration.pushManager.getSubscription()
        if (existingSub) return // already subscribed

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        const { error } = await supabase.from("push_subscriptions").upsert({
          profile_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.getKey("p256dh") ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))) : "",
          auth: subscription.getKey("auth") ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))) : ""
        })

        if (error) console.error("Failed to save subscription:", error)
      } catch (err) {
        console.error("Push registration failed", err)
      }
    }

    register()
  }, [userId])
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)))
}
