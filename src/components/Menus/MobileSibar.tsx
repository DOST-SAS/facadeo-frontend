import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ScanLine, FileText, CreditCard, Settings, PlusCircle, CircleFadingPlus } from "lucide-react"

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Scans", href: "/scans", icon: ScanLine },
    { name: "Devis", href: "/devis", icon: FileText },
    { name: "Abonnement", href: "/abonnement", icon: CreditCard },
    { name: "Paramètres", href: "/parametres", icon: Settings },
    { name: "Ajouter un scan", href: "/scans/create", icon: PlusCircle },
]

const MobileSidebar = () => {
    const location = useLocation()
    const pathname = location.pathname

    return (
        <div className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[90%] rounded-full bg-muted border border-border shadow-md">
            <nav className="flex items-center justify-around p-2">
                {navigation.map((item) => {
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

                    return (item.name === "Ajouter un scan" ? (
                        <Link to="/scans/create"
                            className={cn(
                                "flex items-center  bg-primary/10 hover:bg-primary/20 text-primary justify-center p-2 rounded-sm transition-all duration-300 group relative overflow-hidden",
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out",
                            )} />
                            <CircleFadingPlus className={cn(
                                "h-5 w-5 transition-transform duration-300",
                            )} />
                        </Link>
                    ) : (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-primary text-white shadow-md"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />

                        </Link>
                    )
                    )
                })}
            </nav>
        </div>
    )
}

export default MobileSidebar