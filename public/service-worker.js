self.addEventListener("push", (event) => {
  const data = event.data?.json() || {}
  const title = data.title || "Nouvelle notification"
  const options = {
    body: data.message,
    data: data.url || "/",
    icon: "/whiteLogo.png",
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data))
})
