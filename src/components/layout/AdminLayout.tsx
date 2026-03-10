import { Outlet } from "react-router-dom"
import { Header } from "../header"
import { AdminSidebar } from "../Menus/AdminSidebar"
// import MobileSidebar from "../Menus/MobileSibar"


export function AdminLayout() {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto h-fit sm:pb-0">
          <Outlet />
        </main>
        {/* <MobileSidebar /> */}
      </div>
    </div>
  )
}
