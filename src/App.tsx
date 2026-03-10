import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { RouterProvider } from "react-router-dom"
import { router } from "./routes/routes"
import { Toaster } from "react-hot-toast"
import { usePushNotifications } from "./utils/notifications"
function NotificationsWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  usePushNotifications(user?.id ?? "")

  return <>{children}</>
}


function App() {

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AuthProvider>
        <NotificationsWrapper>
          <Toaster
            position="top-right"
            containerClassName={"mt-12"}
            reverseOrder={false} />
          <RouterProvider router={router} />
        </NotificationsWrapper>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
