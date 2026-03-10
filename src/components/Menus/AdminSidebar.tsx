import { cn } from "@/lib/utils"
import { LayoutDashboard, ScanLine, FileText, CreditCard, Settings, ChevronLeft, ChevronRight, LogOut, Users, Building, Briefcase, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "../theme-provider"


const navigation = [
  { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Scans", href: "/admin/scans", icon: ScanLine },
  { name: "Façades", href: "/admin/facades", icon: Building },
  { name: "Devis", href: "/admin/devis", icon: FileText },
  { name: "Abonnement", href: "/admin/abonnement", icon: CreditCard },
  { name: "Métiers", href: "/admin/metiers", icon: Briefcase},
  // { name: "Statistiques Crédits", href: "/admin/credits", icon: Coins },
  { name: "Paramètres", href: "/admin/parametres", icon: Settings },
]

export function AdminSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const [open, setOpen] = useState(true)
  const { signOut } = useAuth()
  const { theme } = useTheme()

  return (
    <aside className={cn("h-screen hidden sm:flex flex-col bg-card shadow-xl! transition-all duration-200 z-50 relative", open ? "w-16 md:w-56" : "w-16")}>
      {/* close open toggle */}
      <button className=" absolute top-4 -right-3 bg-background rounded-full p-1 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* Logo */}
      <div className={cn("flex items-center  gap-2 py-6  transition-all duration-200 px-2! justify-center  md:justify-start", open ? "px-6 justify-start" : "px-2 justify-center ")}>
        {theme === "dark" ? (
          <img src="/whiteLogo.png" alt="" className="rounded-full h-10 w-10 border border-border" />
        ) : (
          <img src="/darkLogo.png" alt="" className="rounded-full h-10 w-10 border border-border" />
        )}
        {open && (
          <h1 className="hidden md:block text-lg font-bold text-foreground">FAÇADEO</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(" flex-1  transition-all duration-200 px-2! ", open ? "px-4 py-6" : "px-2 py-2")}>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
            return (

              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  open ? "justify-start" : "justify-center"
                )}
              >
                <item.icon className="h-5 w-5" />
                {open && (
                  <span className="hidden md:block">{item.name}</span>
                )}
              </Link>
            )
          })}
        </ul>
      </nav>
      {/* deconnexion */}
      <div className="flex items-center justify-center p-4">
        <Button
          variant="outline"
          onClick={signOut}
          className={cn(
            "w-full rounded-sm border-border bg-card transition-all duration-200 group",
            "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
            open ? "justify-start px-3" : "justify-center px-2"
          )}
        >
          <LogOut className={cn("h-4 w-4", open && "mr-2")} />
          {open && (
            <span className="hidden md:block font-semibold">Déconnexion</span>
          )}
        </Button>
      </div>
    </aside>
  )
}
