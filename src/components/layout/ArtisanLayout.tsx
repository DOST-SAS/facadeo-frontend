import { Outlet } from "react-router-dom"
import { Header } from "../header"
import { ArtisanSidebar } from "../Menus/AtisanSidebar"
import MobileSidebar from "../Menus/MobileSibar"


export function ArtisanLayout() {
  return (
    <div className="flex h-screen bg-background">
      <ArtisanSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto h-fit pb-16 sm:pb-0">
          <Outlet />
        </main>
        <MobileSidebar />
      </div>
    </div>
  )
}
